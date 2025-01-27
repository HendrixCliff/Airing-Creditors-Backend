
const User = require('./models/userSchema'); // Adjust path to your User model
const CustomError = require('./utils/CustomError'); // Adjust path to your CustomError class

// Async Error Handler
const asyncErrorHandler = (fn) => (event, context) =>
    Promise.resolve(fn(event, context)).catch((error) => ({
        statusCode: error.statusCode || 500,
        body: JSON.stringify({
            error: error.message || "An error occurred",
        }),
    }));

exports.handler = asyncErrorHandler(async (event) => {
    // Parse the request body or headers to extract the user authentication token (e.g., JWT)
    const headers = event.headers;
    const userId = headers['x-user-id']; // Replace with how your user ID is passed (e.g., via headers or cookies)

    if (!userId) {
        throw new CustomError('User not authenticated', 401);
    }

  

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
        throw new CustomError('User not found', 404);
    }

    // Return the response
    return {
        statusCode: 200,
        body: JSON.stringify({
            status: 'success',
            message: 'User fetched successfully',
            user,
        }),
    };
});
