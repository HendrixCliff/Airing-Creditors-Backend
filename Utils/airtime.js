


module.exports = createAirtimeOptions = (phoneNumber, currencyCode, amount) => {
    return {
        recipients: [{
            phoneNumber: phoneNumber,
            currencyCode: currencyCode || 'NGN',
            amount: amount
        }]
    };
}




    