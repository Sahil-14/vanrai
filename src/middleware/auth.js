const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.users;
const { NotAuthorizeError } = require('../error');
const auth = (req, res, next) => {
   try {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      req.currentUser = decoded
      next();

   } catch (error) {
      throw new NotAuthorizeError();
   }

}

module.exports = { auth };