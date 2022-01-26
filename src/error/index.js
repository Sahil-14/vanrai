const { BadRequestError } = require('./badRequestError')
const { DatabaseConnectionError } = require('./databaseConnectionError')
const { NotAuthorizeError } = require('./notAuthorizeError')
const { NotFoundError } = require('./notFoundError')
const { RequestValidationError } = require('./validaTionError')
const { DatabaseOperationError } = require('./databaseOperationError')

module.exports = {
  BadRequestError,
  DatabaseConnectionError,
  NotAuthorizeError,
  NotFoundError,
  DatabaseOperationError,
  RequestValidationError
}