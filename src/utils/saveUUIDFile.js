const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function saveUUIDFile(dir, file) {
  const fileName = crypto.randomUUID() + path.extname(file.originalname);
  try {
    await fs.promises.access(dir);
  } catch(_) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  const stream = fs.createWriteStream('./public/models/' + fileName);
  stream.write(file.buffer);
  return fileName;
}

module.exports = saveUUIDFile;
