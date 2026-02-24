const fs = require('fs');

const tsFile = fs.readFileSync('src/utils/geneticColors.ts', 'utf8');
const newPaletteSource = fs.readFileSync('new_palette.ts', 'utf8');

// Find the start and end of the export const GENETIC_PALETTE array
const startPaletteIdx = tsFile.indexOf('export const GENETIC_PALETTE = [');
const endPaletteIdx = tsFile.indexOf('];', startPaletteIdx) + 2;

// Find the start and end of the const BORDER_PALETTE array
const startBorderIdx = tsFile.indexOf('const BORDER_PALETTE = [');
const endBorderIdx = tsFile.indexOf('];', startBorderIdx) + 2;

// Extract everything before, between, and after
const beforePalette = tsFile.substring(0, startPaletteIdx);
const afterBorder = tsFile.substring(endBorderIdx);

const finalFileContent = beforePalette + newPaletteSource + '\n' + afterBorder;

fs.writeFileSync('src/utils/geneticColors.ts', finalFileContent);
console.log('Palette updated successfully.');
