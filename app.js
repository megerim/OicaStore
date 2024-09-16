const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const path = require('path');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const multer = require('multer'); // Multer for file uploads

const app = express();

// Passport Config
require('./config/passport')(passport);

// Connect to MongoDB
mongoose.connect("mongodb+srv://merimgokhan:9fGJyRN9npdvUq5Z@rica.giqgv.mongodb.net/?retryWrites=true&w=majority&appName=rica");

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Multer Setup for file uploads (handles image uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Session Middleware (Must be before passport and csurf)
app.use(
  session({
    secret: 'your-secret-key', // Replace with your own secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://merimgokhan:9fGJyRN9npdvUq5Z@rica.giqgv.mongodb.net/?retryWrites=true&w=majority&appName=rica' }),
    cookie: { secure: false }, // Set secure: true if using HTTPS
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Body Parser Middleware (to parse request bodies)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CSRF Protection Middleware (Must be after session middleware)
const csrfProtection = csrf();
app.use(csrfProtection);

// Connect Flash Middleware for flash messages
app.use(flash());

// Global Variables Middleware (Make csrfToken, cartItemCount, flash messages available in views)
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken(); // CSRF token for forms
  res.locals.cartItemCount = req.session.cart
    ? req.session.cart.reduce((total, item) => total + item.quantity, 0)
    : 0;
  res.locals.successMsg = req.flash('success')[0] || null;
  res.locals.errorMsg = req.flash('error')[0] || null;
  res.locals.user = req.user || null;
  next();
});

// Routes
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const aboutRoutes = require('./routes/about');



app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);
app.use('/blog', blogRoutes);
app.use('/contact', contactRoutes);
app.use('/about', aboutRoutes);


// Error Handling Middleware (for CSRF token errors)
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Handle CSRF token errors here
    res.status(403);
    res.send('Form tampered with.');
  } else {
    next(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});