
const AirtimeResponseModel = require('./models/AirtimeResponseModel'); // Adjust path to your AirtimeResponseModel
const CustomError = require('./utils/CustomError'); // Adjust path to your CustomError class

// Async Error Handler to simplify handling async errors
const asyncErrorHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.handler = asyncErrorHandler(async (event, context) => {
    try {
        
        // Retrieve the most recent airtime response
        const airtimeResponse = await AirtimeResponseModel.findOne().sort({ createdAt: -1 });

        if (!airtimeResponse) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "No airtime response found",
                }),
            };
        }

        // Return the successful response
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Airtime response retrieved successfully",
                data: airtimeResponse,
            }),
        };
    } catch (error) {
        console.error("Error fetching airtime response:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || "Failed to fetch airtime response",
            }),
        };
    }
});
