const { NUMBER } = require('sequelize');
const { STRING } = require('sequelize');
const sequelize = require('./sequelize.js');

const Product = sequelize.define('Product', {
  name: {
    type: STRING,
    allowNull: false,
    unique: {
      msg: "Товар с таким именованием уже существует"
    }
  },
  categoryId: {
    type: NUMBER,
    allowNull: true,
  },
  count: {
    type: NUMBER,
    allowNull: false
  },
  description: {
    type: STRING,
    allowNull: true,
    defaultValue: "Описание отсутствует"
  },
  detailDescription: {
    type: STRING,
    allowNull: true,
    defaultValue: "Детали недоступны"
  },
  price: {
    type: NUMBER,
    allowNull: false
  },
  photo: {
    type: STRING,
    allowNull: true,
    defaultValue: 'defaultProductPhoto.png'
  }
});

module.exports = Product;
