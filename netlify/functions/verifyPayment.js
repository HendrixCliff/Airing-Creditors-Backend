const axios = require('axios'); // For API requests

// Import the sendAirtime controller
const { sendAirtime } = require('./controllers/sendAirtime'); // Adjust the path if needed

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { transaction_id } = event.queryStringParameters || {};

    if (!transaction_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Transaction ID is required' }),
      };
    }

    const body = JSON.parse(event.body);
    const { amount, phoneNumber } = body; // Include phoneNumber from request body
    const amountFromRequest = parseFloat(amount);

    // Verify the transaction with Flutterwave API
    const flwApiUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    const headers = {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await axios.get(flwApiUrl, { headers });
    const transaction = response.data.data;
    const amountFromResponse = parseFloat(transaction.amount);

    if (
      transaction.status === 'successful' &&
      transaction.currency === 'NGN' &&
      amountFromRequest === amountFromResponse
    ) {
      // Prepare data for sendAirtime
      const airtimeData = {
        transaction_id,
        amount: amountFromResponse,
        status: 'successful',
        phoneNumber, 
      };

      // Call sendAirtime handler
      const airtimeResponse = await sendAirtime(airtimeData);

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'Payment verified and airtime sent successfully',
          data: airtimeResponse,
        }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Payment verification failed',
        }),
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: 'fail',
        message: 'Payment verification failed',
        reason: 'Transaction status or details do not match',
      }),
    };
  }
};
