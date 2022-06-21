function checkRole(roles = 'any') {
  return (req, res, next) => {
    if (!req.session.user || roles !== 'any' && !roles.includes(req.session.user.role)) {
      return res.render('pages/unauthorized', { title: "Ошибка" });
    }
    next();
  }
}

module.exports = checkRole;
