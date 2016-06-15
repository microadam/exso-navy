module.exports = createWebhookHandler

var createNavyDeployer = require('./navy-deploy')
  , createNavyInfoRetriever = require('./navy-info-retriever')

function createWebhookHandler (serviceLocator) {

  var retrieveNavyInfo = createNavyInfoRetriever(serviceLocator)
    , navyDeploy = createNavyDeployer(serviceLocator)

  function handleWebhook (event) {
    var type = event.event
      , data = event.payload
      , ghAction = data.action
      , isDeployComment = data.comment && data.comment.body ? data.comment.body.indexOf('This release has been prepared for') === 0 : false
      , shouldDeploy = type === 'issue_comment' && ghAction === 'created' && isDeployComment

    serviceLocator.logger.info('Received: ' + type + ' - ' + ghAction)

    if (shouldDeploy) {
      retrieveNavyInfo(data, function (error, navyData) {
        if (error) throw error
        if (navyData) {
          navyDeploy(navyData, data)
        }
      })
    }
  }

  return handleWebhook
}
