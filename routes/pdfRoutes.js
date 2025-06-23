const express = require('express');
const multer = require('multer');
const path = require('path');
const Pdf = require('../models/Pdf');
const Subscriber = require('../models/Subscriber');
const sgMail = require('@sendgrid/mail');

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📂 Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/pdfs'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// 📨 Send newsletter to all subscribers
const sendNewsletterToAll = async (subject, pdfUrl) => {
  try {
    const subscribers = await Subscriber.find();
    if (!subscribers.length) return console.log('📭 No subscribers to notify.');

    const emails = subscribers.map(sub => sub.email);
    const msg = {
      to: emails,
      from: 'gandhiswayam772@gmail.com', // ✅ Must be verified in SendGrid
      subject: subject,
      html: `
        <h2>${subject}</h2>
        <p>A new PDF update has been uploaded. You can view it below:</p>
        <p><a href="${pdfUrl}" target="_blank">📄 View PDF</a></p>
      `,
    };

    await sgMail.sendMultiple(msg);
    console.log(`✅ Newsletter sent to ${emails.length} subscriber(s).`);
  } catch (error) {
    console.error('❌ Error sending newsletter:', error.response?.body || error.message);
  }
};

// @route   POST /api/pdfs/upload
// @desc    Upload a new PDF and notify subscribers
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    const newPdf = new Pdf({ title, url: pdfUrl });
    await newPdf.save();

    const fullPublicUrl = `${req.protocol}://${req.get('host')}${pdfUrl}`;
    await sendNewsletterToAll(`New PDF: ${title}`, fullPublicUrl);

    res.status(201).json({ message: 'PDF uploaded and newsletter sent.', pdf: newPdf });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload PDF and send newsletter.' });
  }
});

// @route   GET /api/pdfs
// @desc    Get all uploaded PDFs
router.get('/', async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
    res.json(pdfs.map(pdf => ({
      title: pdf.title,
      url: `${req.protocol}://${req.get('host')}${pdf.url}`,
    })));
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

module.exports = router;
