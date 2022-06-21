const NotFoundError= require('../errors/NotFoundError.js');
const UnauthorizedError = require('../errors/UnauthorizedError.js');
const { BaseError } = require('sequelize');
const { ValidationError } = require('yup');
const yupErrorToObject = require('../utils/yupErrorToObject.js');
const sequelizeErrorToObject = require('../utils/sequelizeErrorToObject.js');

function errorHandler(err, req, res, next) {
  req.session.locals = { values: { ...req.query, ...req.body } }
  if (err instanceof UnauthorizedError) {
    return res.render('/pages/unauthorized', { message: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.render('/pages/notFound', { message: err.message });
  }
  if (err instanceof ValidationError) {
    req.session.locals.errors = yupErrorToObject(err);
    return res.redirect(req.headers.referer);
  }
  if (err instanceof BaseError) {
    req.session.locals.errors = sequelizeErrorToObject(err);
    return res.redirect(req.headers.referer);
  }
  console.error(err);
  next();
}

module.exports = errorHandler;
