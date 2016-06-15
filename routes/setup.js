module.exports = createSetupRoute

function createSetupRoute (serviceLocator) {

  serviceLocator.server.get('/setup/:user/:repo', function (req, res) {
    serviceLocator.logger.info('creating initial hook')
    var user = req.params.user
      , repo = req.params.repo
      , options =
        { user: user
        , repo: repo
        , name: 'web'
        , config:
          { url: serviceLocator.config.url + '/github/webhook'
          , 'content_type': 'json'
          , secret: serviceLocator.secrets.webhookSecret
          }
        , events: [ 'issue_comment' ]
        , active: true
        }
    serviceLocator.ghApi.repos.createHook(options, function (error) {
      if (error) return res.status(500).json(error)
      res.sendStatus(200)
    })
  })

}
