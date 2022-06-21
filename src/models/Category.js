const { STRING } = require('sequelize');
const sequelize = require('./sequelize.js');

const Category = sequelize.define('Category', {
  name: {
    type: STRING,
    allowNull: false,
    unique: {
      msg: "Категория уже существует"
    }
  },
  photo: {
    type: STRING,
    allowNull: true,
    defaultValue: 'defaultCategoryPhoto.png'
  }
});

module.exports = Category;
