function checkRole(roles = []) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.render('pages/unauthorized');
    }
    next();
  }
}

module.exports = checkRole;
