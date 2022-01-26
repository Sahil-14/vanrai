const { BadRequestError, DatabaseConnectionError, NotAuthorizeError, NotFoundError, RequestValidationError, DatabaseOperationError } = require('../error')



const errorHandler = (
  err,
  req,
  res,
  next
) => {
  if (
    err instanceof BadRequestError ||
    err instanceof DatabaseConnectionError ||
    err instanceof NotAuthorizeError ||
    err instanceof RequestValidationError ||
    err instanceof DatabaseOperationError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }
  // we need to write this if we donet create custom error abstract class
  // if (err instanceof DatabaseConnectionError) {
  //   return res.status(err.statusCode).send({ errors: err.serializeError() });
  // }

  if (err instanceof NotFoundError) {
    res.render('pages/error', { page: 'error', statusCode: 404, message: 'Sorry ! Page not found.' })
  } else {
    res.status(400).send({
      errors: [
        {
          message: 'Something wend wrong',
        },
      ],
    });
  }




};


module.exports = {
  errorHandler
}