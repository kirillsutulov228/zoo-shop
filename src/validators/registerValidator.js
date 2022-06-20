const yup = require('yup');

const registerValidator = yup.object({
  firstName: yup.string().required("Поле обязательно к заполнению"),
  lastName: yup.string().required("Поле обязательно к заполнению"),
  email: yup.string().required("Поле обязательно к заполнению").email("Некорректный E-mail"),
  password: yup.string().min(6, "Минимальная длина пароля - 6 символов").required("Поле обязательно к заполнению"),
  passwordConfirmation: yup.string().required("Поле обязательно к заполнению").oneOf([yup.ref('password')], "Пароли не совпадают")
});

module.exports = registerValidator;
