const dbConfig = require("../config/db.config.js");
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});


const db = {};


db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model")(sequelize, Sequelize);
db.services = require("./service.model")(sequelize, Sequelize);
db.highlights = require("./highlights.model")(sequelize, Sequelize);
db.packages = require("./package.model")(sequelize, Sequelize);
db.packageHighlights = require("./pacakgeHighlights.model")(sequelize, Sequelize);
db.ttc = require('./ttc.model')(sequelize, Sequelize);
db.wwg = require('./wwg.model')(sequelize, Sequelize);
db.wwd = require('./wwd.model')(sequelize, Sequelize);
db.gallery = require('./gallery.model')(sequelize, Sequelize);
db.bookings = require('./booking.model')(sequelize, Sequelize);
db.dates = require('./dates.model')(sequelize, Sequelize);
db.messages = require('./messages.model')(sequelize, Sequelize)


db.services.hasMany(db.highlights, { foreignKey: 'service_id' })
db.highlights.belongsTo(db.services, { foreignKey: 'service_id' })

db.services.sync();
db.highlights.sync();

db.packages.hasMany(db.packageHighlights, { foreignKey: 'package_id' })
db.packageHighlights.belongsTo(db.packages, { foreignKey: 'package_id' })

db.packages.hasMany(db.dates, { foreignKey: 'package_id' })
db.dates.belongsTo(db.packages, { foreignKey: 'package_id' })

db.packages.hasMany(db.bookings, { foreignKey: 'package_id' })
db.bookings.belongsTo(db.packages, { foreignKey: 'package_id' })

db.packages.hasMany(db.ttc, { foreignKey: 'package_id' });
db.ttc.belongsTo(db.packages, { foreignKey: 'package_id' });


db.packages.hasMany(db.wwg, { foreignKey: 'package_id' });
db.wwg.belongsTo(db.packages, { foreignKey: 'package_id' });

db.packages.hasMany(db.wwd, { foreignKey: 'package_id' });
db.wwd.belongsTo(db.packages, { foreignKey: 'package_id' });

db.packages.hasMany(db.gallery, { foreignKey: 'package_id' });
db.gallery.belongsTo(db.packages, { foreignKey: 'package_id' });

db.packages.sync();
db.packageHighlights.sync();
db.bookings.sync()
db.dates.sync();
db.ttc.sync();
db.wwg.sync();
db.wwd.sync();
db.gallery.sync();




module.exports = db;