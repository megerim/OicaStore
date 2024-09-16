const express = require('express');
const router = express.Router();

// Contact Page
router.get('/', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

// Handle Contact Form Submission (optional)
router.post('/', (req, res) => {
  const { name, email, message } = req.body;
  // Here, handle the form submission (e.g., send email or store message in DB)
  req.flash('success', 'Your message has been sent!');
  res.redirect('/contact');
});

module.exports = router;