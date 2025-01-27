const axios = require('axios'); // For API requests


exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, amount, phoneNumber, currency, tx_ref, payment_option } = body;

    // Validate required fields
    if (!email || !amount || !currency || !tx_ref) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Please provide every necessary detail',
        }),
      };
    }

    const paymentOptions = payment_option || 'card'; // Default to 'card' if no payment option provided

    // Create the payload for the payment API
    const payload = {
      tx_ref: tx_ref || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: currency || 'NGN',
      redirect_url: 'https://yourdomain.com/payment-callback',
      payment_options: paymentOptions,
      customer: {
        email,
        phone_number: phoneNumber,
      },
      customizations: {
        title: 'Payment for Airtime',
        description: 'Payment for airtime services',
        logo: 'https://www.yourlogo.com/logo.png', // Update with your actual logo URL
      },
    };

    // Flutterwave API initialization
    const flwApiUrl = 'https://api.flutterwave.com/v3/payments';
    const headers = {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // Ensure FLW_SECRET_KEY is set in your .env
      'Content-Type': 'application/json',
    };

    // Make the payment initiation request
    const response = await axios.post(flwApiUrl, payload, { headers });

    // Check response status
    if (response.data.status !== 'success') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Payment initiation failed',
          error: response.data.message,
        }),
      };
    }

    const transactionId = response.data.data.id;

    // Return the payment link and transaction ID
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        transactionId,
        paymentLink: response.data.data.link,
        data: response.data.data, // Include full response for debugging
      }),
    };
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Payment initiation error: ${error.message}`,
      }),
    };
  }
};
