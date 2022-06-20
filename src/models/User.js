const { NUMBER } = require('sequelize');
const { STRING } = require('sequelize');
const sequelize = require('./sequelize.js');

const User = sequelize.define('User', {
  firstName: {
    type: STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Пожалуйста, введите Ваше имя'
      }
    }
  },
  lastName: {
    type: STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Пожалуйста, введите Вашу фамилию'
      }
    }
  },
  email: {
    type: STRING,
    allowNull: false,
    unique: { msg: "E-mail уже занят" },
    validate: {
      isEmail: {
        msg: "Введен некорректный E-mail"
      },
      notNull: {
        msg: 'Это поле обязательно к заполнению'
      }
    }
  },
  password: {
    type: STRING,
    allowNull: false
  },
  role: {
    type: STRING,
    defaultValue: "user",
    validate: {
      isIn: {
        args: [['user', 'admin']],
        msg: "Некорректная роль"
      }
    }
  }
}, {
  validate: true,
  indexes: [ { fields: ['email'], unique: true } ]
});

module.exports = User;

