const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({ storage: 'database.sqlite', dialect: "sqlite" });

module.exports = sequelize;
