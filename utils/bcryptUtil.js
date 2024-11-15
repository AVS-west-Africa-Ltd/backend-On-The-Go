const bcrypt = require('bcryptjs');

const bcryptUtil = {
  hashPassword: (password) => bcrypt.hashSync(password, 10),
  comparePasswords: (password, hash) => bcrypt.compareSync(password, hash),
};

module.exports = bcryptUtil;
