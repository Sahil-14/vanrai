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
const { body, validationResult } = require('express-validator');
const db = require('../models');
const User = db.users;
const { validateRequest } = require('../middleware/validateRequest');
const { BadRequestError, DatabaseOperationError, NotFoundError } = require('../error');
const jwt = require('jsonwebtoken');
const userRouter = express.Router();
const bcrypt = require('bcrypt');
const { currentUser } = require('../middleware/currentUser');
const { requireAuth } = require('../middleware/requireAuth');
const { isAdmin } = require('../middleware/isAdmin');

const { auth } = require('../middleware/auth');
const { default: axios } = require('axios');
const Op = db.Sequelize.Op;
const url = require('url');


/*******************************
 * ------- 1.create user --------*
 *******************************/
userRouter.post('/api/users/signup',
  [
    body('name')
      .trim()
      .isLength({ min: 3 })
      .withMessage("Name must be greater than or equal to 3 characters")
    ,
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage('Passord must be between 8 and 20 character'),

  ],
  validateRequest,
  async (req, res) => {


    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestError('Email aleady exists.');
    }
    const newUser = {
      name, email, password,
      isadmin: req.body.isadmin ? 1 : 0
    }
    try {
      const user = await User.create(newUser);
      //generate jwt token
      const userJwt = jwt.sign(
        {
          id: user.id,
          email: user.email,
          isadmin: user.isadmin
        },
        process.env.JWT_KEY
      );

      req.session = {
        jwt: userJwt,
      };
      res.status(201).send({ message: "User created successfully" });
    } catch (error) {

      if (error instanceof BadRequestError) {
        throw new BadRequestError("Email already exist")
      } else {
        throw new DatabaseOperationError("Error to create user.");
      }
    }
  });


/*******************************
 * ------- signin user --------*
 *******************************/
userRouter.post('/api/users/signin',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage('Passord must be between 8 and 20 character'),

  ],
  validateRequest,
  async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }
    const passwordMatch = await bcrypt.compareSync(password, existingUser.password);
    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    //generate jwt token
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        isadmin: existingUser.isadmin
      },
      process.env.JWT_KEY
    );

    req.session = {
      jwt: userJwt,
    };
    res.redirect("/vanrai-admin/")

  })

/*******************************
 * ------- 3.signout user -----*
 *******************************/

userRouter.post('/api/users/signout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

/*******************************
 * ------- 4.current user -----*
 *******************************/
userRouter.get('/api/users/currentuser', (req, res) => {
  res.send({ currentUser: req.currentUser || null });
});


/*******************************
 * --------5.get all user -----*
 *******************************/
userRouter.get('/api/users/', auth, requireAuth, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({});
    res.status(200).send({ users });
  } catch (error) {
    throw new DatabaseOperationError("Error to fetch users");
  }
});


/*******************************
 * ------ 6.get user by id -----*
 *******************************/

userRouter.get('/api/users/:id', auth, requireAuth, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError();
    }

    const formatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isadmin: user.isadmin
    }
    res.status(200).send({ user: formatedUser });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError();
    } else {
      throw new DatabaseOperationError("Error to fetch user");

    }
  }
})

/*******************************
 * ------ 7.create user  -----*
 *******************************/

userRouter.get('/vanrai-admin/createUser', currentUser, requireAuth, isAdmin, async (req, res) => {
  const currentUser = req.currentUser
  res.render('pages/adminPages/createUser', { currentUser })
})
userRouter.post('/vanrai-admin/createUser', currentUser, requireAuth, isAdmin, async (req, res) => {
  const token = req.session?.jwt;

  try {
    await axios.post(`${process.env.URL}/api/users/signup`, req.body, { headers: { "Authorization": `Bearer ${token}` } });

    res.redirect(url.format({
      pathname: "/vanrai-admin/users",
      query: {
        "successMessage": "User created successfully!",
        "errorMessage": null,
      }
    }));

  } catch (error) {

    let err = "";
    if (error.response.status == 400) {
      err = "Email already exist";
    } else {
      err = "Error to create user.";
    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/users",
      query: {
        "successMessage": null,
        "errorMessage": err,
      }
    }));
  }
})
/*******************************
 * ------ 7.delete user by id -----*
 *******************************/
userRouter.get('/vanrai-admin/deleteUser/:id', currentUser, requireAuth, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const response = await User.destroy({ where: { id } });
    if (response == 1) {
      res.redirect(url.format({
        pathname: "/vanrai-admin/users",
        query: {
          "successMessage": "User deleted successfully!",
          "errorMessage": null,
        }
      }));
    } else {
      throw new NotFoundError();
    }
  } catch (error) {
    var msg = '';
    if (error instanceof NotFoundError) {
      msg = "deleted user found"
    } else {
      msg = "Error to delete user"
    }
    res.redirect(url.format({
      pathname: "/vanrai-admin/users",
      query: {
        "successMessage": null,
        "errorMessage": msg,
      }
    }));
  }
})


/*******************************
 * ------ 8.update user by id -----*
 *******************************/

userRouter.get('/vanrai-admin/updateUser/:id', currentUser, requireAuth, async (req, res) => {
  const token = req.session?.jwt;
  const currentUser = req.currentUser

  try {
    const response = await axios.get(`${process.env.URL}/api/users/${req.params.id}`, { headers: { "Authorization": `Bearer ${token}` } });

    res.render('pages/adminPages/updateUser', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      user: response.data.user,
      error: null,
      currentUser
    })
  } catch (error) {

    res.render('pages/adminPages/updateUser', {
      successMessage: req.query?.successMessage || null,
      errorMessage: req.query?.errorMessage || null,
      user: null,
      error: error instanceof NotFoundError ? 'User not found.' : 'Error to get user .please try later.',
      currentUser
    })
  }
})
userRouter.post('/vanrai-admin/updateUser/:id',
  currentUser,
  requireAuth,
  [
    body('name')
      .isLength({ min: 3 })
      .withMessage("Name must be greater than or equal to 3 characters")
    ,
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .isLength({ min: 8, max: 20 })
      .withMessage('Email must be valid'),

  ]
  , validateRequest, async (req, res) => {
    const id = req.params.id;
    const { email, isadmin, password, name } = req.body;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "password", "isadmin"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).send({ message: "Invalid updates!" });
    }
    const existingUser = await User.findOne({
      where: {
        email,
        id: {
          [Op.not]: id
        }
      }
    });
    if (existingUser) {
      throw new BadRequestError('Email aleady exists.');
    }
    const updateduser = {
      name,
      email,
      password,
      isadmin: isadmin ? 1 : 0
    }
    try {
      await User.findOne({
        where: { id }
      }).then(function (result) {
        return result.update(updateduser).then(function () {
          res.redirect(url.format({
            pathname: "/vanrai-admin/users",
            query: {
              "successMessage": "User updated successfully!",
              "errorMessage": null,
            }
          }));
        });
      })

    } catch (error) {
      let err = '';
      if (error instanceof NotFoundError) {
        err = 'User not found.'
      }
      else {
        err = "Error to update user."
      }
      res.redirect(url.format({
        pathname: "/vanrai-admin/users",
        query: {
          "successMessage": null,
          "errorMessage": err,
        }
      }));
    }
  })


module.exports = {
  userRouter
}