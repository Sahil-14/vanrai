/****************    Documantaion    ************
 * author - sahil shimpi
 * folder  - routes/user
 * lastupdate - 13/jan/2022
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
const Service = db.services;
const Highlights = db.highlights;
const { validateRequest } = require('../middleware/validateRequest');
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const axios = require('axios');


const serviceRouter = express.Router();
const multer = require("multer");

const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const { auth } = require('../middleware/auth');
const Op = db.Sequelize.Op;
const url = require('url');



const upload = multer({

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("file must be a image"));
    }
    cb(undefined, true);
  },
});


/*******************************
 * -- Render service page --------*
 *******************************/
serviceRouter.get('/services', async (req, res) => {

  try {
    const response = await axios.get("http://vanraiadventures.in/api/services/");
    res.render('pages/services', {
      page: 'service',
      services: response.data.services,
      error: null
    })
  } catch (error) {
    console.log(error)
    res.render('pages/services', {
      page: 'service',
      payload: null,
      error: "Error to load service .Please try after some time."
    })
  }

})
/*******************************
 * -- 1.create service --------*
 *******************************/
//get
serviceRouter.get('/vanrai-admin/createService', currentUser, requireAuth, async (req, res) => {
  const currentUser = req.currentUser

  res.render('pages/adminPages/createService', { currentUser })
})
//post
serviceRouter.post('/vanrai-admin/createService',
  currentUser, requireAuth,
  upload.single("servimage"),
  [
    body("name")
      .isLength({ min: 4, max: 255 })
      .withMessage("Name must be between 4 to 255 characters"),
    body("price")
      .isInt({ min: 0 })
      .withMessage("Price must be grater than or equal to 0"),
    body("description")
      .isLength({ min: 1, max: 500 })
      .withMessage("description must be between 1 to 500 characters")
  ],
  validateRequest,
  async (req, res) => {
    const { name, description, price, highlights } = req.body;
    try {

      const existingService = await Service.findOne({ where: { name }, attributes: ['service_id', 'name'] });
      if (existingService) {
        throw new BadRequestError('Service aleady exists.');
      }

      const buffer = req.file.buffer
      const newService = {
        name: name.toLowerCase(),
        description,
        price,
        image: buffer
      }

      const service = await Service.create(newService);
      const id = service.service_id;

      var highlightsArray = [];
      if (highlights instanceof Array) {
        highlights.map((item) => {
          highlightsArray.push({
            name: item,
            service_id: id
          })
        })
        // save package highlights
        await Highlights.bulkCreate(highlightsArray);
      } else {
        await Highlights.create({ name: highlights, service_id: id });
      }
      res.redirect(url.format({
        pathname: "/vanrai-admin/services",
        query: {
          "successMessage": "User created successfully!",
          "errorMessage": null,
        }
      }));
    } catch (error) {
      var err = "";
      if (error instanceof BadRequestError) {
        err = `Service already exist with name = ${name}`
      } else {
        err = error
      }

      res.redirect(url.format({
        pathname: "/vanrai-admin/services",
        query: {
          "successMessage": null,
          "errorMessage": err,
        }
      }));
    }
  })


/*******************************
 * - 2.get all services -------*
 *******************************/
serviceRouter.get('/api/services/', async (req, res) => {
  try {
    const services = await Service.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: {
        model: Highlights,
        attributes: ['name']
      }
    });
    res.status(200).send({ services });
  } catch (error) {
    // console.log(error);
    throw new DatabaseOperationError("Error to fetch users");
  }
});

/*******************************
 * ------- 3.get service by id --------*
 *******************************/
serviceRouter.get('/api/services/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const service = await Service.findOne({
      where: {
        service_id: id
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'image']
      },
      include: {
        model: Highlights,
        attributes: ['name']
      }
    });
    res.status(200).send({ service })
    // res.status(200).send({ service });
  } catch (error) {
    console.log(error);
    throw new DatabaseOperationError("Error to fetch users");
  }

})

/*******************************
 * ------- 4.delete service by id --------*
 *******************************/
