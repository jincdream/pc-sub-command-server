var express = require('express')
var path = require('path')
var app = express()
var _THIS_DIR = process.cwd()
var _PORT = process.argv[2]
console.log(_PORT)
var _OUTPUT = path.join(_THIS_DIR,'/output/')
var _DEV = path.join(_THIS_DIR,'/dev/')
//通常 logErrors 来纪录诸如 stderr, loggly, 或者类似服务的错误信息：

var logErrors = function(err, req, res, next) {
  console.error(err.stack);
  next(err);
}
//clientErrorHandler 定义如下（注意错误非常明确的向后传递了）：

var clientErrorHandler = function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something blew up!' });
  } else {
    next(err);
  }
}
//下面的 errorHandler "捕获所有" 的异常，定义如下:

var errorHandler = function(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}
// app.use(express.static(_OUTPUT));
app.use('/api/:project/:type/:api',function(req,res){
  // var params = req.params.project.split('-')
  // var project = params[0]
  // var type = params[1]
  // var api = params[2]

  var project = req.params.project
  var type = req.params.type
  var api = req.params.api

  var file = path.resolve(_DEV,'./'+project,'./source/api/','./'+api)
  var date = require(file).data
  res[type](date)
  // console.log(params)
  // res.end(file)
  // data = null
})

// app.use('/',express.static('./'))
app.use('/output/',express.static(_OUTPUT))
app.use('/dev/',express.static(_DEV))
// app.get('/t',function(req,res){
//   res.end(_PORT)
// })
app.get('/',function(req,res){
  res.end('Bad Boy,Bad Boy.')
})
console.log(path.resolve('./'))
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
var server = app.listen(_PORT || 8090, function() {
    console.log('Listening on port %d', server.address().port);
});
