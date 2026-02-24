// Script to generate a beautiful 100-color palette for UI backgrounds
const palette = [];
const borderPalette = [];

// Base hues we want to cover (full spectrum 0-360)
// We will generate different lightness and saturation variations
const steps = 100;
for (let i = 0; i < steps; i++) {
    // Distribute hue evenly across the wheel
    const hue = Math.floor((i * 360) / steps);
    
    // Saturation: keep it colorful but not neon (60-90%)
    const sat = 70 + (i % 3) * 10;
    
    // Lightness: keep it light for text contrast (80-95%)
    // Lighter colors get darker borders, darker colors get even darker borders
    const light = 85 + (i % 2) * 8; 
    
    palette.push(`hsl(${hue}, ${sat}%, ${light}%)`);
    borderPalette.push(`hsl(${hue}, ${sat}%, ${light - 30}%)`); // Border is 30% darker
}

console.log("export const GENETIC_PALETTE = [");
palette.forEach(c => console.log(`    '${c}',`));
console.log("];\n");

console.log("const BORDER_PALETTE = [");
borderPalette.forEach(c => console.log(`    '${c}',`));
console.log("];");
