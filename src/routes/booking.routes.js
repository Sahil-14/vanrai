const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models');
const Bookings = db.bookings;

const bookingRouter = express.Router();


const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const { auth } = require('../middleware/auth');
var moment = require('moment')
const url = require('url');
const { validateRequest } = require('../middleware/validateRequest');
const { NotFoundError } = require('../error');



// booking create form from package/:id page
bookingRouter.post('/vanrai-admin/bookings',
  [
    body('name')
      .isLength({ min: 5 })
      .withMessage('Please enter valid name'),
    body('email')
      .isEmail()
      .withMessage('Please enter valid name'),
    body('phone')
      .isMobilePhone()
      .withMessage('Please enter valid mobile number.'),
    body('people')
      .isInt({ min: 1 })
      .withMessage("Minimum 1 person necessary")
  ]
  ,
  currentUser, requireAuth, async (req, res) => {
    const { package_name, package_id, name, email, phone, people, date, price } = req.body;
    const status = "waiting"
    var myMomentObject = null;
    var formatedDate = null;
    if (date) {
      myMomentObject = moment(date, 'MM-DD-YYYY').toDate()
      formatedDate = moment(myMomentObject).format('YYYY-MM-DD');
    }


    const totalPrice = parseInt(parseInt(people) * parseInt(price));

    const newBooking = {
      name,
      email,
      phone,
      date: formatedDate,
      package_id,
      price: totalPrice,
      people: parseInt(people),
      status,
      package_name
    }
    const errors = validationResult(req);

    try {
      var errMess = ""
      if (!errors.isEmpty()) {
        errors.errors.map((err) => {
          errMess += err.msg + "\n";
        })
        throw new Error();
      }
      const booking = await Bookings.create(newBooking)
      res.redirect(url.format({
        pathname: `/package/${package_id}`,
        query: {
          "successMessage": "Your response is submitted successfully.You will receive a call once your booking is confirmed. Thank you !",
          "errorMessage": null,
        }
      }));
    } catch (error) {
      res.redirect(url.format({
        pathname: `/package/${package_id}`,
        query: {
          "successMessage": null,
          "errorMessage": !errors.isEmpty() ? errMess : "Sorry ! Error to submit your response please try later.",
        }
      }));
    }
  })

bookingRouter.post('/vanrai-admin/bookings/filter', currentUser, requireAuth, async (req, res) => {
  const reqob = Object.keys(req.body)
  var params = {};
  if (reqob.includes("all") || reqob.length == 0) {

  } else {
    params = {
      "package_name": reqob,
    }
  }
  res.redirect(url.format({
    pathname: "/vanrai-admin/bookings",
    query: params
  }));
})
//booking status update page (GET)
bookingRouter.get('/vanrai-admin/updateBooking/:id', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  try {
    const booking = await Bookings.findOne({
      where: {
        booking_id: req.params.id
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });
    res.render('pages/adminPages/updateBooking', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      booking,
      error: null,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/updateBooking', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      booking: null,
      error: 'Error to get booking details',
      currentUser
    })
  }

})
//booking status update page (POST)
bookingRouter.post('/vanrai-admin/updateBooking/:id', currentUser, requireAuth, async (req, res) => {
  try {
    const response = await Bookings.update(req.body, { where: { booking_id: req.params.id } })
    if (response == 1) {
      res.redirect(url.format({
        pathname: "/vanrai-admin/bookings",
        query: {
          "successMessage": "Booking Status updatd successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }
  } catch (error) {
    res.redirect(url.format({
      pathname: "/vanrai-admin/bookings",
      query: {
        "successMessage": null,
        "errorMessage": error instanceof NotFoundError ? 'Booking not found' : 'Error to update booking status.'
      }
    }));
  }
})

module.exports = {
  bookingRouter
}