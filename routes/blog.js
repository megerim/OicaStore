const express = require('express');
const router = express.Router();

// Blog Home Page
router.get('/', (req, res) => {
  res.render('blog/index', { title: 'Blog' });
});

// Example of individual blog post page (dynamic route)
router.get('/:postId', (req, res) => {
  const postId = req.params.postId;
  res.render('blog/post', { title: `Blog Post ${postId}`, postId });
});

module.exports = router;