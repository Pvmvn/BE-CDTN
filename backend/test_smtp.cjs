const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "phungvanm38@gmail.com",
    pass: "ghln ovmg muwd yjka",
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Connection error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
