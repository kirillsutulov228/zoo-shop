const yup = require('yup');

const loginValidator = yup.object({
  email: yup.string().required("Поле обязательно к заполнению").email("Некорректный E-mail"),
  password: yup.string().required("Поле обязательно к заполнению")
});

module.exports = loginValidator;
