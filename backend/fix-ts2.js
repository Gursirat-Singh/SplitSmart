const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

code = code.replace(
  `      if (emailToUserMap.has(lowerId)) return emailToUserMap.get(lowerId)!;`,
  `      const member = emailToUserMap.get(lowerId);
      if (member) return member;`
);

fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Fixed undefined return type.');
