const fs = require('fs');
const path = 'apps/backend/src/main.ts';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const target = `  // CORS Configuration
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];`;

const replacement = `  // CORS Configuration
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv === '*'
      ? true
      : corsOriginEnv.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('main.ts CORS updated successfully');
} else {
  console.log('Target not found in main.ts');
}

