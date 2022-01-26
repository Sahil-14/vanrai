const express = require('express');
const { body } = require('express-validator');
const db = require('../models');
const Service = db.services;
const Package = db.packages;
const Users = db.users;
const Dates = db.dates;
const Messages = db.messages
const Bookings = db.bookings;
const { validateRequest } = require('../middleware/validateRequest');
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const axios = require('axios');
var moment = require('moment')
var colors = require('colors');

const adminRouter = express.Router();

const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');




/*******************************
 * ------- 1.Dashboard --------*
 *******************************/
adminRouter.get('/vanrai-demo/', async (req, res) => {

  res.render('pages/demo')
})

adminRouter.get('/vanrai-admin/', currentUser, requireAuth, async (req, res) => {
  let serviceCount = 0, packageCount = 0, userCount = 0, bookingCount = 0;
  const currentUser = req.currentUser
  try {
    serviceCount = await Service.count({});
    packageCount = await Package.count({});
    userCount = await Users.count({})
    bookingCount = await Bookings.count({})
    console.log(colors.green(serviceCount, packageCount, userCount, bookingCount))
  } catch (error) {
    console.log(colors.red(error));
  }
  res.render('pages/adminPages/dashboard', {
    serviceCount,
    packageCount,
    userCount,
    bookingCount,
    currentUser
  })
})

/*******************************
 * ------ 2.users routes --------*
 *******************************/
adminRouter.get('/vanrai-admin/users', currentUser, requireAuth, async (req, res) => {
  const token = req.session?.jwt;
  const currentUser = req.currentUser

  try {
    // const response = await axios.get("http://localhost:5000/api/users/", { headers: { "Authorization": `Bearer ${token}` } });
    const response = await axios.get("http://vanraiadventures.in:5000/api/users/", { headers: { "Authorization": `Bearer ${token}` } });

    const users = response.data.users;


    res.render('pages/adminPages/users', {
      users,
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      error: null,
      currentUser
    })

  } catch (error) {

    res.render('pages/adminPages/users', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      users: null,
      error: "Error to load users .Please try after some time.",
      currentUser
    })
  }

})

/***********************************
 * ------ 2.users routes end--------*
 ***********************************/



/*******************************
 * ------ 3.service routes -----*
 *******************************/
adminRouter.get('/vanrai-admin/services', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  try {
    // const response = await axios.get("http://localhost:5000/api/services/");
    const response = await axios.get("http://vanraiadventures.in:5000/api/services/");
    res.render('pages/adminPages/services', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      services: response.data.services,
      error: null,
      currentUser
    })

  } catch (error) {

    res.render('pages/adminPages/services', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      services: null,
      error: "Error to load service .Please try after some time.",
      currentUser
    })
  }
})

/*******************************
 * --- 3.service routes ends---*
 *******************************/

/*******************************
 * -------4.package routes -----*
 *******************************/
adminRouter.get('/vanrai-admin/packages', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  try {
    // const response = await axios("http://localhost:5000/api/packages/");

    const response = await axios("http://vanraiadventures.in:5000/api/packages/");

    res.render('pages/adminPages/packages', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      packages: response.data.packages,
      error: null,
      currentUser
    })

  } catch (error) {
    res.render('pages/adminPages/packages', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      packages: null,
      error: "Error to load service .Please try after some time.",
      currentUser
    })
  }
})

/*******************************
 * -- 4,package route ends  ---*
 *******************************/

/*******************************
 * ------- 5.login --------*
 *******************************/
adminRouter.get('/vanrai-admin/login', async (req, res) => {
  res.render('pages/adminPages/login')
})
/*******************************
 * ------- 5.login --------*
 *******************************/

/*******************************
 * ------- 6.Dates --------*
 *******************************/
adminRouter.get('/vanrai-admin/dates', currentUser, requireAuth, async (req, res) => {
  const token = req.session?.jwt;
  const currentUser = req.currentUser

  var uniquePackages = [];
  try {
    const packages = await Dates.findAll({
      attributes: ['package_name']
    })
    if (packages.length > 0) {
      const uniquePackagesMap = new Map(packages.map(item =>
        [item['package_name'], item.package_name])).values();
      uniquePackages = [...uniquePackagesMap]
    }

    const dates = await Dates.findAll({
      where: {
        package_name: req.query?.package_name ? req.query?.package_name : uniquePackages
      }
    });
    console.log(uniquePackages)
    res.render('pages/adminPages/dates', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      dates,
      uniquePackages,
      error: null,
      moment,
      currentUser
    })

  } catch (error) {

    res.render('pages/adminPages/dates', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      dates: null,
      uniquePackages: [],
      error: "Error to fetch dates .Please try ",
      currentUser
    })
  }
})
/*******************************
 * ------- 6.Dates --------*
 *******************************/

/*******************************
 * ------- 7.bookings --------*
 *******************************/
adminRouter.get('/vanrai-admin/bookings', currentUser, requireAuth, async (req, res) => {
  var uniquePackages = [];
  var uniqueDates = [];
  const currentUser = req.currentUser

  try {
    const packagesAndDates = await Dates.findAll({
      attributes: ['package_name', 'date']
    })
    var packages = [];
    var dates = [];
    if (packagesAndDates.length > 0) {
      packagesAndDates.forEach((item) => {
        packages.push(item.package_name);
        dates.push(item.date);
      })
    }

    if (packages.length > 0) {
      uniquePackages = packages.filter((item, index, self) => {
        return self.indexOf(item) === index
      })
    }
    if (dates.length > 0) {
      uniqueDates = dates.filter((item, index, self) => {
        return self.indexOf(item) === index
      })
    }
    console.log(uniqueDates);


    const bookings = await Bookings.findAll({
      where: {
        package_name: req.query?.package_name ? req.query?.package_name : uniquePackages
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });

    res.render('pages/adminPages/bookings', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      uniquePackages,
      bookings,
      error: null,
      moment,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/bookings', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      uniquePackages: null,
      bookings: null,
      error: "Error to fetch bookings .Please try ",
      currentUser
    })
  }

})
/*******************************
 * ------- 7.bookings --------*
 *******************************/
module.exports = {
  adminRouter
}



