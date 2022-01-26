class DatabaseConnectionError extends Error {
  statusCode = 500;
  constructor() {
    super();

    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
  serializeErrors() {
    return [
      {
        message: "Error connecting to database",
      },
    ];
  }

}

module.exports = {
  DatabaseConnectionError
}