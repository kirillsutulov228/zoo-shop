const yup = require('yup');

const createProductValidator = yup.object({
  name: yup.string().required("Это поле обязательно"),
  desciption: yup.string(),
  detailDesciption: yup.string(),
  count: yup.number().required("Это поле обязательно").min(0, "Количество не может быть меньше 0"),
  price: yup.number().required("Это поле обязательно").min(0, "Цена не может быть меньше 0"),
  photo: yup.string()
});

module.exports = createProductValidator;