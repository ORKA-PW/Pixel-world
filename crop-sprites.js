import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const SPRITES = {
  // From Asset 3 (houses) - 2560x2560
  houses: {
    input: 'public/assets/village/Isometric Assets 3.png',
    sprites: {
      smallHouse: { x: 0, y: 0, width: 640, height: 700 },
      largeHouse: { x: 1280, y: 0, width: 750, height: 900 },
      mediumHouse: { x: 0, y: 1000, width: 700, height: 750 },
      well: { x: 1400, y: 1500, width: 300, height: 400 }
    }
  },
  // From Asset 2 (objects) - 2560x2560
  objects: {
    input: 'public/assets/village/Isometric Assets 2.png',
    sprites: {
      autumnTree: { x: 0, y: 1280, width: 640, height: 800 },
      greenTree: { x: 770, y: 1280, width: 640, height: 800 }
    }
  }
};

async function cropSprites() {
  const outputDir = 'public/assets/sprites';
  
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  
  for (const [category, data] of Object.entries(SPRITES)) {
    console.log(`Processing ${category}...`);
    
    for (const [name, coords] of Object.entries(data.sprites)) {
      const outputPath = `${outputDir}/${name}.png`;
      
      try {
        await sharp(data.input)
          .extract({
            left: coords.x,
            top: coords.y,
            width: coords.width,
            height: coords.height
          })
          .toFile(outputPath);
        
        console.log(`  ✓ ${name} -> ${outputPath}`);
      } catch (err) {
        console.error(`  ✗ ${name}: ${err.message}`);
      }
    }
  }
  
  console.log('Done!');
}

cropSprites();
