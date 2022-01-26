class DatabaseOperationError extends Error {
  statusCode = 500;
  error = "";
  constructor(message) {
    super();
    this.error = message;
    Object.setPrototypeOf(this, DatabaseOperationError.prototype);
  }
  serializeErrors() {
    return [
      {
        message: this.error,
      },
    ];
  }

}

module.exports = {
  DatabaseOperationError
}