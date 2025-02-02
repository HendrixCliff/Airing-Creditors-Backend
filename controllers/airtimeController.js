const asyncErrorHandler = require("./../Utils/asyncErrorHandler")
const CustomError = require("./../Utils/CustomError")
const airtimeUtil = require('./../Utils/airtime');
const AirtimeResponseModel = require('./../models/airtimeResponseSchema')

const africasTalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});


exports.sendAirtime = asyncErrorHandler(async (req, res, next) => {
    const { phoneNumber, amount, verifyStatus, transaction_id } = req.body;

    try {
        const response = await sendAirtimeService(phoneNumber, amount, verifyStatus, transaction_id);
        return res.status(200).json(response);
    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});

exports.airtimeResponse = asyncErrorHandler(async (req, res, next) => {
  try {
      const airtimeResponse = await AirtimeResponseModel.findOne().sort({ createdAt: -1 });
      if (!airtimeResponse) {
          return next(new CustomError("No airtime response found", 404));
      }

      return res.status(200).json({
          message: 'Airtime response retrieved successfully',
          data: airtimeResponse,
      });
  } catch (error) {
      console.error("Error fetching airtime response:", error);
      return next(new CustomError(error.message || "Failed to fetch airtime response", 500));
  }
});
  