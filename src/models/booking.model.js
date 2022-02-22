
module.exports = (sequelize, Sequelize) => {
  const Bookings = sequelize.define("bookings", {
    booking_id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false

    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    package_id: {
      type: Sequelize.INTEGER,
      field: 'package_id'
    },
    package_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    people: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });

  return Bookings;
};
