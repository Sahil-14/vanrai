const express = require('express');
const { body } = require('express-validator');
const db = require('../models');
const Packages = db.packages;
const Gallery = db.gallery;
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const galleryRouter = express.Router();
const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const url = require('url')
const multer = require("multer");

const upload = multer({

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("file must be a image"));
    }
    cb(undefined, true);
  },
})

galleryRouter.get('/gallery', async (req, res) => {
  try {
    const packages = await Packages.findAll({
      attributes: ['name', 'package_id'],
      distinct: true
    });

    const Images = await Gallery.findAll({ attributes: ['id', 'package_id', 'package_name'], });
    res.render('pages/gallery', {
      page: "gallery",
      Images,
      packages,
      error: null
    })
  } catch (error) {

    res.render('pages/gallery', {
      page: "gallery",
      Images: null,
      package: null,
      packages,
      error: "Error to get Images.Try later"
    })
  }

})


galleryRouter.get('/vanrai-admin/createImage', async (req, res) => {
  try {
    const packages = await Packages.findAll({
      attributes: ['name', 'package_id'],
      distinct: true
    });
    res.render('pages/adminPages/createImage', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      packages,
      error: null,
      currentUser
    })
  } catch (error) {
    res.render('pages/adminPages/createImage', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      packages: null,
      error: "Error to load packages",
      currentUser
    })
  }

})

galleryRouter.post('/vanrai-admin/createImage', upload.array('galleryImage'), async (req, res) => {
  try {
    const comp = req.body.package.split('~');

    var files = req.files;
    var package_id = comp[0] == 'other' ? null : comp[0];
    var package_name = comp[0] == 'other' ? null : comp[1];
    if (req.files.length == 1) {
      const obj = { package_id, image: files[0].buffer, package_name };
      await Gallery.create(obj);
    } else {
      const imageArray = [];
      files.forEach((file) => {
        imageArray.push({
          package_id,
          package_name,
          image: file.buffer
        })
      })
      await Gallery.bulkCreate(imageArray);

    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/gallery",
      query: {
        "successMessage": "image uploaded successfully!",
        "errorMessage": null,
      }
    }));
  } catch (error) {
    console.log(error);
    res.redirect(url.format({
      pathname: "/vanrai-admin/gallery",
      query: {
        "successMessage": null,
        "errorMessage": "Error to upload image",
      }
    }));
  }

})


galleryRouter.get('/api/gallery/image/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const image = await Gallery.findOne({
      where: {
        id
      },
      attributes: ['image']
    });
    if (!image) {
      throw new NotFoundError();
    }

    res.set('Content-Type', 'image');
    res.status(200).send(image.image);

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError();
    } else {
      throw new DatabaseOperationError("Error to fetch users");

    }
  }
})


galleryRouter.post('/vanrai-admin/gallery/filter', currentUser, requireAuth, async (req, res) => {
  const reqob = Object.keys(req.body)
  var params = {};
  if (reqob.includes("all") || reqob.length == 0) {

  } else {
    params = {
      "package_id": reqob,
    }
  }
  res.redirect(url.format({
    pathname: "/vanrai-admin/bookings",
    query: params
  }));
})


//delete image

galleryRouter.get('/vanrai-admin/deleteGallery/:id', currentUser, requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const response = await Gallery.destroy({ where: { id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: "/vanrai-admin/gallery",
        query: {
          "successMessage": "Image deleted successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }
  } catch (error) {
    var msg = '';
    if (error instanceof NotFoundError) {
      msg = "Image to be delete does not exist."
    } else {
      msg = "Error to delete image"
    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/gallery",
      query: {
        "successMessage": null,
        "errorMessage": msg,
      }
    }));
  }
})
module.exports = {
  galleryRouter
}
