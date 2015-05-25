module.exports = (function() {

  if(global.__TINT.AppSchema) {
    return;
  }

  function runApplicationHost() {
    // Load the http module to create an http server.
    var http = require('http');
    var mimetype = {};
    mimetype.gz = 'application/gzip';
    mimetype.zip = 'application/zip';
    mimetype.pdf = 'application/pdf';
    mimetype.json = 'application/json';
    mimetype.js = 'application/javascript';
    mimetype.mp3 = 'audio/mp3';
    mimetype.gif = 'image/gif';
    mimetype.jpg = mimetype.jpeg = 'image/jpeg';
    mimetype.png = 'image/png';
    mimetype.svg = 'image/svg+xml';
    mimetype.txt = 'text/plain';
    mimetype.html = mimetype.htm = 'text/html';
    mimetype.css = 'text/css';
    mimetype.xml = 'text/xml';
    mimetype.avi = 'video/avi';
    mimetype.mpeg = mimetype.mpg = 'video/mpeg';
    mimetype.mp4 = 'video/mp4';
    mimetype.ogg = 'video/ogg';
    mimetype.webm = 'video/webm';
    mimetype.flv = 'video/x-flv';
    mimetype.mkv = 'video/x-matroska';
    // Part of the application schema (app://)
    var server = http.createServer(function (request, response) {
      var path = request.url;
      var data = new Buffer(0);
      var ext = path.substring(path.lastIndexOf('.')+1);
      // We need to serve a blank page to render when the webview has yet to receive a location.
      if(path === "//blank-page-appschema.html" || path === "/blank-page-appschema.html") {
        data = new Buffer("<!doctype html>\n<html>\n<body>\n</body>\n</html>\n","utf8");
      } else {
        data = application.resource(path);
        if(data === null) {
          data = new Buffer(0);
        }
      }
      var mimeTypeFromExt = mimetype[ext];
      if(!mimeTypeFromExt) {
        mimeTypeFromExt = 'text/plain';
      }
      response.writeHead(200, {"content-type": mimeTypeFromExt+ "; charset=utf-8", "content-length":data.length, "connection":"close"});
      response.write(data);
      response.end("\r\n", 'utf8');
    });

    // Listen on port 8000, IP defaults to 127.0.0.1
    application.private.appSchemaPort = Math.round(10000 + Math.random()*999);
    server.listen(application.private.appSchemaPort, '127.0.0.1');
  }

  // Windows is the only platform that technically
  // needs to be able to see these assets through the server.
  if(process.platform === 'win32') {
    runApplicationHost();
  }

  global.__TINT.AppSchema = true;
})();
