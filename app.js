const express = require('express');
const cors = require("cors");

require('express-async-errors');
const cookieSession = require('cookie-session');

const { userRouter } = require('./src/routes/users.routes')
const { serviceRouter } = require('./src/routes/services.routes')
const { packageRouter } = require('./src/routes/packages.routes')
const { contactRouter } = require('./src/routes/contact.routes')
const { adminRouter } = require('./src/routes/admin.routes')
const { dateRouter } = require('./src/routes/dates.routes')
const { bookingRouter } = require('./src/routes/booking.routes')

const { errorHandler } = require('./src/middleware/errorHandler')
const db = require("./src/models");

var moment = require('moment');
const axios = require('axios')
const { NotFoundError } = require('./src/error')


const app = express();

var corsOptions = {
  origin: "http://vanraiadventures.in"
};
app.use(cors(corsOptions));
db.sequelize.sync();
app.set('trust proxy', true);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/**
 * this enables to look in the public folder
 */
app.use(express.static("public"));
app.use(

  cookieSession({
    signed: false,
    secure: false
  })
);

app.use(userRouter);
app.use(serviceRouter);
app.use(packageRouter);
app.use(contactRouter);
app.use(adminRouter)
app.use(dateRouter)
app.use(bookingRouter)
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {

  var services = [];
  var packages = [];
  try {
    try {
      const serviceResponse = await axios.get("http://vanraiadventures.in/api/services/");

      services = serviceResponse.data.services
    } catch (error) {
      services = []
    }
    try {
      const packageResponse = await axios.get("http://vanraiadventures.in/api/packages/");

      packages = packageResponse.data.packages;
    } catch (error) {
      packages = [];
    }

    const length = packages.length;
    var recommended = [];
    if (length == 0) {
      recommended = [];
    } else if (length <= 4) {
      recommended = packages;
    } else {
      packages.forEach((package, index) => {
        if (package.isrecommended) {
          recommended.push(package);
        }
      })
      packages.forEach((package) => {

        if (!recommended.some(e => e.package_id == package.package_id) && recommended.length <= 4) {
          recommended.push(package);
        }
      })
    }
    res.render('pages/index', {
      page: "index",
      services,
      packages,
      recommended: recommended ? recommended : [],
      moment,
      error: null
    })
  } catch (error) {
    res.render('pages/index', {
      page: "index",
      error: 'Error to load data'
    })
  }

})


app.all('*', async (req, res) => {
  throw new NotFoundError();

});
app.use(errorHandler);
app.listen(5000, () => {

  console.log("server running at 5000".green);
})