'use strict'
var spawn = require('child_process').spawn
var path = require('path')
var pm2 = require('pm2')
// var server = require('./server')
var name = 'pcServer'
exports.name = 'server'
exports.usage = '<commad> [option]'
exports.desc = 'open local server for liveaload and preview'

exports.options = {
  '-s, --start <port>': 'start a localserver with <port> || 8090',
  '-x, --stop': 'stop the loacal sertver',
  '-start, --start <port>': 'start a localserver with <port> || 8090',
  '-stop, --stop': 'stop the loacal sertver'
};
exports.run = function(argv, cli, env){
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options);
  }
  var command = argv._
  if(argv.s || argv.start){
    // server(argv.s)
    // process._server_port_ = argv.s
    var port = argv.s === true ? 8090 : argv.s
    console.log('port:'+argv.s)
    pm2.connect(function() {
      pm2.start({
        watch: __dirname + '/server/index.js',
        name: name,
        script    : __dirname + '/server/index.js',         // Script to be run
        exec_mode : 'fork',        // Allow your app to be clustered
        // instances : 4,           // Optional: Scale your app by 4
        "cwd": process.cwd(),
        max_memory_restart : '100M',   // Optional: Restart your app if it reaches 100Mo
        args: [port]
      }, function(err, apps) {
        if(err) console.error(err)
        pm2.disconnect()
      });

      // pm2.start({
      //   watch: __dirname + '/socket/index.js',
      //   name: name + '_socket',
      //   script    : __dirname + '/socket/index.js',         // Script to be run
      //   exec_mode : 'fork',        // Allow your app to be clustered
      //   // instances : 4,           // Optional: Scale your app by 4
      //   "cwd": process.cwd(),
      //   max_memory_restart : '100M',   // Optional: Restart your app if it reaches 100Mo
      //   args: [port]
      // }, function(err, apps) {
      //   if(err) console.error(err)
      // });
    });
  }else if(argv.x || argv.stop){
    pm2.connect(function() {
      pm2.delete(name, function(err, apps) {
        pm2.disconnect();
      })
      // pm2.delete(name + '_socket', function(err, apps) {
      //   pm2.disconnect();
      // })
    });
  }
}
