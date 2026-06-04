const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const importRegex = /from\s+['"]([^'"]+)['"]/g;
const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

let errors = [];

function checkPathCase(originalPath, importStr, sourceFile) {
  // If not relative, ignore (like 'react' or 'axios')
  if (!importStr.startsWith('.')) return;

  // Resolve to absolute path
  const sourceDir = path.dirname(sourceFile);
  let targetPath = path.resolve(sourceDir, importStr);
  
  // Try to find the actual file
  // Target could be a file without extension (.js, .jsx), or a directory containing index.js
  let found = false;
  let exactTarget = null;
  
  const possibleExts = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
  for (let ext of possibleExts) {
    let testPath = targetPath + ext;
    if (fs.existsSync(testPath)) {
      found = true;
      exactTarget = testPath;
      break;
    }
  }

  if (!found) {
     // If we can't even find it case-insensitively, it's a completely broken import
     errors.push(`NOT FOUND: ${importStr} in ${sourceFile}`);
     return;
  }

  // Now we have exactTarget. Let's trace it back to see if the case matches exactly
  const parts = path.relative(srcDir, exactTarget).split(path.sep);
  let currentDir = srcDir;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') continue; // Skip empty parts
    
    const filesInDir = fs.readdirSync(currentDir);
    if (!filesInDir.includes(part)) {
      // Find the one that matches case-insensitively
      const actualPart = filesInDir.find(f => f.toLowerCase() === part.toLowerCase());
      if (actualPart) {
         errors.push(`CASE MISMATCH in ${sourceFile}:\nImported as: ${importStr}\nActual file/folder: ${actualPart}\n`);
      }
      break;
    }
    currentDir = path.join(currentDir, part);
  }
}

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      checkPathCase(filePath, match[1], filePath);
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      checkPathCase(filePath, match[1], filePath);
    }
  }
});

if (errors.length > 0) {
  console.log('Found issues:');
  errors.forEach(e => console.log(e));
} else {
  console.log('No case mismatch or missing imports found!');
}
