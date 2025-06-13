import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html, attachments, text }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  // Mail content
  const info = await transporter.sendMail({
    from: `"Social App ✉️" <${process.env.EMAIL}>`,
    to:  to || "nayera.mohamed9876@gmail.com",
    subject: subject || "Hello",
    html: html || undefined,
    attachments: attachments || [],
    text: text || undefined,
  });

  if (info.accepted.length) {
    return true;
  }
  return false;
};

export default sendEmail;
