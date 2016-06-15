var serviceLocator = require('service-locator')()
  , bunyan = require('bunyan')
  , logger = bunyan.createLogger({ name: 'exso' })
  , secrets =
      { webhookSecret: process.env.WEBHOOK_SECRET
      , githubToken: process.env.GITHUB_TOKEN
      }
  , url = process.env.URL
  , port = process.env.PORT
  , config =
      { url: url
      , admiralHost: process.env.ADMIRAL_HOST
      , releaseBotName: process.env.RELEASE_BOT
      }
  , bootstrap = require('./bootstrap')
  , createSetupRoute = require('./routes/setup')

serviceLocator.register('logger', logger)
serviceLocator.register('secrets', secrets)
serviceLocator.register('config', config)

bootstrap(serviceLocator, function (error, serviceLocator) {
  if (error) throw error

  createSetupRoute(serviceLocator)

  serviceLocator.server.listen(port, function () {
    serviceLocator.logger.info('Started: ' + url + ':' + port)
  })
})
