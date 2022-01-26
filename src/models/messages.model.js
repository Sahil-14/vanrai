



module.exports = (sequelize, Sequelize) => {
  const Message = sequelize.define("message", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,

    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true
    },
    message: {
      type: Sequelize.STRING(500)
    }
  });

  return Message;
};
