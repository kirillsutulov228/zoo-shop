const yup = require('yup');

const updateUserValidator = yup.object({
  firstName: yup.string(),
  lastName: yup.string(),
  email: yup.string().email("Некорректный E-mail"),
  password: yup.string().nullable().notRequired().when({
    is: (v) => v,
    then: (rule) => rule.min(6, "Минимальная длина пароля - 6 символов")
  }),
  passwordConfirmation: yup.string().nullable().notRequired().oneOf([yup.ref('password')], "Пароли не совпадают")
});

module.exports = updateUserValidator;