serviceRouter.get('/vanrai-admin/deleteService/:id', currentUser, requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const response = await Service.destroy({ where: { service_id: id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: "/vanrai-admin/services",
        query: {
          "successMessage": "Service deleted successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }
  } catch (error) {
    var msg = '';
    if (error instanceof NotFoundError) {
      msg = "Service to be delete does not exist."
    } else {
      msg = "Error to delete service"
    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/services",
      query: {
        "successMessage": null,
        "errorMessage": msg,
      }
    }));
  }
})

/*******************************
 *  5.update service by id ----*
 *******************************/
//update  service (GET)
serviceRouter.get('/vanrai-admin/updateService/:id', currentUser, requireAuth, async (req, res) => {
  const token = req.session?.jwt;
  const currentUser = req.currentUser

  try {

    const response = await axios.get(`http://vanraiadventures.in/api/services/${req.params.id}`, { headers: { "Authorization": `Bearer ${token}` } });

    res.render('pages/adminPages/updateService', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      service: response.data.service,
      error: null,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/updateService', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      service: null,
      error: error instanceof NotFoundError ? "Service not found" : 'Error to get service.Please try later.',
      currentUser
    })
  }
})
serviceRouter.post('/vanrai-admin/updateService/:id',
  currentUser,
  requireAuth,
  [
    body("name")
      .isLength({ min: 4, max: 255 })
      .withMessage("Name must be between 4 to 255 characters"),
    body("price")
      .isInt({ min: 0 })
      .withMessage("Price must be grater than or equal to 0"),
    body("description")
      .isLength({ min: 90, max: 500 })
      .withMessage("description must be between 90 to 500 characters")
  ],
  validateRequest,
  async (req, res) => {
    const service_id = req.params.id;
    const { name, description, price, highlights } = req.body;
    //update service
    try {
      const existingService = await Service.findOne({ where: { name }, attributes: ['service_id', 'name'] });
      if (existingService && service_id != existingService.service_id) {
        throw new BadRequestError('Service aleady exists.');
      }

      const updatedService = {
        service_id,
        name: name.toLowerCase(),
        description,
        price,
      }
      const serviceUpdateResponse = await Service.update(updatedService, { where: { service_id } });
      if (serviceUpdateResponse == 1) {

        //delete heighlight
        const deletedHighlightResponse = await Highlights.destroy({ where: { service_id } });
        if (deletedHighlightResponse != 0) {
          //update heighlight
          var highlightsArray = [];
          highlights.map((item) => {
            highlightsArray.push({
              name: item,
              service_id
            })
          })
          await Highlights.bulkCreate(highlightsArray);
          // res.status(201).send({ message: "Service updated succssfully" })
          res.redirect(url.format({
            pathname: "/vanrai-admin/services",
            query: {
              "successMessage": "User updatd successfully!",
              "errorMessage": null,
            }
          }));
        } else {
          throw new NotFoundError();
        }
      } else {
        throw new NotFoundError();
      }

    } catch (error) {
      var err = ""
      if (error instanceof BadRequestError) {
        err = `Error : Service already exist with name = ${name}`
      } else if (error instanceof NotFoundError) {
        err = "Service not found"
      } else {
        err = error
      }

      res.redirect(url.format({
        pathname: "/vanrai-admin/services",
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
serviceRouter.get('/api/services/image/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const service = await Service.findOne({
      where: {
        service_id: id
      },
      attributes: ['image']
    });
    if (!service) {
      throw new NotFoundError();
    }

    res.set('Content-Type', 'image/png');
    res.status(200).send(service.image);

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError();
    } else {
      throw new DatabaseOperationError("Error to fetch users");

    }
  }
})
//change image
serviceRouter.post('/vanrai-admin/services/image/:id', upload.single("servimage"), async (req, res) => {
  const service_id = req.params.id;
  const image = req.file.buffer
  try {
    const response = await Service.update({ image }, { where: { service_id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: `/vanrai-admin/updateService/${service_id}`,
        query: {
          "successMessage": "Image updated successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }

  } catch (error) {
    var err = '';
    if (error instanceof NotFoundError) {
      err = 'Service not found'
    } else {
      err = error
    }
    res.redirect(url.format({
      pathname: `/vanrai-admin/updateService/${service_id}`,
      query: {
        "successMessage": null,
        "errorMessage": err,
      }
    }));
  }

})


module.exports = {
  serviceRouter
}