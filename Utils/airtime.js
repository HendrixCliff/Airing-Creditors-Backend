


const createAirtimeOptions = (phoneNumber, amount) => {
    return {
        recipients: [{
            phoneNumber: phoneNumber,
            amount: `NGN ${amount}`,
        }]
    };
}

module.exports = createAirtimeOptions 



    