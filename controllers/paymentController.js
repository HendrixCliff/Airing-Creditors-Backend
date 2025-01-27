const Flutterwave = require('flutterwave-node-v3');
const CustomError = require("../Utils/CustomError")
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
const { sendAirtime } = require('./airtimeController'); 
const validator = require("validator");
 

exports.initiatePayment = asyncErrorHandler( async (req, res, next) => {
    const { email, amount, phoneNumber, currency, payment_option } = req.body;
    if (!email || !amount || !currency || !tx_ref || !phoneNumber) {
        return( next(new CustomError("Please provide evrey necessary detail", 400)))
    }
    if (!validator.isEmail(email)) {
        return next(new CustomError("Invalid email address", 400));
      }
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return next(new CustomError("Invalid payment amount", 400));
      }
    const paymentOptions = payment_option || 'card';  // Use provided option or default
    const tx_ref = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
        tx_ref,
        amount,
        currency: currency || 'NGN',
        redirect_url: process.env.FLW_REDIRECT_URL,
        payment_options: paymentOptions,
        customer: { 
        email, 
        phone_number: phoneNumber 
    },
        customizations: {
            title: 'Payment for Airtime',
            description: 'Payment for airtime services',
            logo: process.env.FLW_LOGO_URL,
        },
    };
        try {
            const response = await flw.Payment.initialize(payload);
            
            if (!response || response.status !== "success" || !response.data) {
                return next(new CustomError("Unexpected response from payment gateway", 500));
              }

        return res.status(200).json({
            status: response.data.status,
            transactionId: response.data.id,
            paymentLink: response.data.link,
            phoneNumber, // Use phoneNumber from req.body
            data: response.data,
          });
} catch (error) {
    return next(new CustomError("Payment initiation error: " + error.message, 500));
}})



exports.verifyPayment = asyncErrorHandler(async (req, res, next) => {
    const { transaction_id, phoneNumber } = req.body; // Retrieve phoneNumber from the request body

    // Ensure both transaction_id and phoneNumber are provided in the request
    if (!transaction_id || !phoneNumber) {
        return next(new CustomError("Transaction ID and phone number are required for verification", 400));
    }

    try {
        const response = await flw.Transaction.verify({ id: transaction_id });

        if (!response || !response.data) {
            return next(new CustomError("Transaction verification failed", 400));
        }

        const amountFromRequest = parseFloat(req.body.amount);
        const amountFromResponse = parseFloat(response.data.amount);

        // Match the phone number provided with the one retrieved from the client
        if (
            response.data.status === 'successful' &&
            response.data.currency === 'NGN' && 
            amountFromRequest === amountFromResponse &&
            phoneNumber === response.data.customer.phone_number // Validate phoneNumber matches
        ) {
            req.body.transaction_id = transaction_id; 
            req.body.status = 'successful';
            req.body.phoneNumber = phoneNumber; // Use phoneNumber strictly from the request
            
            return await sendAirtime(req, res, next);
        } else {
            return next(new CustomError("Payment verification failed", 400));
        }
    } catch (error) {
        return res.status(400).json({
            status: "fail",
            message: "Payment verification failed",
            reason: "Transaction status or details do not match",
        });
    }
});

// In your case of building an airtime app integrated with Flutterwave, the money spent for purchasing airtime comes from the user's payments, not your personal or company funds—if the system is properly set up. Here's how it works:

// How the Payment Flow Works:
// User Initiates Payment:

// The user enters the amount they wish to purchase as airtime and provides their payment details (card, mobile money, or other payment methods).
// Payment Processing via Flutterwave:

// Flutterwave processes the transaction by debiting the user's account.
// The funds are transferred to your designated merchant account linked to your Flutterwave account.
// Airtime Purchase Execution:

// After successful payment verification, your backend triggers a function (sendAirtime) to purchase and deliver airtime using the payment collected from the user.
// Merchant Settlement:

// Flutterwave settles the transaction by transferring the collected funds (minus transaction fees) to your bank account, based on the settlement terms configured.
// Important Considerations:
// Funding Airtime Purchases:

// Ensure you integrate your app with an airtime provider or aggregator who allows programmatic purchase through APIs.
// The provider will typically deduct the airtime amount from your pre-funded account balance (a balance you maintain with them).
// Reconciliation and Transparency:

// Maintain clear records of payments received, airtime purchases made, and user transactions to ensure proper reconciliation.
// Provide transaction receipts to users for transparency.
// Transaction Fees and Margins:

// Flutterwave charges transaction fees, so account for these in your pricing strategy.
// You can include a service fee in user payments to cover these charges and ensure profitability.
// By ensuring the payment system is set up correctly and aligned with your airtime provider, you’ll be using the users' payments for their purchases rather than dipping into your own business funds.