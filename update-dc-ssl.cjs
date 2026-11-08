const fs = require('fs');
let dc = fs.readFileSync('docker-compose.yml', 'utf8').replace(/\r\n/g, '\n');

dc = dc.replace(
  `    ports:
      - "80:80"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro`,
  `    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro`
);

fs.writeFileSync('docker-compose.yml', dc, 'utf8');
console.log('docker-compose.yml updated with 443 and letsencrypt volume');

