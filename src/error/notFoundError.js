class NotFoundError extends Error {
  statusCode = 404;
  constructor() {
    super();

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
  serializeErrors() {
    return [
      {
        message: "Not found",
      },
    ];
  }

}

module.exports = {
  NotFoundError
}