const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// Allowed sources
const allowedSources = ['popup', 'homepage', 'about', ];

// POST /api/subscribe - Popup form
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const existing = await Subscriber.findOne({ email, source: 'popup' });
    if (existing) return res.status(409).json({ message: 'Email already subscribed via popup.' });

    const newSubscriber = new Subscriber({ email, source: 'popup' });
    await newSubscriber.save();

    res.status(201).json({ message: 'Subscribed successfully via popup!' });
  } catch (err) {
    console.error('Popup Subscription Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/subscribe/homepage - Homepage, About, and Project forms
router.post('/homepage', async (req, res) => {
  const { email, source } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const formSource = source || 'homepage';

  if (!allowedSources.includes(formSource)) {
    return res.status(400).json({ message: `Invalid source: ${formSource}` });
  }

  try {
    const existing = await Subscriber.findOne({ email, source: formSource });
    if (existing) {
      return res.status(409).json({
        message: `Email already subscribed via ${formSource}.`,
      });
    }

    const newSubscriber = new Subscriber({ email, source: formSource });
    await newSubscriber.save();

    res.status(201).json({
      message: `Subscribed successfully via ${formSource}!`,
    });
  } catch (err) {
    console.error(`${formSource} Subscription Error:`, err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/subscribe - Admin fetch all subscribers
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    console.error('Fetch Subscribers Error:', err);
    res.status(500).json({ message: 'Failed to fetch subscribers.' });
  }
});

module.exports = router;
