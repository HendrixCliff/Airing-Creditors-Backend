const mongoose = require('mongoose');


const AirtimeResponseSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: { type: Date, required: true },
    verifyStatus: {
      type: String,
    
      enum: ['Success', 'Failed', 'Pending'],
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    providerMessage: {
      type: String,
      required: false, // This field can store additional information from the provider
    },
  },
  {
    timestamps: true, 
  }
);


const AirtimeResponseModel = mongoose.model('AirtimeResponse', AirtimeResponseSchema);

module.exports = AirtimeResponseModel;
