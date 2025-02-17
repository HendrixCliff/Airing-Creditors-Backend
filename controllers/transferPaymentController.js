
const Flutterwave = require("flutterwave-node-v3");

// Import ES Module files
const CustomError = require("../Utils/CustomError");
const sendTransferAirtimeService = require("../Utils/sendTransferAirtimeService");
const VirtualAccount = require("../models/virtualAccountSchema");
const TransactionModel = require("../models/transactionSchema");

// Import WebSocket library
const WebSocketServer = require("ws");

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Initialize WebSocket server
const wss = new WebSocketServer({ port: 8080 });

exports.createVirtualAccount = async (req, res, next) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return next(new CustomError("Phone number is required", 400));
        }

        const payload = {
            email: `${phoneNumber}@airtimeapp.com`,  // Unique email for each user
            is_permanent: false,  // Temporary account for each session
            bvn: "",  // Not required
            tx_ref: `tx-${Date.now()}`,
            narration: "Airtime Purchase"
        };

        const response = await flw.VirtualAcct.create(payload);

        if (!response || !response.data) {
            return next(new CustomError("Failed to create virtual account", 500));
        }
         const virtualAccount = await VirtualAccount.create({
            phoneNumber,
            account_number: response.data.account_number,
            bank_name: response.data.bank_name,
            createdAt: new Date(),
        });
         return res.status(200).json({
            success: true,
            message: "Virtual account created successfully",
            virtualAccount,
        });

    } catch (error) {
        return next(new CustomError("Error creating virtual account: " + error.message, 500));
    }
};



exports.flutterwaveWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log("Webhook Received:", payload);

        // ✅ Verify webhook source
        const signature = req.headers['verif-hash'];
        if (!signature || signature !== process.env.FLW_SECRET_HASH) {
            return res.status(401).json({ error: "Invalid webhook signature" });
        }

        // ✅ Process successful bank transfers
        if (payload.event === "transfer.completed" && payload.data.status === "successful") {
            const { status, amount, customer } = payload.data;
          
        if (status !== "successful") {
            return res.status(400).json({ message: "Transaction not successful" });
        }
         
            // ✅ Check if this transaction already exists (to prevent duplicates)
            const existingTransaction = await TransactionModel.findOne({ transactionId: id });
            if (existingTransaction) {
                return res.status(400).json({ error: "Transaction already processed" });
            }

            // ✅ Find user's phone number using virtual account
            const virtualAccount = await VirtualAccount.findOne({ account_number });

            if (!virtualAccount) {
                return res.status(400).json({ error: "Unknown virtual account" });
            }
          
            const transactionId = payload.data.id; // ✅ Get from webhook
            const userId = virtualAccount.userId;  // ✅ Get from VirtualAccount
            
            // ✅ Store transaction in database
            const transaction = await TransactionModel.create({
                userId,
                transactionId,
                amount,
                currency: "NGN",
                status: "pending",  // ⬅ Transaction is now pending until user decides
                paymentMethod: "transfer",
                phoneNumber: virtualAccount.phoneNumber
            });
               // ✅ Send transaction update to all WebSocket clients
            wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                client.send(JSON.stringify(transactionData));
                }
            });
            return res.status(200).json({ 
                success: true, 
                message: "Payment received. User must choose an action.",
                transactionId: transaction.transactionId,  // ✅ Return transactionId to frontend
                userId: transaction.userId // ✅ Return userId if needed
            });
            
        }

        return res.status(400).json({ error: "Invalid transaction event" });

    } catch (error) {
        console.error("Webhook Processing Error:", error);
        return res.status(500).json({ error: "Error processing webhook" });
    }
};



exports.chooseTransactionAction = async (req, res, next) => {
    try {
        const { transactionId, action, account_bank, account_number } = req.body;
        const userId = req.user._id; // Get logged-in user

        // ✅ Find the transaction
        const transaction = await TransactionModel.findOne({ transactionId, userId });

        if (!transaction) {
            return next(new CustomError("Transaction not found", 400));
        }

        if (transaction.status !== "pending") {
            return next(new CustomError("This transaction has already been processed", 400));
        }

        if (action === "airtime") {
            // ✅ Send Airtime
            const sendAirtimeResponse = await  sendTransferAirtimeService (transaction.phoneNumber, transaction.amount);

            if (!sendAirtimeResponse.success) {
                return next(new CustomError("Airtime delivery failed", 500));
            }

            // ✅ Update transaction status
            await TransactionModel.updateOne({ transactionId }, { status: "successful" });

            return res.status(200).json({ success: true, message: "Airtime sent successfully!" });

        } else if (action === "refund") {
            if (!account_bank || !account_number) {
                return next(new CustomError("Bank details required for refund", 400));
            }

            const tx_ref = `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const payload = {
                account_bank,
                account_number,
                amount: transaction.amount,
                currency: "NGN",
                narration: "User Requested Refund",
                reference: tx_ref,
                debit_currency: "NGN"
            };

            const response = await flw.Transfer.initiate(payload);

            if (!response || !response.data || response.data.status !== "success") {
                return next(new CustomError("Refund failed, please try again", 500));
            }

            // ✅ Update transaction status
            await TransactionModel.updateOne({ transactionId }, { status: "refunded" });

            return res.status(200).json({
                success: true,
                message: "Refund initiated successfully",
                data: response.data
            });

        } else {
            return next(new CustomError("Invalid action. Choose 'airtime' or 'refund'", 400));
        }

    } catch (error) {
        return next(new CustomError("Error processing transaction choice: " + error.message, 500));
    }
};
