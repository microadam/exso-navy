module.exports = createNavyDeploy

var Primus = require('primus')
  , Emitter = require('primus-emitter')
  , Socket = Primus.createSocket
    ( { transformer: 'websockets'
      , parser: 'JSON'
      , plugin: { emitter: Emitter }
      }
    )

function createNavyDeploy (serviceLocator) {

  function navyDeploy (navyData, ghData) {

    var client = new Socket(serviceLocator.config.admiralHost)
      , output = []

    client.on('error', function (error) {
      serviceLocator.logger.error(error)
      client.end()
    })

    client.on('open', function () {
      client.on('serverMessage', function (data) {
        var msg = 'Admiral: ' + data.message
        output.push(msg)
        serviceLocator.logger.info(msg)
      })

      client.on('captainMessage', function (data) {
        var msg = data.captainName + ': ' + data.message
        output.push(msg)
        serviceLocator.logger.info(msg)
      })

      client.send('register', null, function (response) {
        clientId = response.clientId

        var options =
              { user: ghData.repository.owner.login
              , repo: ghData.repository.name
              , number: ghData.issue.number
              , body: 'Starting deployment of ' + ' `' + navyData.tag + '` to ' + navyData.environment
              }
        serviceLocator.ghApi.issues.createComment(options, function (error) {
          if (error) throw error
          executeOrder(navyData, 'prepare', function (error) {
            if (error) return addErrorComment(error, ghData)
            executeOrder(navyData, 'install', function (error) {
              client.end()
              if (error) return addErrorComment(error, ghData)
              addSuccessComment(navyData, ghData)
            })
          })
        })

      })
    })

    function executeOrder (data, order, cb) {
      output = []
      var data =
        { appId: data.appId
        , environment: data.environment
        , order: order
        , orderArgs: [ data.tag ]
        , clientId: clientId
        , username: data.author
        }
      client.send('executeOrder', data, function (response) {
        if (!response.success) return cb(new Error(response.message))
        cb()
      })
    }

    function addErrorComment (error, ghData) {
      var errorMessage = error.message ? error.message : 'Unknown Error. See output.'
        , options =
            { user: ghData.repository.owner.login
            , repo: ghData.repository.name
            , number: ghData.issue.number
            , body: 'An error occured when deploying:\r\n`' + errorMessage + '`\r\n\r\nOutput:\r\n```\r\n' + output.join('\r\n') + '\r\n```'
            }
      serviceLocator.ghApi.issues.createComment(options, function (error) {
        if (error) throw error
      })
    }

    function addSuccessComment (navyData, ghData) {
      var options =
            { user: ghData.repository.owner.login
            , repo: ghData.repository.name
            , number: ghData.issue.number
            , body: '@' + serviceLocator.config.releaseBotName + ' on ' + navyData.environment
            }
      serviceLocator.ghApi.issues.createComment(options, function (error) {
        if (error) throw error
      })
    }
  }

  return navyDeploy
}
