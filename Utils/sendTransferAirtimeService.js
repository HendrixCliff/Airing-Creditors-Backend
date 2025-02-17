
const africastalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const AirtimeResponseModel = require('../models/airtimeResponseSchema.js');

const sendTransferAirtimeService = async (phoneNumber, amount, verifyStatus, transaction_id) => {
    if (!phoneNumber || !amount || !verifyStatus || !transaction_id) {
        throw new Error("All parameters are required");
    }

    const airtime = africastalking.AIRTIME;
    const options = {
        recipients: [{ phoneNumber, amount: `NGN ${amount}`, currencyCode: "NGN" }]
    };

    try {
        const response = await airtime.send(options);
        console.log("Airtime Sent:", response);

        // Save transaction to DB
        const savedResponse = await AirtimeResponseModel.create({
            phoneNumber,
            amount,
            verifyStatus,
            transaction_id,
            date: new Date(),
        });

        return {
            success: true,
            message: "Airtime sent successfully",
            data: savedResponse,
        };
    } catch (error) {
        console.error("Error sending airtime:", error);
        throw new Error(error.message || "Failed to send airtime");
    }
};


module.exports = sendTransferAirtimeService;