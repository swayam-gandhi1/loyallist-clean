const sendNewsletterToAll = require('../utils/sendNewsletter');
const News = require('../models/News');

const newsUploadHandler = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pdfFile = req.file;

    console.log("📥 Admin uploaded a news PDF...");

    if (!pdfFile) {
      console.log("❌ No PDF file found in request.");
      return res.status(400).json({ message: 'PDF file is required.' });
    }

    const newNews = new News({
      title,
      description,
      pdf: pdfFile.filename,
    });

    await newNews.save();
    console.log("✅ News saved to DB.");

    const publicPdfUrl = `${req.protocol}://${req.get('host')}/uploads/pdfs/${pdfFile.filename}`;
    console.log("📄 PDF public URL:", publicPdfUrl);

    console.log("📨 Calling sendNewsletterToAll()...");
    await sendNewsletterToAll(`New Update: ${title}`, description, publicPdfUrl);
    console.log("✅ Newsletter sent.");

    res.status(201).json({ message: 'News uploaded and newsletter sent.' });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Error uploading news.' });
  }
};

module.exports = { newsUploadHandler };
