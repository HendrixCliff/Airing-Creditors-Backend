const jwt = require('jsonwebtoken');

exports.generateAuthToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.SECRET_STR, {
    expiresIn: '1h',
  });
};
