



module.exports = (sequelize, Sequelize) => {
  const Gallery = sequelize.define("gallery", {

    image: {
      type: Sequelize.BLOB('medium'),
      allowNull: false
    },
    package_id: {
      type: Sequelize.INTEGER,
      field: 'package_id'
    },
    package_name: {
      type: Sequelize.STRING,
      allowNull: true
    }

  });

  return Gallery;
};
