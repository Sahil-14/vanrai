module.exports = (sequelize, Sequelize) => {
  const Wwd = sequelize.define("wwd", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    package_id: {
      type: Sequelize.INTEGER,
      field: 'package_id'
    }
  });
  return Wwd;
};
