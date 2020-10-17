const nodemailer = require('nodemailer');

exports.sendEmail = async (options) => {
    // create the transport object
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        }
    });

    // configure the email message
    const message = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: `Good Day - ${options.subject}`,
        text: 'A request has been made to reset your password. ' + 
        'To reset your password, visit the following address:\n\n' + options.message
    };

    // send the email
    await transporter.sendMail(message);
};