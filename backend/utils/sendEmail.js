const nodemailer = require("nodemailer");

// Real emails go through Gmail when EMAIL_USER and EMAIL_PASS are set in .env.
// If they are missing, it falls back to Ethereal (fake inbox, preview link in the terminal).
const createTransporter = async () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (EMAIL_USER && EMAIL_PASS) {
    return {
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS.replace(/\s/g, ""), // spaces in the App Password don't matter
        },
      }),
      from: `"Germino Dental" <${EMAIL_USER}>`,
      isTest: false,
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    }),
    from: '"Germino Dental" <no-reply@germinodental.com>',
    isTest: true,
  };
};

const sendEmail = async ({ to, subject, text, html }) => {
  const { transporter, from, isTest } = await createTransporter();

  const info = await transporter.sendMail({ from, to, subject, text, html });

  if (isTest) {
    console.log("Email preview URL:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`Email sent to ${to}`);
  }

  return info;
};

module.exports = sendEmail;
