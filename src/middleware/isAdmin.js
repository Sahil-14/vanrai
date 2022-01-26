const { NotAuthorizeError } = require('../error')

const isAdmin = (req, res, next) => {

  if (req.currentUser?.isadmin == 0) {
    throw new NotAuthorizeError();
  }
  next();
}

module.exports = {
  isAdmin
}