import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // استخدام SSL لتجنب الحظر
    auth: {
      user: process.env.EMAIL_USER, // هيسحب إيميلك من الـ .env
      pass: process.env.EMAIL_PASS, // هيسحب الـ App Password
    },
  });

  const mailOptions = {
    from: `"DKTEC Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions); 
};

export default sendEmail;


