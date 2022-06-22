const Category = require('./Category.js');
const sequelize = require('./sequelize.js');
const User = require('./User.js');
const Product = require('./Product.js');

Category.hasMany(Product, { onDelete: "cascade", foreignKey: { name: 'categoryId', allowNull: true } });
Product.belongsTo(Category);

module.exports = {
  sequelize,
  User,
  Category,
  Product
}