/* eslint-disable no-empty-function, no-process-env */
const getIt = require('get-it')
const assign = require('object-assign')
const observable = require('get-it/lib/middleware/observable')
const jsonRequest = require('get-it/lib/middleware/jsonRequest')
const jsonResponse = require('get-it/lib/middleware/jsonResponse')
const progress = require('get-it/lib/middleware/progress')
const {Observable} = require('../util/observable')
const {ClientError, ServerError} = require('./errors')

const httpError = {
  onResponse: (res) => {
    if (res.statusCode >= 500) {
      throw new ServerError(res)
    } else if (res.statusCode >= 400) {
      throw new ClientError(res)
    }

    return res
  },
}

const printWarnings = {
  onResponse: (res) => {
    const warn = res.headers['x-sanity-warning']
    const warnings = Array.isArray(warn) ? warn : [warn]
    warnings.filter(Boolean).forEach((msg) => console.warn(msg)) // eslint-disable-line no-console
    return res
  },
}

// Environment-specific middleware.
const envSpecific = require('./nodeMiddleware')

const middleware = envSpecific.concat([
  printWarnings,
  jsonRequest(),
  jsonResponse(),
  progress(),
  httpError,
  observable({implementation: Observable}),
])

const request = getIt(middleware)

function httpRequest(options, requester = request) {
  return requester(assign({maxRedirects: 0}, options))
}

httpRequest.defaultRequester = request
httpRequest.ClientError = ClientError
httpRequest.ServerError = ServerError

module.exports = httpRequest
