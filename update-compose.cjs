const fs = require('fs');
let c = fs.readFileSync('docker-compose.yml', 'utf8').replace(/\r\n/g, '\n');
c = c.replace(/restart:\s*"no"/g, 'restart: unless-stopped');
fs.writeFileSync('docker-compose.yml', c, 'utf8');
console.log('docker-compose.yml updated');

