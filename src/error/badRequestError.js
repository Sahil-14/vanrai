class BadRequestError extends Error {
  statusCode = 400;
  error = ""
  constructor(message) {
    super();
    this.error = message
    Object.setPrototypeOf(this, BadRequestError.prototype);
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
  BadRequestError
}