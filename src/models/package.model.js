
module.exports = (sequelize, Sequelize) => {
  const Package = sequelize.define("package", {
    package_id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      field: 'package_id'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    video: {
      type: Sequelize.STRING(1000),
      allowNull: true
    },
    location: {
      type: Sequelize.STRING,
      allowNull: false
    },
    duration: {
      type: Sequelize.STRING,
      allowNull: false
    },
    start_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    end_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    image: {
      type: Sequelize.BLOB('medium'),
      allowNull: false
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    description: {
      type: Sequelize.STRING(5000),
      allowNull: false
    },
    itinerary: {
      type: Sequelize.STRING(5000),
      allowNull: true
    },
    isrecommended: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    }
  });

  return Package;
};