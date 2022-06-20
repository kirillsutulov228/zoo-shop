function sequelizeErrorToObject(error) {
  return error.errors.reduce((acc, e) => {
    acc[e.path] = e.message;
    return acc;
  }, {});
}

module.exports=sequelizeErrorToObject;
