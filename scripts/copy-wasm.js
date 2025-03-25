const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, '../src/lib/wasm/pkg')
const targetDir = path.join(__dirname, '../public/wasm')

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Copy WASM files
fs.readdirSync(sourceDir)
  .filter(file => file.endsWith('.wasm'))
  .forEach(file => {
    fs.copyFileSync(
      path.join(sourceDir, file),
      path.join(targetDir, file)
    )
  })

console.log('WASM files copied successfully')