const yup = require('yup');

const createCategoryValidator = yup.object({
  name: yup.string().required("Это поле обязательно"),
  photo: yup.string()
});

module.exports = createCategoryValidator;
