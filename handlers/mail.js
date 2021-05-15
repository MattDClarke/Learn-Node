const nodemailer = require('nodemailer');
const pug = require('pug');
// inline css for older email services
const juice = require('juice');
// for people who view emails in a terminal for example...
const { htmlToText } = require('html-to-text');
// const promisify = require('es6-promisify');
const { promisify } = require('util');

// create a transport - SMTP most common transport = nodemailer sends email using the protocol
const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// pug -> html
const generateHTML = (filename, options = {}) => {
  // __dirname (special variable) is the current directory that we are running this file from. renderFile folder in a different folder...?
  // options includes reset var and users email address
  const html = pug.renderFile(
    `${__dirname}/../views/email/${filename}.pug`,
    options
  );
  // console.log(html);
  // inline css for older email services
  const inlined = juice(html);
  return inlined;
};

exports.send = async options => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText(html, {
    wordwrap: 130
  });
  const mailOptions = {
    from: `Matt <noreply@matt.com`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  // bind to transport
  const sendMail = promisify(transport.sendMail.bind(transport));
  return sendMail(mailOptions);
};
