const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

code = code.replace(
  `      if (matches.length === 1) return matches[0];`,
  `      if (matches.length === 1) return matches[0]!;`
);

fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Fixed unchecked index access.');
