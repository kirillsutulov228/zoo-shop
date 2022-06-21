require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcrypt');
const loginValidator = require('./validators/loginValidator.js');
const registerValidator = require('./validators/registerValidator.js');
const adminRouter = require('./routers/adminRouter.js');
const checkRole = require('./middlewares/checkRole.js');
const { sequelize, User, Category } = require('./models');
const mapSessionToLocals = require('./middlewares/mapSessionToLocals.js');
const UnauthorizedError = require('./errors/UnauthorizedError.js');
const errorHandler = require('./middlewares/errorHandler.js');
const updateUserValidator = require('./validators/updateUserValidator.js');
const multer = require('multer');
const createCategoryValidator = require('./validators/createCategoryValidator.js');

const saveUUIDFile = require('./utils/saveUUIDFile.js');

const PORT = +process.env.PORT ?? 8000;
const HOST = process.env.HOST ?? 'localhost';

const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.set('layout', 'layouts/defaultLayout.ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use('/public', express.static('./public'));

app.use(
  expressLayouts,
  session({ resave: true, saveUninitialized: true, secret: process.env.SESSION_SECRET }),
  express.json(),
  express.urlencoded({ extended: true }),
  mapSessionToLocals
);

app.use('/admin', checkRole(['admin']), adminRouter);

app.get('/', (req, res) => {
  res.render('pages/index', { title: 'Верный Друг' });
});

app.get('/profile', checkRole(['user', 'admin']), (req, res) => {
  res.render('pages/profile', {
    profile: req.session.user,
    values: res.locals.values ?? { ...req.session.user, password: undefined }
  });
});

app.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Авторизация' });
});

app.get('/register', (req, res) => {
  res.render('pages/register', { title: 'Регистрация' });
});

app.get('/categories', async (req, res) => {
  const categories = await Category.findAll();
  res.render('pages/categories', { title: 'Категории', categories });
});

app.post('/login', async (req, res, next) => {
  res.locals.title = 'Авторизация';
  res.locals.values = req.body;
  const { email, password } = req.body;
  try {
    await loginValidator.validate({ email, password }, { abortEarly: false });
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render('pages/login', { errors: { email: 'Пользователь с таким E-mail не найден' } });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.render('pages/login', { errors: { password: 'Неверный пароль' } });
    }
    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    next(error);
  }
});

app.post('/register', async (req, res, next) => {
  res.locals.title = 'Регистрация';
  res.locals.values = req.body;
  try {
    await registerValidator.validate(req.body, { abortEarly: false });
    const user = await User.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10) });
    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    next(error);
  }
});

app.post('/change_user/:id', checkRole(['user', 'admin']), async (req, res, next) => {
  try {
    if (req.params.id !== '' + req.session.user.id && req.session.user.role !== 'admin') {
      throw new UnauthorizedError();
    }
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new NotFoundError();
    }
    await updateUserValidator.validate(req.body, { abortEarly: false });
    await user.update({
      ...req.body,
      password: req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined
    });
    if (req.params.id === '' + req.session.user.id) {
      req.session.user = user;
    }
    req.session.locals.message = "Данные успешно обновлены";
    return res.redirect(req.headers.referer);
  } catch (error) {
    next(error);
  }
});

app.post('/categories', checkRole(['admin']), upload.single('photo'), async (req, res, next) => {
  try {
    const data = { name: req.body.name };
    await createCategoryValidator.validate(data);
    if (req.file) {
      if (!req.file.mimetype.includes('image')) {
        req.session.locals = { errors: { photo: 'Файл должен быть изображением' } };
        return res.redirect(req.headers.referer);
      }
      data.photo = await saveUUIDFile('./public/models', req.file);
    }
    const category = await Category.create(data);
    req.session.locals = { message: 'Категория успешно создана' };
    return res.redirect(req.headers.referer);
  } catch (err) {
    next(err);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  return res.redirect('/');
});

app.use((req, res) => {
  res.render('pages/notFound.ejs', { title: 'Страница не найдена' });
});



app.use(errorHandler);

sequelize.sync().then(async () => {
  app.listen(PORT, HOST);
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
