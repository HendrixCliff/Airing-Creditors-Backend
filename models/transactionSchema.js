const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: 'User', required: true
         }, // User making the payment
    transactionId: {
         type: String, 
         required: true,
          unique: true
         }, // Flutterwave transaction ID
    amount: {
         type: Number,
          required: true
         }, // Payment amount
    currency: { 
        type: String,
         default: "NGN" 
        }, // Currency (default: NGN)
    status: {
         type: String, 
         enum: ["pending", "successful", "failed"],
          default: "pending" }, // Transaction status
    paymentMethod: { 
        type: String,
         enum: ["card", "transfer"], 
         required: true }, // Payment method
    phoneNumber: { 
        type: String,
         required: true 
        }, // User's phone number for airtime
    createdAt: {
         type: Date,
          default: Date.now
         } // Timestamp
});

const TransactionModel= mongoose.model('Transaction', transactionSchema);
module.exports = TransactionModel

