if (process.env.NODE_ENV !== 'production')
{
  require('dotenv').config();
}
const express = require('express');
const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')
const { Readable } = require('stream')
const cors = require("cors");
const PORT = process.env.PORT
require('express-async-errors');
const cookieSession = require('cookie-session');

const { userRouter } = require('./src/routes/users.routes')
const { serviceRouter } = require('./src/routes/services.routes')
const { packageRouter } = require('./src/routes/packages.routes')
const { contactRouter } = require('./src/routes/contact.routes')
const { adminRouter } = require('./src/routes/admin.routes')
const { dateRouter } = require('./src/routes/dates.routes')
const { bookingRouter } = require('./src/routes/booking.routes')
const { galleryRouter } = require('./src/routes/gallery.routes');
const { errorHandler } = require('./src/middleware/errorHandler')
const db = require("./src/models");
const Packages = db.packages;
var moment = require('moment');
const axios = require('axios')
const { NotFoundError } = require('./src/error')


const app = express();

var corsOptions = {
  origin: process.env.URL
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
app.use(galleryRouter)
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {

  var services = [];
  var packages = [];
  try
  {
    try
    {

      const serviceResponse = await axios.get(`${process.env.URL}/api/services/`);

      services = serviceResponse.data.services
    } catch (error)
    {
      services = []
    }
    try
    {

      const packageResponse = await axios.get(`${process.env.URL}/api/packages/`);

      packages = packageResponse.data.packages;
    } catch (error)
    {
      packages = [];
    }

    const length = packages.length;
    var recommended = [];
    if (length == 0)
    {
      recommended = [];
    } else if (length <= 4)
    {
      recommended = packages;
    } else
    {
      packages.forEach((package, index) => {
        if (package.isrecommended)
        {
          recommended.push(package);
        }
      })
      packages.forEach((package) => {

        if (!recommended.some(e => e.package_id == package.package_id) && recommended.length <= 4)
        {
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
  } catch (error)
  {
    res.render('pages/index', {
      page: "index",
      error: 'Error to load data'
    })
  }

})

app.get('/Harishchandragad-trek', (req, res) => {
  res.redirect('/packages')
})
app.get('/Harishchandragad-trek-via-pachnai', (req, res) => {
  res.redirect('/packages')
})
app.get('/Harishchandragad-trek-via-nalichi-vat', (req, res) => {
  res.redirect('/packages')
})
app.get('/Harishchandragad-trek-via-khileshwar', (req, res) => {
  res.redirect('/packages')
})
app.get('/sandhan-valley-trek', (req, res) => {
  res.redirect('/packages')
})
let sitemap
app.get('/sitemap.xml', async function (req, res) {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');
  // if we have a cached entry send it
  if (sitemap)
  {
    res.send(sitemap)
    return
  }
  try
  {

    const packageNames = await Packages.findAll({ attributes: ['name'] });


    const smStream = new SitemapStream({ hostname: 'https://vanraiadventures.in/' })
    const pipeline = smStream.pipe(createGzip())

    // pipe your entries or directly write them.
    smStream.write({ url: '/', changefreq: 'daily', priority: 1 })
    packageNames.forEach((package) => {
      smStream.write({
        url: `/package/documentedPackage/${package.name.trim().toLowerCase().replace(/ /g, '-')}`,
        changefreq: 'daily',
        priority: 0.9
      })
    })
    smStream.write({ url: '/Harishchandragad-trek', changefreq: 'daily', priority: 0.9 })
    smStream.write({ url: '/alang-madan-kulang-trek', changefreq: 'daily', priority: 0.9 })
    smStream.write({ url: '/sandhan-valley-trek', changefreq: 'daily', priority: 0.9 })
    smStream.write({ url: '/contact', changefreq: 'daily', priority: 0.9 })
    smStream.write({ url: '/packages', changefreq: 'daily', priority: 0.8 })
    smStream.write({ url: '/services', changefreq: 'daily', priority: 0.7 })
    smStream.write({ url: '/gallery', changefreq: 'daily', priority: 0.5 })

    // cache the response
    streamToPromise(pipeline).then(sm => sitemap = sm)
    // make sure to attach a write stream such as streamToPromise before ending
    smStream.end()
    // stream write the response
    pipeline.pipe(res).on('error', (e) => { throw e })
  } catch (e)
  {
    console.error(e)
    res.status(500).end()
  }
})

app.all('*', async (req, res) => {
  throw new NotFoundError();

});
app.use(errorHandler);
app.listen(PORT, () => {

  console.log("server running at 5000".green);
})