#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * This script patches incorrect openapi-zod-client output like:
 * z.string().and(z.string()).min(...).max(...)
 *
 * Usage:
 *   node fixZodIntersections.ts path/to/generated.ts
 */

const fs = require('fs')
const path = require('path')

const inputPath = process.argv[2]

if (!inputPath) {
  console.error('❌ No file path supplied to fixZodIntersections.ts')
  console.error('   Example:')
  console.error(
    '   node fixZodIntersections.ts ./app/utils/apiClient/generated/profileApi.client.ts'
  )
  process.exit(1)
}

const file = path.resolve(process.cwd(), inputPath)

if (!fs.existsSync(file)) {
  console.error(`❌ File not found: ${file}`)
  process.exit(1)
}

let code = fs.readFileSync(file, 'utf8')

// Fix any "z.string().and(z.string())" occurrences
code = code.replace(
  /z\.string\(\)\.and\(z\.string\(\)\)((?:\.\w+\([^()]*\))*)/g,
  (_match, tail) => `z.string()${tail}`
)

fs.writeFileSync(file, code, 'utf8')

console.log(`✔ Fixed Zod intersections in: ${file}`)
