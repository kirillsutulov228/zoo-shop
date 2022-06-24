require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcrypt');
const loginValidator = require('./validators/loginValidator.js');
const registerValidator = require('./validators/registerValidator.js');
const adminRouter = require('./routers/adminRouter.js');
const checkRole = require('./middlewares/checkRole.js');
const { sequelize, User, Category, Product } = require('./models');
const mapSessionToLocals = require('./middlewares/mapSessionToLocals.js');
const UnauthorizedError = require('./errors/UnauthorizedError.js');
const errorHandler = require('./middlewares/errorHandler.js');
const updateUserValidator = require('./validators/updateUserValidator.js');
const multer = require('multer');
const createCategoryValidator = require('./validators/createCategoryValidator.js');
const saveUUIDFile = require('./utils/saveUUIDFile.js');
const NotFoundError = require('./errors/NotFoundError.js');
const createProductValidator = require('./validators/createProductValidator.js');
const filterObject = require('./utils/filterObject.js');

const PORT = +process.env.PORT ?? 8000;
const HOST = process.env.HOST ?? 'localhost';

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

app.get('/cart', checkRole(), async (req, res, next) => {
  let price = 0;
  let total = 0;
  if (req.session.cart) {
    for (const id in req.session.cart) {
      const { count, product } = req.session.cart[id];
      price += count * product.price;
      total++;
    }
  }
  return res.render('pages/cart', { price, total, cart: req.session.cart });
});

app.post('/add_to_cart/:id', checkRole(), async (req, res, next) => {
  try {
    if (req.body.count === undefined || req.body.count < 1) {
      req.session.locals.error = `Количество товара должно быть больше 0`;
      return res.redirect(req.headers.referer);
    }
    const product = await Product.findByPk(req.params.id);
    if (!product) throw NotFoundError();
    if (!req.session.cart) {
      req.session.cart = {};
    }
    req.session.cart[req.params.id] = { count: req.body.count, product };
    req.session.locals.cartMessage = `Товар "${product.name}" добавлен в корзину в количестве ${req.body.count} шт.`;
    res.redirect(req.headers.referer);
  } catch (err) {
    return next(err);
  }
});

app.post('/delete_from_cart/:id', checkRole(), (req, res) => {
  req.session.cart[req.params.id] = undefined;
  res.redirect(req.headers.referer);
});

app.post('/change_user/:id', checkRole(), async (req, res, next) => {
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
    req.session.locals.message = 'Данные успешно обновлены';
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

app.get('/products', async (req, res, next) => {
  let products = null;
  let category = null;
  if (req.query.categoryId) {
    category = await Category.findByPk(req.query.categoryId);
    if (!category) throw new NotFoundError();
    products = await category.getProducts();
  } else {
    products = await Product.findAll();
  }
  return res.render('pages/products', { products, category, title: 'Товары' });
});

app.post('/products', upload.single('photo'), async (req, res, next) => {
  try {
    const data = filterObject(req.body);
    console.log(data);
    await createProductValidator.validate(data, { abortEarly: false });
    if (req.file) {
      if (!req.file.mimetype.includes('image')) {
        req.session.locals = { errors: { photo: 'Файл должен быть изображением' } };
        return res.redirect(req.headers.referer);
      }
      data.photo = await saveUUIDFile('./public/models', req.file);
    }
    const product = await Product.create(data);
    req.session.locals = { message: 'Товар успешно создан' };
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
