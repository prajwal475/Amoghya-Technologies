require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.static(__dirname)); // Serve static files from current directory

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// API Endpoint to handle contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, budget, msg } = req.body;

    if (!name || !email || !msg) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Build the email content
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // Send via authenticated email
      replyTo: email, // Direct replies back to the user
      to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
      subject: `New Lead: ${service || 'General Inquiry'} from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Service Required:</strong> ${service || 'Not selected'}</p>
        <p><strong>Budget Range:</strong> ${budget || 'Not applicable/Not selected'}</p>
        <h3>Project Brief:</h3>
        <p>${msg.replace(/\n/g, '<br>')}</p>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent for inquiry from ${name}`);

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
