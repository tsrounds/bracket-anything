const fs = require('fs');

// Read the current .env.local file
const envFile = fs.readFileSync('.env.local', 'utf8');

// Split into lines
const lines = envFile.split('\n');

// Find the private key lines
let privateKeyStart = -1;
let privateKeyEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('FIREBASE_PRIVATE_KEY:')) {
    privateKeyStart = i;
  }
  if (privateKeyStart !== -1 && lines[i].includes('-----END PRIVATE KEY-----')) {
    privateKeyEnd = i;
    break;
  }
}

if (privateKeyStart === -1 || privateKeyEnd === -1) {
  console.error('Could not find private key in .env.local');
  process.exit(1);
}

// Extract the private key
const privateKeyLines = lines.slice(privateKeyStart, privateKeyEnd + 1);
const privateKey = privateKeyLines.join('\n')
  .replace('FIREBASE_PRIVATE_KEY:', 'FIREBASE_PRIVATE_KEY=')
  .replace(/\n/g, '\\n');

// Replace the old private key with the new format
lines.splice(privateKeyStart, privateKeyEnd - privateKeyStart + 1, privateKey);

// Write back to .env.local
fs.writeFileSync('.env.local', lines.join('\n'));

console.log('Successfully reformatted private key in .env.local'); 