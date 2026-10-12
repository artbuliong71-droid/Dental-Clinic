const crypto = require("crypto");

const generateOTP = () => {
  // Gumawa ng random 6-digit number, halimbawa: "042917"
  const otp = crypto.randomInt(100000, 1000000).toString();
  return otp;
};

module.exports = generateOTP;
