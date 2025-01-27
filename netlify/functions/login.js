// netlify/functions/login.js
const { User } = require("./models/userShema"); // Adjust the path to your User model
const { CustomError } = require("./Utils/CustomError"); // Ensure this is implemented
const validator = require("validator");

const validateInput = ({ username, password }) => {
  if (!username || !password) {
    throw new CustomError("Provide your username and password", 401);
  }
  if (!validator.isAlphanumeric(username)) {
    throw new CustomError("Invalid username format", 400);
  }
  if (!validator.isStrongPassword(password, { minLength: 8, minNumbers: 1})) {
    throw new CustomError("Password must be at least 8 characters long and include numbers", 400);
  }
};


exports.handler = async (event, context) => {
  try {
    // Check if the request method is POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    
    const { username, password } = JSON.parse(event.body);
    
    // Validate the input
    validateInput({ username, password });

    // Check if the user exists

    // Find the user in the database and include the password
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      throw new CustomError("Incorrect username or password", 400);
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordCorrect = await user.comparePasswordInDb(password, user.password);
    if (!isPasswordCorrect) {
      throw new CustomError("Incorrect username or password", 400);
    }

    

    // Construct the response manually
    const responseBody = {
      status: "success",
      statusCode: 200,
      data: {
        id: user._id, // Assuming MongoDB is used
        username: user.username,
        email: user.email,
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("Error during login:", error);

    // Handle errors and return appropriate response
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    return {
      statusCode,
      body: JSON.stringify({
        status: "error",
        statusCode,
        message,
      }),
    };
  }
};
