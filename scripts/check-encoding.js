const fs = require('fs')
const path = require('path')
const { TextDecoder } = require('util')

const root = path.resolve(__dirname, '..')
const decoder = new TextDecoder('utf-8', { fatal: true })
const checkedExtensions = new Set(['.html', '.js', '.css'])
const skippedDirectories = new Set(['.git', 'dist', 'node_modules'])
const mojibakePatterns = [
  /\ufffd/,
  new RegExp('\\u00c3.'),
  new RegExp('\\u00c2.'),
  new RegExp('\\u00e2..'),
]

const errors = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        walk(path.join(directory, entry.name))
      }
      continue
    }

    if (entry.isFile() && checkedExtensions.has(path.extname(entry.name).toLowerCase())) {
      checkFile(path.join(directory, entry.name))
    }
  }
}

function checkFile(filePath) {
  const relativePath = path.relative(root, filePath)
  const bytes = fs.readFileSync(filePath)

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    errors.push(`${relativePath}: UTF-8 BOM gefunden`)
    return
  }

  let text
  try {
    text = decoder.decode(bytes)
  } catch {
    errors.push(`${relativePath}: Datei ist kein gültiges UTF-8`)
    return
  }

  for (const pattern of mojibakePatterns) {
    if (pattern.test(text)) {
      errors.push(`${relativePath}: mögliches kaputtes Encoding gefunden (${pattern})`)
      break
    }
  }

  if (path.extname(filePath).toLowerCase() === '.html' && /<head\b[^>]*>/i.test(text)) {
    if (!/<meta\s+charset=["']?UTF-8["']?\s*\/?>/i.test(text)) {
      errors.push(`${relativePath}: <meta charset="UTF-8"> fehlt im <head>`)
    }
  }
}

walk(root)

if (errors.length > 0) {
  console.error('Encoding-Prüfung fehlgeschlagen:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Encoding-Prüfung erfolgreich.')
