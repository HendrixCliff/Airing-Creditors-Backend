const mongoose = require('mongoose');

const virtualAccountSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',  // Assuming 'User' is your user model
        required: true 
    },
    phoneNumber: { 
        type: String, 
        required: true 
    },
    account_number: { 
        type: String, 
        required: true, 
        unique: true 
    },
    bank_name: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const VirtualAccount = mongoose.model('VirtualAccount', virtualAccountSchema);

module.exports = VirtualAccount;
