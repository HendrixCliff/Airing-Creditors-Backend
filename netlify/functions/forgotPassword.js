const { CustomError } = require('./utils/CustomError'); // Replace with your CustomError implementation
const User = require('./models/userSchema'); // Import your User model
const { sendForgotPasswordEmail } = require('./utils/sendForgotPasswordEmail'); // Import your email utility

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);


    // Find the user by email
    const user = await User.findOne({ email: body.email });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'There is no user with this email address',
        }),
      };
    }

    // Generate the reset token
    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct the reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send the email
    try {
      await sendForgotPasswordEmail(user.email, resetUrl);

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'Password reset link sent to the user\'s email',
        }),
      };
    } catch (err) {
      // Clean up token fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Error sending email:', err.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'There was an error sending the email. Try again later.',
        }),
      };
    }
  } catch (err) {
    console.error('Error in forgotPassword function:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  }
};
