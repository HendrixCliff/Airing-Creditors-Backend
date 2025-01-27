const jwt = require('jsonwebtoken');
const util = require('util');
const User = require('./models/userSchema'); // Import your User model


// Promisify jwt.verify for async/await use
const verifyToken = util.promisify(jwt.verify);

// Protect handler
exports.handler = async (event, context) => {
  try {
    // Check for authorization header
    const testToken = event.headers.authorization;
    if (!testToken || !testToken.startsWith('Bearer')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'You are not logged in' }),
      };
    }

    const token = testToken.split(' ')[1];

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await verifyToken(token, process.env.SECRET_STR);
      console.log('Decoded Token:', decodedToken);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid or expired token' }),
      };
    }

   

    // Fetch the user by ID from the token
    let user;
    try {
      user = await User.findById(decodedToken.id);
      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'User not found' }),
        };
      }
      console.log('User:', user);
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error fetching user', error: err.message }),
      };
    }

    // Check if the user has changed their password
    const isPasswordChanged = user.isPasswordChanged(decodedToken.iat);
    if (isPasswordChanged) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'User has changed their password. Please log in again' }),
      };
    }

    // Attach user to the request for further middleware processing
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User authenticated', user }),
    };
  } catch (err) {
    console.error('Error in protect function:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: err.message }),
    };
  }
};
