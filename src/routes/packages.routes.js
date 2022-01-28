/****************    Documantaion    ************
 * author - sahil shimpi
 * folder  - routes/packages
 * lastupdate - 14/jan/2022
 * 
 * -------- Index  ------
 * 
 * 
 * 
 * 
 */
const express = require('express');
const { body } = require('express-validator');
const db = require('../models');
const Packages = db.packages;
const PackageHighlights = db.packageHighlights;
const Dates = db.dates;
const { validateRequest } = require('../middleware/validateRequest');
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const axios = require('axios');
const packageRouter = express.Router();
const multer = require("multer");
const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const { auth } = require('../middleware/auth');

var moment = require('moment'); // require
const url = require('url');


const Op = db.Sequelize.Op;



const upload = multer({

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("file must be a image"));
    }
    cb(undefined, true);
  },
});


/*******************************
 * -- package page --------*
 *******************************/
packageRouter.get('/packages', async (req, res) => {
  try {

    const response = await axios.get("http://vanraiadventures.in/api/packages/");

    res.render('pages/packages', {
      page: 'packages',
      packages: response.data.packages,
      moment,
      error: null
    })
  } catch (error) {
    console.log(error)
    res.render('pages/packages', {
      page: 'packages',
      error: "Error to load packages .Please try after some time."
    })
  }
})

/*******************************************************
 * -- single package page  \\ package booking page------*
 *******************************************************/
packageRouter.get('/package/:id', async (req, res) => {
  try {
    const response = await axios.get(`http://vanraiadventures.in/api/packages/${req.params.id}`);

    const dates = await Dates.findAll({ where: { package_id: req.params.id }, attributes: ['date'] })
    var availableDates = [];
    dates.forEach((item) => {
      const formatedDate = moment(item.date).format('DD-MM-YYYY');
      availableDates.push(formatedDate);
    })


    res.render('pages/packageBooking', {
      page: 'packagesBooking',
      package: response.data.package,
      availableDates,
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      moment,
      error: null
    })
  } catch (error) {
    console.log(error)
    res.render('pages/packageBooking', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      page: 'packagesBooking',
      error: "Error to load package .Please try after some time."
    })
  }
})
/*******************************
 * -- 1.create package --------*
 *******************************/
packageRouter.get('/vanrai-admin/createPackage', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  res.render('pages/adminPages/createPackage', { currentUser })
})

packageRouter.post('/vanrai-admin/createPackage',
  currentUser,
  requireAuth,
  upload.single("packimage"),
  [
    body("name")
      .isLength({ min: 4, max: 255 })
      .withMessage("Name must be between 4 to 255 characters"),
    body("location")
      .isLength({ min: 1, max: 255 })
      .withMessage("Location must be between 4 to 255 characters"),
    body("duration")
      .isLength({ min: 1, max: 255 })
      .withMessage("Duration must be between 4 to 255 characters"),
    body("seats")
      .isInt({ min: 0 })
      .optional({ nullable: true, checkFalsy: true })
      .withMessage("Seats must be grater of equal to 0"),
    body("price")
      .isInt({ min: 0 })
      .withMessage("Price must be grater of equal to 0"),
    body("description")
      .isLength({ min: 1, max: 500 })
      .withMessage("description must be between 1 to 500 characters")
  ],
  validateRequest,
  async (req, res) => {
    const { name, location, duration, price, description, highlights, dates, isrecommended } = req.body;
    var packageDates = dates.split(",")
    var mnDate = packageDates.reduce(function (a, b) {
      return a < b ? a : b;
    });
    const start_date = mnDate;
    var mxDate = packageDates.reduce(function (a, b) {
      return a > b ? a : b;
    });
    const end_date = mxDate;

    try {
      const existingPackage = await Packages.findOne({ where: { name }, attributes: ['package_id', 'name'] });
      if (existingPackage) {
        throw new BadRequestError('Package aleady exists.');
      }
      const buffer = req.file.buffer
      const newPackage = {
        name: name.toLowerCase(),
        location,
        duration,
        start_date,
        end_date,
        price,
        image: buffer,
        description,
        isrecommended: isrecommended ? 1 : 0
      }

      //save package
      var package = await Packages.create(newPackage);
      const package_id = package.package_id;

      var highlightsArray = [];

      if (highlights instanceof Array) {
        highlights.map((item) => {
          highlightsArray.push({
            name: item,
            package_id
          })
        })

        await PackageHighlights.bulkCreate(highlightsArray);
      } else {
        await PackageHighlights.create({ name: highlights, package_id });
      }

      var splitedDates = [];
      if (packageDates?.length >= 1 && packageDates[0] != "") {
        packageDates.map((date) => {
          splitedDates.push({
            date,
            package_id,
            package_name: name
          })
        })
        await Dates.bulkCreate(splitedDates);
      }

      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": "package created successfully!",
          "errorMessage": null,
        }
      }));

    } catch (error) {
     
      var err = "";
      if (error instanceof BadRequestError) {
        err = `package already exist with name = ${name}`
      } else {
        err = error
      }

      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": null,
          "errorMessage": err,
        }
      }));
    }

  })

