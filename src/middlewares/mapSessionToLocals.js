function mapSessionToLocals(req, res, next) {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  if (req.session.locals) {
    res.locals = { ...res.locals,  ...req.session.locals };
  }
  req.session.locals = {}
  next();
}

module.exports = mapSessionToLocals;
