



module.exports = (sequelize, Sequelize) => {
  const Service = sequelize.define("service", {
    service_id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      field: 'service_id'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false

    },
    image: {
      type: Sequelize.BLOB('medium'),
      allowNull: false
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING(500)
    }
  });

  return Service;
};
