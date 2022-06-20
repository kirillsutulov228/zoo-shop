const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const passwordFeature = require('@adminjs/passwords')
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

AdminJS.registerAdapter(AdminJSSequelize)

const adminJs = new AdminJS({
  databases: [sequelize],
  rootPath: '/admin',
  resources: [{
    resource: User,
    options: {
      properties: { password: { isVisible: true } },
    },
    features: [passwordFeature({
      properties: {
        encryptedPassword: 'password'
      },
      hash: async (password) => await bcrypt.hash(password, 10),
    })]
  }]
});

const adminRouter = AdminJSExpress.buildRouter(adminJs);

module.exports = adminRouter;

