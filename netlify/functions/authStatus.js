const jwt = require('jsonwebtoken'); // For verifying the token
require('dotenv').config(); // For environment variables

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Extract cookies from the request headers
    const cookies = event.headers.cookie || '';
    const authToken = cookies
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];

    if (!authToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          isAuthenticated: false,
          message: 'Not authenticated',
        }),
      };
    }

    // Verify the token
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    if (!decoded) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          isAuthenticated: false,
          message: 'Invalid token',
        }),
      };
    }

    // Return authenticated status
    return {
      statusCode: 200,
      body: JSON.stringify({
        isAuthenticated: true,
        username: decoded.username,
        token: authToken,
      }),
    };
  } catch (error) {
    console.error('Authentication error:', error.message);
    return {
      statusCode: 401,
      body: JSON.stringify({
        isAuthenticated: false,
        message: 'Invalid or expired token',
      }),
    };
  }
};
