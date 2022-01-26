


module.exports = (sequelize, Sequelize) => {
  const PackageHighlights = sequelize.define("packageHighlights", {
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
  return PackageHighlights;
};
