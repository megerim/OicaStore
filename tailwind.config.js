// tailwind.config.js
module.exports = {
  content: [
    './views/**/*.ejs',       // Include all EJS templates in the views directory
    './public/**/*.html',     // Include any HTML files in the public directory
    './src/**/*.js',          // Include any JS files in the src directory
    './app.js',               // Include your main app.js file if it contains class names
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
