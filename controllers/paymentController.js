const Flutterwave = require('flutterwave-node-v3');
const CustomError = require("../Utils/CustomError")
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
const { sendAirtime } = require('./airtimeController'); 
 

exports.initiatePayment = asyncErrorHandler( async (req, res, next) => {
    const { email, amount, phoneNumber, currency, tx_ref, payment_option } = req.body;
    if (!email || !amount || !currency || !tx_ref) {
        return( next(new CustomError("Please provide evrey necessary detail", 400)))
    }
    
    const paymentOptions = payment_option || 'card';  // Use provided option or default

    const payload = {
        tx_ref: tx_ref || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency: currency || 'NGN',
        redirect_url: 'https://yourdomain.com/payment-callback',
        payment_options: paymentOptions,
        customer: { 
        email, 
        phone_number: phoneNumber 
    },
        customizations: {
            title: 'Payment for Airtime',
            description: 'Payment for airtime services',
            logo: 'https://www.yourlogo.com/logo.png',
        },
    };
        try {
            const response = await flw.Payment.initialize(payload);
            
            if (response.status !== 'success') {
                return next(new CustomError("Payment initiation failed", 400));
            }

        const transactionId = response.data.id; 

        return res.status(200).json({
            status: "success",
            transactionId,
            paymentLink: response.data.link,
            data: response.data
    
})
} catch (error) {
    return next(new CustomError("Payment initiation error: " + error.message, 500));
}})




exports.verifyPayment = asyncErrorHandler(async (req, res, next) => {
    const { transaction_id } = req.query;

    try {
        const response = await flw.Transaction.verify({ id: transaction_id });

        const amountFromRequest = parseFloat(req.body.amount);
        const amountFromResponse = parseFloat(response.data.amount);

        if (response.data.status === 'successful' &&
            response.data.currency === 'NGN' && 
            amountFromRequest  === amountFromResponse) {

            req.body.transaction_id = transaction_id; 
            req.body.status = 'successful';
            return await sendAirtime(req, res, next);
        } else {
            return next(new CustomError("Payment verification failed", 400));
        }
    } catch (error) {
        return res.status(400).json({
            status: "fail",
            message: "Payment verification failed",
            reason: "Transaction status or details do not match"
        });
        
    }
})

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