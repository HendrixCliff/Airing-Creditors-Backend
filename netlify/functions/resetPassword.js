const crypto = require('crypto');  
const User = require('./models/userSchema'); // Import your User model
const { generateAuthToken } = require('./utils/generateAuthToken'); // Replace with your token generation logic

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { token: resetToken } = event.queryStringParameters || {};

    if (!resetToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Reset token is required' }),
      };
    }

    // Hash the token to match the database value
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

 

    // Find the user with the matching reset token and valid expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Token is invalid or has expired' }),
      };
    }

    // Update the user's password
    user.password = body.password;
    user.confirmPassword = body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    // Generate a new token for the user (if applicable for your app)
    const authToken = generateAuthToken(user);

    // Respond with success
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Password reset successful',
        token: authToken,
      }),
    };
  } catch (err) {
    console.error('Error in resetPassword function:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  }
};
