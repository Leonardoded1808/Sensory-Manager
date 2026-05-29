import fs from 'fs';
const content = fs.readFileSync('services/geminiService.ts', 'utf8');
fs.writeFileSync('services/geminiService.ts', content.replace(/gemini-1\.5-flash/g, 'gemini-3.5-flash'));
