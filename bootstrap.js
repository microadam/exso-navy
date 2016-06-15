module.exports = bootstrap

var express = require('express')
  , createParser = require('github-webhook-handler')
  , createWebhookHandler = require('./lib/webhook-handler')
  , GhApi = require('github')
  , gh = new GhApi({ version: '3.0.0' })

function bootstrap (serviceLocator, cb) {
  var server = express()
    , webhookOptions =
        { path: '/github/webhook'
        , secret: serviceLocator.secrets.webhookSecret
        }
    , webhookParser = createParser(webhookOptions)
    , handleWebhook = createWebhookHandler(serviceLocator)

  gh.authenticate({ type: 'oauth', token: serviceLocator.secrets.githubToken })
  server.use(webhookParser)

  webhookParser.on('*', handleWebhook)

  webhookParser.on('error', function (error) {
    serviceLocator.logger.error(error)
  })

  serviceLocator.register('server', server)
  serviceLocator.register('ghApi', gh)

  cb(null, serviceLocator)
}
