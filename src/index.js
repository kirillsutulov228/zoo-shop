require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');
const loginValidator = require('./validators/loginValidator.js');
const yupErrorToObject = require('./utils/yupErrorToObject.js');
const registerValidator = require('./validators/registerValidator.js');
const sequelizeErrorToObject = require('./utils/sequelizeErrorToObject.js');
const app = express();

const PORT = +process.env.PORT ?? 8000;
const HOST = process.env.HOST ?? 'localhost';

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.set('layout', 'layouts/defaultLayout.ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use('/public', express.static('./public'));

app.use(
  expressLayouts,
  session({ secret: process.env.SESSION_SECRET }),
  express.json(),
  express.urlencoded({ extended: true })
);

app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('pages/index', { title: 'Верный Друг' });
});

app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Авторизация' });
});

app.get('/register', (req, res) => {
  res.render('pages/register', { title: 'Регистрация' });
});

app.post('/login', async (req, res) => {
  res.locals.title = 'Авторизация'
  res.locals.values = req.body;
  const { email, password } = req.body;
  try {
    await loginValidator.validate({ email, password }, { abortEarly: false });
  } catch (error) {
    const errors = yupErrorToObject(error);
    return res.render('pages/login', { errors });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.render('pages/login', { errors: { email: 'Пользователь с таким E-mail не найден' } });
  }
  if (!await bcrypt.compare(password, user.password)) {
    return res.render('pages/login', { errors: { password: 'Неверный пароль' } });
  }
  req.session.user = user;
  return res.redirect('/');
});

app.post('/register', async (req, res) => {
  res.locals.title = 'Регистрация'
  res.locals.values = req.body;
  try {
    await registerValidator.validate(req.body, { abortEarly: false });
  } catch (error) {
    const errors = yupErrorToObject(error);
    console.log(errors);
    return res.render('pages/register', { errors });
  }
  try {
    const user = await User.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10)});
    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    const errors = sequelizeErrorToObject(error);
    console.log(errors);
    return res.render('pages/register', { errors })
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  return res.redirect('/');
})

sequelize.sync().then(() => {
  app.listen(PORT, HOST);
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
