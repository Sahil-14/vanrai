


module.exports = (sequelize, Sequelize) => {
  const Highlights = sequelize.define("highlights", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    service_id: {
      type: Sequelize.INTEGER,
      field: 'service_id'
    }

  });
  // Highlights.associate = (models) => {
  //   // associations can be defined here
  //   Highlights.belongsTo(models.Service, { foreignKey: 'service_id' });

  // };

  return Highlights;
};
