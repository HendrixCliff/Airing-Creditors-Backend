
const africasTalking = require('africastalking')({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const airtimeUtil = require('./airtime');
const AirtimeResponseModel = require('../models/airtimeResponseSchema');

const sendAirtimeService = async (phoneNumber, amount, verifyStatus, transaction_id) => {
    if (!phoneNumber || !amount || !verifyStatus || !transaction_id) {
        throw new Error("All parameters are required");
    }

    const airtime = africasTalking.AIRTIME;
    const options = airtimeUtil.createAirtimeOptions(phoneNumber, amount);

    try {
        await airtime.send(options);

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

module.exports = { sendAirtimeService };


