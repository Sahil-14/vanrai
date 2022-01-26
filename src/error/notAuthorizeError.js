class NotAuthorizeError extends Error {
  statusCode = 401;
  constructor() {
    super();
    Object.setPrototypeOf(this, NotAuthorizeError.prototype);
  }
  serializeErrors() {
    return [
      {
        message: "Not authorized",
      },
    ];
  }
}

module.exports = {
  NotAuthorizeError
}