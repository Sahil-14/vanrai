const express = require('express');
const { body } = require('express-validator');
const db = require('../models');
const Message = db.messages;
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const contactRouter = express.Router();
const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const url = require('url')

contactRouter.get('/contact', async (req, res) => {
  res.render('pages/contact', {
    page: "contact",
    successMessage: req.query?.successMessage || null,
    errorMessage: req.query?.errorMessage || null,
  })
})

contactRouter.get('/vanrai-admin/message', currentUser, requireAuth,async(req,res) => {
  try {
    
  } catch (error) {
    
  }
})

contactRouter.post('/vanrai-admin/message', currentUser, requireAuth, async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const newMessage = {
      name,
      email,
      message
    }

    await Message.create(newMessage);
    res.redirect(url.format({
      pathname: "/contact",
      query: {
        "successMessage": "Your response submitted successfully.Thank you !",
        "errorMessage": null,
      }
    }));
  } catch (error) {
    res.redirect(url.format({
      pathname: "/contact",
      query: {
        "successMessage": null,
        "errorMessage": "Error to submit response .Please try later.",
      }
    }));
  }
})

module.exports = {
  contactRouter
}
