const fs = require("fs");
const http = require("http");
const path = require("path");

const contentTypes = new Map([
  ['.txt', 'text/plain'],
  ['.html', 'text/html'],
  ['.css', 'text/css'],
  ['.js', 'text/javascript'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
]);

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const value = contentTypes.get(ext);
  return typeof value === 'string' ? value : 'text/plain';
}

function respondError(response, error) {
  response.writeHead(error, {'Content-Type': 'text/plain'});
  response.write(`${error}`);
  response.end();
}

function requestHandler(data, request, response) {
  let {pathname} = new URL(request.url, `http://${request.headers.host}/`);
  pathname = pathname.replace(/^[\\/]+/, '');
  pathname = path.normalize(pathname);
  pathname = pathname.replace(/^(?:\.{1,2}[\\/])+/, '');
  pathname = pathname.replace(/[\\/]$/, '');

  let fileName = path.join(data.contentPath, pathname);
  for (let i = 0; true; ) {
    let info;
    try {
      info = fs.statSync(fileName);
    } catch (e) {
      respondError(response, 404);
      return;
    }
    if (!info.isDirectory() || ++i >= 2) { break; }
    fileName = path.join(fileName, 'index.html');
  }

  let content;
  try {
    content = fs.readFileSync(fileName, {encoding: null});
  } catch (e) {
    respondError(response, 500);
    return;
  }

  response.writeHead(200, {'Content-Type': getContentType(fileName)});
  response.write(content);
  response.end();
}

function main() {
  let contentPath = process.argv[2];
  if (typeof contentPath !== 'string') { contentPath = '.'; }

  let port = Number.parseInt(process.argv[3], 10);
  if (!Number.isFinite(port)) { port = 8080; }

  const data = {contentPath};
  const server = http.createServer();
  server.on('request', requestHandler.bind(server, data));
  server.listen(port);
}

if (require.main === module) { main(); }
