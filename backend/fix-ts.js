const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

code = code.replace(
  `    const resolveMember = (identifier: string): { id: string; joinedAt: Date; leftAt: Date | null } | null | 'AMBIGUOUS' => {`,
  `    const resolveMember = (identifier: string): { id: string; joinedAt: Date; leftAt: Date | null; name: string } | null | 'AMBIGUOUS' => {`
);

code = code.replace(
  `const overlap = words1.filter(w => words2.includes(w)).length;`,
  `const overlap = words1.filter((w: string) => words2.includes(w)).length;`
);

fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Fixed TS errors.');
