var express = require('express')
var editRouter = express.Router()
var path = require('path')
var fs  = require('fs')
var Handlebars = require('./handlebars.min.js')

var _THIS_DIR = process.cwd()
var _OUTPUT = path.join(_THIS_DIR, '/output/')
var _DEV = path.join(_THIS_DIR, '/dev/')
var _EDIT = path.join(_THIS_DIR, '/edit/')

var userData = {}

var parseHtml = function(host,project,_html,json){
  var reg   = /\{\{\#(.*?)\}\}([\s\S]*?)\{\{\/\1\}\}/gm
  var prReg = /\d*?\_.*/
  var html  = _html
              .replace(/((?:src|href))\=([\'\"])\.\.[\/\\](?:img|css|lib)/gi,'$1=$2http://'+host+'/'+project+'/static')
              .replace(/(?:src|href)=[\"\']\{\{(mock[\d]*?_(?:img|url)_)(.*?)\}\}/igm,function(m,a,b){
                var parent = ''
                var _b
                var index = ''
                if(prReg.test(b)){
                  _b = b.split('_')[1]
                  index = "_{{@index}}"
                  parent = "data-parent='"+_b+"' data-parentIndex='{{@index}}'"
                }
                return parent + ' title="请揉捏我。主人″\(^o^)/~" data-mock-click="true" data-id="' + a + b + index + '"' + m
              })
              .replace(/\{\{(mock[\d]*?_(?:text|title)_)(.*?)\}\}/igm,function(m,a,b){
                var parent = ''
                var _b
                var index = ''
                if(prReg.test(b)){
                  _b = b.split('_')[1]
                  // parent = `data-parent="${_b}" data-parentIndex="{{@index}}"`
                  parent = 'data-parent="'+_b+'" '+'data-parentIndex="{{@index}}"'
                  index = "_{{@index}}"
                }
                // return `<mock title="请揉捏我。主人\(^o^)/~" ${parent} data-id="${a}${b}${index}">${m}</mock>`
                return '<mock data-mock-click="true" title="请揉捏我。主人\(^o^)/~" '+parent+' data-id="'+a + b + index+'">'+m+'</mock>'
              })
              .replace(/\{\{\{(mock[\d]*?_html_.*?)\}\}\}/igm,function(m,a){
                return '<mockhtml data-mock-click="true" data-id="'+a+'" style="display:block;">'+m+'</mockhtml>'
              })
              .replace(/<\/body\>/,'<script></script>\n</body>')
  return Handlebars.compile(html)(json)
}

var compile = function(host,project,page,data){
  var _page    = page.replace('.html','')
  var htmlFile = path.resolve(_DEV, project,'./source/edit/'+page)
  var proData  = path.resolve(_DEV, project,'./source/edit/'+_page+'_data.js')

  return Promise.all([
    new Promise(function(resolve,reject){
      if(data){
        resolve('' + data)
      }else{
        fs.readFile(proData,function(err,data){
          err && reject(err)
          !err && resolve('' + data)
        })
      }
      
    }),
    new Promise(function(resolve,reject){
      fs.readFile(htmlFile,function(err,data){
        err && reject(err)
        !err && resolve('' + data)
      })
    })
  ])
  .then(function(aryRz){
    var json = JSON.parse(aryRz[0])
    var html = aryRz[1]
    return parseHtml(host,project,html,json)
  })
}

editRouter.route('/editing/:project/:page')
  .all(function(req,res,next){
    res.set({
      // 'Content-Type': 'text/plain',
      // 'Content-Length': '123',
      // 'ETag': '12345'
      "Access-Control-Allow-Origin": "*"
    })
    next()
  })
  .get(function(req,res,next){
    console.log(req.params.page,'/////page.')
    var proData = path.resolve(_DEV, req.params.project,'./source/edit/'+req.params.page+'_data.js')
    // res.end('proData')
    var files = fs.readdirSync(path.resolve(proData,'../'));
    var _files = []
    files.forEach(function(file, index){
      console.log(path.extname(file))
      if(path.extname(file) === '.html'){
        _files.push(file)
      }
    })
    new Promise(function(resolve,reject){
      fs.readFile(proData,function(err,data){
        err && reject(err)
        !err && resolve(data)
      })
    }).then(function(data){
      res.json({html:_files,data:JSON.parse('' + data)})
    }).catch(function(err){
      console.log(err)
      res.end(err)
    })
    // soketRes && soketRes.write("data: " + (new Date()) + "\n\n");
    
    // res.status(200).end('{a:1}')
    // res.end("data: " + (new Date()) + "\n\n")
  })
  .post(function(req,res,next){
    var data = req.body.data
    var page = req.body.page
    var project = req.params.project
    var dev = path.resolve(_DEV,project,'./page/'+page+'.html')
    var backup   = path.resolve(_EDIT,project,page+'_backup_data.js')
    var _buffer =new Buffer(data)
    // var devData = path.resolve(_DEV,req.params.project,'./page/_data.js')
    fs.writeFileSync(path.resolve(_DEV,req.params.project,'./source/edit/'+page+'_data.js'),_buffer)
    fs.writeFileSync(backup,_buffer);
    // console.log(typeof data,'...',path.resolve(_DEV,req.params.project,'./source/edit/_data.js'))
    // fs.writeFileSync(path.resolve(_DEV,req.params.project,'./page/_data.js'),new Buffer('module.exports.data = ' +data))
    fs.createReadStream(path.resolve(_DEV,req.params.project,'./source/edit/'+page+'.html')).pipe(fs.createWriteStream(dev))
    res.end('ok')
  })
editRouter.route('/parseEditPage/:project/:page')
          .all(function(req,res,next){
            res.set({
              "Access-Control-Allow-Origin": "*"
            })
            next()
          })
          .get(function(req,res,next){
            var page     = req.params.page.replace(/\_\d*/,'')
            var project  = req.params.project
            var host     = req.headers.host

            var _page    = page.replace('.html','')

            var compiled = req.query.compiled
            !userData[project] && (userData[project] = {});
            !userData[project][_page] && (userData[project][_page] = {});

            if(compiled){
              var user = userData[project][_page]
              console.log(user)
              res.end(user[compiled] || 'error 146')
            }else{
              compile(host,project,page)
              .then(function(html){
                res.end(html)
              })
              .catch(function(err){
                console.log('compile err : ',err)
                res.end(err)
              })
            }
          })
          .post(function(req,res,next){
            var page     = req.body.page
            var project  = req.body.project
            var data     = req.body.data
            var host     = req.headers.host
            
            var _page    = page.replace('.html','')
            var compiled = '' + (+new Date)

            compile(host,project,page,data)
            .then(function(html){
              userData[project][_page][compiled] = html
              res.end(compiled)
            })
            .catch(function(err){
              console.log('compile err : ',err)
              res.end(err)
            })
          })
module.exports = editRouter