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
const Ttc = db.ttc;
const Wwg = db.wwg;
const Wwd = db.wwd;
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
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
    {
      return cb(new Error("file must be a image"));
    }
    cb(undefined, true);
  },
});


/*******************************
 * -- package page --------*
 *******************************/
packageRouter.get('/packages', async (req, res) => {
  try
  {

    const response = await axios.get(`${process.env.URL}/api/packages/`);

    res.render('pages/packages', {
      page: 'packages',
      packages: response.data.packages,
      moment,
      error: null
    })
  } catch (error)
  {

    res.render('pages/packages', {
      page: 'packages',
      error: "Error to load packages .Please try after some time."
    })
  }
})

packageRouter.get('/package/documentedPackage/:name', async (req, res) => {
  const formatedName = req.params.name.trim().toLowerCase().replace(/-/g, ' ');

  try
  {
    // const formatedName = req.params.name.trim().toLowerCase().replace(/-/g, ' ');
    // console.log(formatedName);

    const response = await axios.get(`${process.env.URL}/api/packages/formated/${formatedName}`);
    const package = response.data.package;
    const dates = await Dates.findAll({ where: { package_id: package.package_id }, attributes: ['date'] })
    var availableDates = [];
    dates.forEach((item) => {
      const formatedDate = moment(item.date).format('DD-MM-YYYY');
      availableDates.push(formatedDate);
    })
    res.render('pages/packageBooking', {
      package,
      page: 'packages',
      availableDates,
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      moment,
      error: null
    })


  } catch (error)
  {

    res.render('pages/', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      page: 'packagesBooking',
      error: "Error to load package .Please try after some time."
    })
  }

})
/*******************************************************
 * -- single package page  \\ package booking page------*
 *******************************************************/
