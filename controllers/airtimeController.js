const asyncErrorHandler = require("./../Utils/asyncErrorHandler")
const CustomError = require("./../Utils/CustomError")
const airtimeUtil = require('./../Utils/airtime');
const AirtimeResponseModel = require('./../models/airtimeResponseSchema')

const africasTalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});


exports.sendAirtime = asyncErrorHandler(async (req, res, next) => {
  const { phoneNumber, amount, status, transaction_id } = req.body;

  if (!phoneNumber || !amount || !status || !transaction_id) {
      return next(new CustomError("All parameters are required", 400));
  }

  const airtime = africasTalking.AIRTIME;
  const options = airtimeUtil.createAirtimeOptions(phoneNumber, amount);

  try {
      await airtime.send(options);
      
      // Save airtime response to database
      const savedResponse = await AirtimeResponseModel.create({
          phoneNumber,
          amount,
          status, 
          transaction_id,
          date:  `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      });

      return res.status(200).json({
          message: 'Airtime sent successfully',
          data: {
              savedResponse,
          },
      });
  } catch (error) {
      console.error("Error sending airtime:", error);
      return next(new CustomError(error.message || "Failed to send airtime", 500));
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
  