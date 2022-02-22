module.exports = (sequelize, Sequelize) => {
  const Ttc = sequelize.define("ttc", {
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
  return Ttc;
};
