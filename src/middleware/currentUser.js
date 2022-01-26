const jwt = require('jsonwebtoken')
const currentUser = (req, res, next) => {
  if (!req.session?.jwt) {
    return next();
  }

  try {
    const payload = jwt.verify(
      req.session.jwt,
      "thisissecret"
    );
    req.currentUser = payload;
  } catch (error) {

  }
  next();
}

module.exports = {
  currentUser
}