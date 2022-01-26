const { NotAuthorizeError } = require('../error')

const requireAuth = (req, res, next) => {

  if (!req.currentUser) {
    throw new NotAuthorizeError();
  }
  next();
}

module.exports = {
  requireAuth
}