const axios = require('axios');

const initiateTransaction = async (amount, email, transactionRef, split_code ) => {
  try {
    
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        amount: amount * 100,
        reference: transactionRef,
        split_code: "SPL_ETRIwXp4FC"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(response);
    return response.data;

  } catch (error) {
    throw new Error('Something went wrong!');
  }
};


module.exports = { initiateTransaction }