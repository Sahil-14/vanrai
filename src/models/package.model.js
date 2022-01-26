
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
      allowNull: false
    },
    description: {
      type: Sequelize.STRING(500),
      allowNull: false
    },
    isrecommended: {
      type: Sequelize.BOOLEAN,
      allowNull: true
    }
  });

  return Package;
};