/*******************************
 * -- 2.get all package --------*
 *******************************/
packageRouter.get('/api/packages/', async (req, res) => {
  try {
    const packages = await Packages.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: {
        model: PackageHighlights,
        attributes: ['name']
      }
    });
    res.status(200).send({ packages })
  } catch (error) {
    console.log(error)
    throw new DatabaseOperationError("Error to fetch packages.")
  }
})


/*******************************
 * -- 3.get package by id -----*
 *******************************/
packageRouter.get('/api/packages/:id', async (req, res) => {
  const package_id = req.params.id;
  try {
    const package = await Packages.findOne({
      where: {
        package_id
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: {
        model: PackageHighlights,
        attributes: ['name']
      }
    });
    res.status(200).send({ package });
  } catch (error) {
    console.log(error);
    throw new DatabaseOperationError("Error to fetch users");
  }
})

/*******************************
 * -- 3.create package     -----*
 *******************************/


/*******************************
 * -- 4.delete package by id --*
 *******************************/
packageRouter.get('/vanrai-admin/deletePackage/:id', currentUser, requireAuth, async (req, res) => {
  const package_id = req.params.id;
  try {
    const response = await Packages.destroy({ where: { package_id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": "Package deleted successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }
  } catch (error) {
    let err = ""
    if (error instanceof NotFoundError) {
      err = "Package not found"
    } else {
      err = "Error to delete package"
    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/packages",
      query: {
        "successMessage": null,
        "errorMessage": err,
      }
    }));
  }
})

/*******************************
 * -- 5.update package by id --*
 *******************************/
packageRouter.get('/vanrai-admin/updatePackage/:id', currentUser, requireAuth, async (req, res) => {
  const token = req.session?.jwt;
  const currentUser = req.currentUser

  try {

    const response = await axios.get(`http://vanraiadventures.in/api/packages/${req.params.id}`, { headers: { "Authorization": `Bearer ${token}` } });

    const dates = await Dates.findAll({ where: { package_id: req.params.id }, attributes: ['date'] })
    var dateToString = [];
    if (dates.length > 0) {
      dates.forEach((date, index) => {
        dateToString.push(date.date)
      })
    }
    dateToString = dateToString.toString();
    var package = {
      ...response.data.package,
      dates: dateToString
    }

    res.render('pages/adminPages/updatePackage', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      package,
      error: null,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/updatePackage', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      package: null,
      error: error instanceof NotFoundError ? 'Package not found' : 'Error to get package .Please try later.',
      currentUser
    })
  }
})
packageRouter.post('/vanrai-admin/updatePackage/:id',
  currentUser,
  requireAuth,
  [
    body("name")
      .isLength({ min: 4, max: 255 })
      .withMessage("Name must be between 4 to 255 characters"),
    body("location")
      .isLength({ min: 1, max: 255 })
      .withMessage("Location must be between 4 to 255 characters"),
    body("duration")
      .isLength({ min: 1, max: 255 })
      .withMessage("Duration must be between 4 to 255 characters"),
    body("price")
      .isInt({ min: 0 })
      .withMessage("Price must be grater of equal to 0"),
    body("description")
      .isLength({ min: 1, max: 500 })
      .withMessage("description must be between 1 to 500 characters")
  ],
  validateRequest,
  async (req, res) => {
    const package_id = req.params.id;
    const { name, location, duration, price, description, highlights, isrecommended, dates } = req.body;
    var packageDates = dates.split(",")
    var mnDate = packageDates.reduce(function (a, b) {
      return a < b ? a : b;
    });
    const start_date = mnDate;
    var mxDate = packageDates.reduce(function (a, b) {
      return a > b ? a : b;
    });
    const end_date = mxDate;
    try {
      const existingPackage = await Packages.findOne({ where: { name }, attributes: ['package_id', 'name'] });
      if (existingPackage && package_id != existingPackage.package_id) {
        throw new BadRequestError('Service aleady exists.');
      }
      const newPackage = {
        package_id,
        name: name.toLowerCase(),
        location,
        duration,
        start_date,
        end_date,
        price,
        description,
        isrecommended: isrecommended ? 1 : 0
      }
      //update package
      const packageUpdateResponse = await Packages.update(newPackage, { where: { package_id } });
      if (packageUpdateResponse == 1) {
        //delete package highlights
        const deletedHighlightResponse = await PackageHighlights.destroy({ where: { package_id } });
        if (deletedHighlightResponse != 0) {
          //recreate highlights from updated data
          var highlightsArray = [];
          highlights.map((item) => {
            highlightsArray.push({
              name: item,
              package_id
            })
          })
          //save package highlights
          await PackageHighlights.bulkCreate(highlightsArray);
          res.redirect(url.format({
            pathname: "/vanrai-admin/packages",
            query: {
              "successMessage": "package updated successfully!",
              "errorMessage": null,
            }
          }));
        } else {
          throw new NotFoundError();
        }
        //detele existing dates
        const deletedDateResponse = await Dates.destroy({ where: { package_id } });
        if (deletedDateResponse != 0) {
          //update dates
          var splitedDates = [];
          if (packageDates?.length >= 1 && packageDates[0] != "") {
            packageDates.map((date) => {
              splitedDates.push({
                date,
                package_id,
                package_name: name
              })
            })
            await Dates.bulkCreate(splitedDates);
          }
        } else {
          throw new NotFoundError();
        }

      } else {
        throw new NotFoundError();
      }
    } catch (error) {
      
      if (error instanceof BadRequestError) {
        err = `Package with name =${name} already exist`
      } else if (error instanceof NotFoundError) {
        err = "Package not found"
      } else {
        err = error
      }
      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": null,
          "errorMessage": err,
        }
      }));
    }
  })
/*******************************
 *  6. get image by id ----*
 *******************************/
packageRouter.get('/api/packages/image/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const package = await Packages.findOne({
      where: {
        package_id: id
      },
      attributes: ['image']
    });
    if (!package) {
      throw new NotFoundError();
    }

    res.set('Content-Type', 'image');
    res.status(200).send(package.image);

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError();
    } else {
      throw new DatabaseOperationError("Error to fetch users");

    }
  }
})
//change image
packageRouter.post('/vanrai-admin/packages/image/:id', upload.single("packimage"), async (req, res) => {
  const package_id = req.params.id;
  const image = req.file.buffer
  try {
    const response = await Packages.update({ image }, { where: { package_id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: `/vanrai-admin/updatePackage/${package_id}`,
        query: {
          "successMessage": "Image updated successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }

  } catch (error) {
    let err = '';
    if (error instanceof NotFoundError) {
      err = 'Package not found'
    } else {
      err = 'Error to update image, please try again'
    }
    res.redirect(url.format({
      pathname: `/vanrai-admin/updatePackage/${package_id}`,
      query: {
        "successMessage": null,
        "errorMessage": err,
      }
    }));
  }

})

module.exports = {
  packageRouter
}