packageRouter.get('/package/:id', async (req, res) => {
  try
  {
    const formatedName = req.params.name.trim().toLowerCase().replace(/-/g, ' ');
    console.log(formatedName);
    const response = await axios.get(`${process.env.URL}/api/packages/${req.params.id}`);
    const package = response.data.package;
    console.log(package);
    const dates = await Dates.findAll({ where: { package_id: req.params.id }, attributes: ['date'] })
    var availableDates = [];
    dates.forEach((item) => {
      const formatedDate = moment(item.date).format('DD-MM-YYYY');
      availableDates.push(formatedDate);
    })
    res.render('pages/packageBooking', {
      package,
      page: 'packages',
      availableDates,
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      moment,
      error: null
    })


  } catch (error)
  {

    res.render('pages/', {
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
    body("description")
      .isLength({ min: 1, max: 5000 })
      .withMessage("description must be between 1 to 5000 characters")
  ],
  validateRequest,
  async (req, res) => {
    const { name, location, duration, price, description, itinerary, highlights, thingsToCarry, whatWeGive, whatWeDont, dates, isrecommended, video } = req.body;
    var start_date = null;
    var end_date = null;
    var packageDates = null;
    if (dates)
    {
      packageDates = dates.split(",")
      var mnDate = packageDates.reduce(function (a, b) {
        return a < b ? a : b;
      });
      start_date = mnDate;
      var mxDate = packageDates.reduce(function (a, b) {
        return a > b ? a : b;
      });
      end_date = mxDate;
    }

    try
    {
      const existingPackage = await Packages.findOne({ where: { name }, attributes: ['package_id', 'name'] });
      if (existingPackage)
      {
        throw new BadRequestError('Package aleady exists.');
      }
      const buffer = req.file.buffer
      const newPackage = {

        name: name.trim().toLowerCase(),
        location,
        duration,
        start_date,
        end_date,
        price: price ? price : null,
        image: buffer,
        video: video ? video : null,
        itinerary: itinerary ? itinerary : null,
        description,
        isrecommended: isrecommended ? 1 : 0
      }

      //save package
      var package = await Packages.create(newPackage);
      const package_id = package.package_id;
      //save highlights (event details)
      var highlightsArray = [];
      if (highlights)
      {
        if (highlights instanceof Array)
        {
          highlights.map((item) => {
            highlightsArray.push({
              name: item,
              package_id
            })
          })
          await PackageHighlights.bulkCreate(highlightsArray);
        } else
        {
          await PackageHighlights.create({ name: highlights, package_id });
        }
      }
      //save ttc
      var thingsToCarryArray = [];
      if (thingsToCarry)
      {
        if (thingsToCarry instanceof Array)
        {
          thingsToCarry.map((item) => {
            thingsToCarryArray.push({
              name: item,
              package_id
            })
          })

          await Ttc.bulkCreate(thingsToCarryArray);
        } else
        {
          await Ttc.create({ name: thingsToCarry, package_id });
        }
      }

      //what we give
      var whatWeGiveArray = [];
      if (whatWeGive)
      {
        if (whatWeGive instanceof Array)
        {
          whatWeGive.map((item) => {
            whatWeGiveArray.push({
              name: item,
              package_id
            })
          })
          await Wwg.bulkCreate(whatWeGiveArray);
        } else
        {
          await Wwg.create({ name: whatWeGive, package_id });
        }
      }

      //what we dont
      var whatWeDontArray = [];
      if (whatWeDont)
      {
        if (whatWeDont instanceof Array)
        {
          whatWeDont.map((item) => {
            whatWeDontArray.push({
              name: item,
              package_id
            })
          })

          await Wwd.bulkCreate(whatWeDontArray);
        } else
        {
          await Wwd.create(whatWeDont);
        }
      }

      var splitedDates = [];
      if (packageDates)
      {
        if (packageDates?.length >= 1 && packageDates[0] != "")
        {
          packageDates.map((date) => {
            splitedDates.push({
              date,
              package_id,
              package_name: name
            })
          })
          await Dates.bulkCreate(splitedDates);
        }
      }


      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": "package created successfully!",
          "errorMessage": null,
        }
      }));

    } catch (error)
    {

      var err = "";
      if (error instanceof BadRequestError)
      {
        err = `package already exist with name = ${name}`
      } else
      {
        err = "Error to create package";
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
  try
  {
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
  } catch (error)
  {

    throw new DatabaseOperationError("Error to fetch packages.")
  }
})


/*******************************
 * -- 3.get package by id -----*
 *******************************/
packageRouter.get('/api/packages/:id', async (req, res) => {
  const package_id = req.params.id;

  try
  {
    const package = await Packages.findOne({
      where: {
        package_id
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: [
        {
          model: PackageHighlights,
          attributes: ['name']
        },
        {
          model: Ttc,
          attributes: ['name']
        },
        {
          model: Wwg,
          attributes: ['name']
        },
        {
          model: Wwd,
          attributes: ['name']
        }
      ]
    });

    res.status(200).send({ package });
  } catch (error)
  {

    throw new DatabaseOperationError("Error to fetch users");
  }
})
packageRouter.get('/api/packages/formated/:name', async (req, res) => {
  const name = req.params.name
  try
  {
    const package = await Packages.findOne({
      where: {
        name
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: [
        {
          model: PackageHighlights,
          attributes: ['name']
        },
        {
          model: Ttc,
          attributes: ['name']
        },
        {
          model: Wwg,
          attributes: ['name']
        },
        {
          model: Wwd,
          attributes: ['name']
        }
      ]
    });

    res.status(200).send({ package });
  } catch (error)
  {
    throw new DatabaseOperationError("Error to fetch package");
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
  try
  {
    const response = await Packages.destroy({ where: { package_id } });
    if (response == 1)
    {
      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": "Package deleted successfully!",
          "errorMessage": null,
        }
      }));
    } else
    {
      throw new NotFoundError();
    }
  } catch (error)
  {
    let err = ""
    if (error instanceof NotFoundError)
    {
      err = "Package not found"
    } else
    {
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

  try
  {

    const response = await axios.get(`${process.env.URL}/api/packages/${req.params.id}`, { headers: { "Authorization": `Bearer ${token}` } });

    const dates = await Dates.findAll({ where: { package_id: req.params.id }, attributes: ['date'] })
    var dateToString = [];
    if (dates.length > 0)
    {
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
  } catch (error)
  {
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

    body("description")
      .isLength({ min: 5, max: 5000 })
      .withMessage("description must be between 5 to 500 characters")
  ],
  validateRequest,
  async (req, res) => {
    const package_id = req.params.id;
    const { name, location, duration, price, description, highlights, thingsToCarry, whatWeGive, whatWeDont, itinerary, isrecommended, dates, video } = req.body;
    var start_date = null;
    var end_date = null;
    var packageDates = null;
    if (dates)
    {
      packageDates = dates.split(",")
      var mnDate = packageDates.reduce(function (a, b) {
        return a < b ? a : b;
      });
      start_date = mnDate;
      var mxDate = packageDates.reduce(function (a, b) {
        return a > b ? a : b;
      });
      end_date = mxDate;
    }

    try
    {
      const existingPackage = await Packages.findOne({ where: { name }, attributes: ['package_id', 'name'] });
      if (existingPackage && package_id != existingPackage.package_id)
      {
        throw new BadRequestError('Service aleady exists.');
      }
      const newPackage = {
        package_id,
        name: name.trim().toLowerCase(),
        location,
        duration,
        start_date,
        end_date,
        price: price ? price : null,
        description,
        video: video ? video : null,
        itinerary: itinerary ? itinerary : null,
        isrecommended: isrecommended ? 1 : 0
      }
      //update package
      const packageUpdateResponse = await Packages.update(newPackage, { where: { package_id } });
      if (packageUpdateResponse != 0)
      {
        //delete package highlights
        await PackageHighlights.destroy({ where: { package_id } });
        if (highlights)
        {
          if (highlights instanceof Array)
          {
            var highlightsArray = [];
            highlights.map((item) => {
              highlightsArray.push({
                name: item,
                package_id
              })
            })
            //save package highlights
            await PackageHighlights.bulkCreate(highlightsArray);
          } else
          {
            await PackageHighlights.create({
              name: highlights,
              package_id
            })
          }
        }
        // detele existing dates
        if (dates)
        {
          await Dates.destroy({ where: { package_id } });

          //update dates
          var splitedDates = [];
          if (packageDates?.length >= 1 && packageDates[0] != "")
          {

            packageDates.map((date) => {
              splitedDates.push({
                date,
                package_id,
                package_name: name
              })
            })
            await Dates.bulkCreate(splitedDates);
          }

        }

        await Ttc.destroy({ where: { package_id } });
        if (thingsToCarry)
        {

          var thingsToCarryArray = [];
          if (thingsToCarry instanceof Array)
          {
            thingsToCarry.map((item) => {
              thingsToCarryArray.push({
                name: item,
                package_id
              })
            })

            await Ttc.bulkCreate(thingsToCarryArray);
          } else
          {
            await Ttc.create({ name: thingsToCarry, package_id });
          }
        }

        await Wwg.destroy({ where: { package_id } });
        if (whatWeGive)
        {
          var whatWeGiveArray = [];
          if (whatWeGive instanceof Array)
          {
            whatWeGive.map((item) => {
              whatWeGiveArray.push({
                name: item,
                package_id
              })
            })
            await Wwg.bulkCreate(whatWeGiveArray);
          } else
          {
            await Wwg.create({ name: whatWeGive, package_id });
          }
        }
        await Wwd.destroy({ where: { package_id } });
        if (whatWeDont)
        {
          var whatWeDontArray = [];
          if (whatWeDont instanceof Array)
          {
            whatWeDont.map((name) => {
              whatWeDontArray.push({
                name,
                package_id
              })
            })
            await Wwd.bulkCreate(whatWeDontArray);
          } else
          {
            await Wwd.create({
              name: whatWeDont,
              package_id
            });
          }
        }

        res.redirect(url.format({
          pathname: "/vanrai-admin/packages",
          query: {
            "successMessage": "package updated successfully!",
            "errorMessage": null,
          }
        }));




      } else
      {
        throw new NotFoundError();
      }


    } catch (error)
    {
      console.log(error);
      if (error instanceof BadRequestError)
      {
        err = `Package with name =${name} already exist`
      } else if (error instanceof NotFoundError)
      {
        err = "Package not found"
      } else
      {
        err = "Error to update package";
      }
      res.redirect(url.format({
        pathname: "/vanrai-admin/packages",
        query: {
          "successMessage": null,
          "errorMessage": error,
        }
      }));
    }
  })
/*******************************
 *  6. get image by id ----*
 *******************************/
packageRouter.get('/api/packages/image/:id', async (req, res) => {
  const id = req.params.id;
  try
  {
    const package = await Packages.findOne({
      where: {
        package_id: id
      },
      attributes: ['image']
    });
    if (!package)
    {
      throw new NotFoundError();
    }

    res.set('Content-Type', 'image');
    res.status(200).send(package.image);

  } catch (error)
  {
    if (error instanceof NotFoundError)
    {
      throw new NotFoundError();
    } else
    {
      throw new DatabaseOperationError("Error to fetch users");

    }
  }
})
//change image
packageRouter.post('/vanrai-admin/packages/image/:id', upload.single("packimage"), async (req, res) => {
  const package_id = req.params.id;
  const image = req.file.buffer
  try
  {
    const response = await Packages.update({ image }, { where: { package_id } });
    if (response == 1)
    {
      res.redirect(url.format({
        pathname: `/vanrai-admin/updatePackage/${package_id}`,
        query: {
          "successMessage": "Image updated successfully!",
          "errorMessage": null,
        }
      }));
    } else
    {
      throw new NotFoundError();
    }

  } catch (error)
  {
    let err = '';
    if (error instanceof NotFoundError)
    {
      err = 'Package not found'
    } else
    {
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