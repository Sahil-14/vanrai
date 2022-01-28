const express = require('express');
const { body } = require('express-validator');
const db = require('../models');
const Dates = db.dates;

const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const axios = require('axios');

const dateRouter = express.Router();

const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const { auth } = require('../middleware/auth');

const url = require('url');
const { validateRequest } = require('../middleware/validateRequest');


//get all dates
dateRouter.get('/api/dates/', auth, requireAuth, async (req, res) => {
  try {
    const dates = await Dates.findAll({
      where: {
      }
    });
    res.status(200).send({ dates });
  } catch (error) {
    console.log(error)
    throw new DatabaseOperationError("Error to fetch dates");
  }
})

dateRouter.post('/vanrai-admin/dates', currentUser, requireAuth, async (req, res) => {

  const reqob = Object.keys(req.body)
  var params = {};
  if (reqob.includes("all") || reqob.length == 0) {

  } else {
    params = {
      "package_name": reqob,
    }
  }
  res.redirect(url.format({
    pathname: "/vanrai-admin/dates",
    query: params
  }));
})


// update
dateRouter.get('/vanrai-admin/updateDate/:id', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  try {
    const date = await Dates.findOne({ where: { id: req.params.id } })

    res.render('pages/adminPages/updateDate', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      date,
      error: null,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/updateDate', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      date: null,
      error: 'Date not found',
      currentUser
    })
  }
})

dateRouter.post('/vanrai-admin/updateDate/:id',
  [
    body('totalseats')
      .isInt({ min: 0 })
      .optional({ nullable: true }),
    body('availableseats')
      .isInt({ min: true })
      .optional({ nullable: true })
  ],
  validateRequest,
  currentUser,
  requireAuth,
  async (req, res) => {
    const { total_seats, available_seats } = req.body
    console.log((parseInt(available_seats)))
    try {
      const updatedFeatures = {
        total_seats,
        available_seats
      }
    } catch (error) {

    }
  })
module.exports = {
  dateRouter
}
