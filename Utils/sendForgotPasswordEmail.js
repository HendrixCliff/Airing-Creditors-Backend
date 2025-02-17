const nodemailer =  require("nodemailer");

/**
 * Sends a forgot password email to the user.
 * 
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {string} resetLink - The password reset link.
 * @returns {Promise<void>} - Resolves if the email is sent successfully.
 */
const sendForgotPasswordEmail = async (recipientEmail, resetLink) => {
  try {
    // Create a transporter object using environment variables
    const transporter = nodemailer.createTransport({
      service: "Gmail", // You can use other services like Outlook, Yahoo, etc.
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    // Email options
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender address
      to: recipientEmail, // Recipient's email
      subject: "Password Reset Request", // Email subject
      html: `
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;color:white;background-color:#007bff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>Thanks,</p>
        <p>Your App Team</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send password reset email. Please try again later.");
  }
};

module.exports = sendForgotPasswordEmail
