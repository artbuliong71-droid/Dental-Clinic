const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Germino Dental" <no-reply@germinodental.com>',
    to,
    subject,
    text,
    html,
  });

  console.log("Email preview URL:", nodemailer.getTestMessageUrl(info));

  return info;
};

module.exports = sendEmail;
