const { User } = require("../models/userSchema"); // Adjust the path to your User model
const bcrypt = require("bcryptjs");
const validator = require("validator");

exports.handler = async (event, context) => {
  try {
    // Ensure the request method is POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // Parse and validate the request body
    const { username, email, password, phoneNumber, country } = JSON.parse(event.body);

    // Check for required fields
    if (!username || !email || !password || !phoneNumber || !country) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "All fields (username, email, password, phoneNumber, country) are required",
        }),
      };
    }

    // Validate username
    if (!validator.isAlphanumeric(username)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Username must be alphanumeric",
        }),
      };
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Invalid email address",
        }),
      };
    }

    // Validate password
    if (!validator.isStrongPassword(password, { minLength: 8, minNumbers: 1 })) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Password must be at least 8 characters long and include numbers",
        }),
      };
    }

    // Validate phoneNumber (example: must be numeric and at least 10 characters)
    if (!validator.isMobilePhone(phoneNumber, undefined, { strictMode: true })) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Invalid phone number",
        }),
      };
    }

    // Validate country (example: must be a string and not empty)
    if (!country || typeof country !== "string" || country.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Invalid country",
        }),
      };
    }

    // Check for duplicate username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return {
        statusCode: 409, // Conflict
        body: JSON.stringify({
          status: "error",
          message: "Username or email already in use",
        }),
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      country,
      date: new Date(),
    });

    console.log("User signed up successfully");

    // Construct the response
    const responseBody = {
      status: "success",
      statusCode: 201,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        createdAt: user.date,
      },
    };

    return {
      statusCode: 201,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("Error during signup:", error);

    // Return a generic error message for unexpected errors
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        status: "error",
        message: error.message || "Signup failed. Please try again later.",
      }),
    };
  }
};
