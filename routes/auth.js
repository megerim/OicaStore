// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Load User model
const User = require('../models/User');

// Register Page
router.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    errors: [],
    name: '',
    email: '',
    password: '',
    password2: '',
  });
});

// Register Handle
router.post('/register', async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('auth/register', {
      errors,
      name,
      email,
      password,
      password2,
      title: 'Register',
    });
  } else {
    // Validation passed
    try {
      let user = await User.findOne({ email: email });
      if (user) {
        // User exists
        errors.push({ msg: 'Email is already registered' });
        res.render('auth/register', {
          errors,
          name,
          email,
          password,
          password2,
          title: 'Register',
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save User
        await newUser.save();
        req.flash('success', 'You are now registered and can log in');
        res.redirect('/login');
      }
    } catch (err) {
      console.error(err);
      res.redirect('/register');
    }
  }
});

// Login Page
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/', // Redirect to home page or user dashboard
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      console.error(err);
      return next(err);
    }
    req.flash('success', 'You are logged out');
    res.redirect('/login');
  });
});

module.exports = router;