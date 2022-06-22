function filterObject(obj) {
  const result = {}
  for (key in obj) {
    if (obj[key] !== null && obj[key] !== '') {
      result[key] = obj[key];
    }
  }
  return result;
}

module.exports = filterObject;
