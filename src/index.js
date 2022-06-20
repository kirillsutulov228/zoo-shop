require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const app = express();

const PORT = +process.env.PORT ?? 8000;
const HOST = process.env.HOST ?? 'localhost';

app.set('view engine', 'ejs');
app.set('views', './src/views');
app.set('layout', 'layouts/defaultLayout.ejs');
app.set("layout extractScripts", true)
app.set("layout extractStyles", true);

app.use('/public', express.static('./public'));
app.use(expressLayouts, session({
  secret: process.env.SESSION_SECRET
}));

app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

app.get('/', (req, res) => {
  res.render('pages/index', { title: "Верный Друг" });
});

app.listen(PORT, HOST);
console.log(`Server listening on http://${HOST}:${PORT}`);
