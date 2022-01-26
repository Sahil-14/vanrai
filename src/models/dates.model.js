const { date } = require("faker");

module.exports = (sequelize, Sequelize) => {
  const Dates = sequelize.define("dates", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    total_seats: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    available_seats: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    package_id: {
      type: Sequelize.INTEGER,
      field: 'package_id'
    },
    package_name: {
      type: Sequelize.STRING,
      allowNull: false

    },
  });

  return Dates;
};
