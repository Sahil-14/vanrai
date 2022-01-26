class RequestValidationError extends Error {
  statusCode = 400;
  errors = [];
  constructor(errorArray) {
    super();
    this.errors = errorArray;
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
  serializeErrors() {
    return this.errors.map((err) => {
      return { message: err.msg };
    });
  }
}

module.exports = {
  RequestValidationError
}