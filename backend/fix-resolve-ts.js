const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

code = code.replace(
  `      if (match) {
        email = match[1];
        share = parseFloat(match[2].replace('%', ''));
      }`,
  `      if (match) {
        email = match[1]!;
        share = parseFloat(match[2]!.replace('%', ''));
      }`
);

fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Fixed TS errors in resolve.');
