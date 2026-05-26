const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const preferredPort = Number(process.env.PORT || 5173)

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

function resolveRequest(url, port) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname)

  if (pathname === '/presse' || pathname.startsWith('/presse/')) {
    return path.join(root, 'presse.html')
  }

  const cleanPath = pathname === '/' ? '/index.html' : pathname
  return path.join(root, cleanPath.replace(/^\/+/, ''))
}

const server = http.createServer((request, response) => {
  const port = server.address()?.port || preferredPort
  const filePath = resolveRequest(request.url, port)

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'Not found')
    return
  }

  response.writeHead(200, { 'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(response)
})

function listen(port, attemptsLeft = 10) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1)
      return
    }

    throw error
  })

  server.listen(port, '127.0.0.1', () => {
    console.log(`Static site ready at http://127.0.0.1:${port}/`)
  })
}

listen(preferredPort)
