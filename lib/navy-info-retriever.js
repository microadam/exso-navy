module.exports = createNavyInfoRetriever

function createNavyInfoRetriever (serviceLocator) {

  function retrieveNavyInfo(data, cb) {
    var options =
          { user: data.repository.owner.login
          , repo: data.repository.name
          , number: data.issue.number
          , page: 1
          , 'per_page': 100
          }

    serviceLocator.ghApi.issues.getComments(options, function (error, comments) {
      if (error) return cb(error)
      var navyData = { tag: null, author: null, environment: null }
        , commentParts = data.comment.body.split('`')

      navyData.tag = commentParts[1]

      if (commentParts[1]) {
        navyData.environment = commentParts[1].indexOf('-') > -1 ? 'staging' : 'production'
      }

      comments.some(function (comment, index) {
        if (comment.body === data.comment.body) {
          navyData.author = comments[index - 1].user.login
          return true
        }
      })

      var options =
            { user: data.repository.owner.login
            , repo: data.repository.name
            , path: '.exsonavyrc'
            }

      serviceLocator.ghApi.repos.getContent(options, function (error, file) {
        if (error && error.code === 404) return cb()
        if (error) return cb(error)
        var buf = new Buffer(file.content, 'base64')
          , contents = buf.toString()
          , data = JSON.parse(contents)

        navyData.appId = data.appId
        cb(null, navyData)
      })

    })
  }

  return retrieveNavyInfo

}
