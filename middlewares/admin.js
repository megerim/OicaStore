// middleware/admin.js
module.exports = {
    ensureAdmin: function (req, res, next) {
      if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
      }
      req.flash('error', 'You must be an admin to access this page');
      res.redirect('/login');
    },
  };