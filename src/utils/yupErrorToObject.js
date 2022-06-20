function yupErrorToObject(error) {
  const inner = error.inner.length ? error.inner : [error];
  return inner.reduce((acc, err) => {
    acc[err.path] = err.message;
    return acc;
  }, {});
}

module.exports = yupErrorToObject;
