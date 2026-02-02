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
      greenTree: { x: 770, y: 1280, width: 640, height: 800 },
      // Rocks
      rockLarge: { x: 0, y: 0, width: 220, height: 180 },
      rockMedium: { x: 230, y: 0, width: 180, height: 150 },
      rockSmall: { x: 420, y: 30, width: 120, height: 100 },
      // Props
      barrel: { x: 590, y: 128, width: 110, height: 140 },
      crate: { x: 460, y: 128, width: 120, height: 120 },
      stump: { x: 580, y: 1500, width: 180, height: 180 },
      // Bushes and plants
      bush: { x: 1900, y: 50, width: 150, height: 130 },
      tallGrass: { x: 2050, y: 50, width: 130, height: 150 },
      // Flowers
      flowerPot: { x: 1280, y: 256, width: 128, height: 140 },
      // Cart
      cart: { x: 1920, y: 1100, width: 300, height: 220 },
      // Lamp
      lamp: { x: 2300, y: 1100, width: 100, height: 220 },
      // Tent
      tent: { x: 320, y: 640, width: 350, height: 400 }
    }
  },
  // From Asset 4 (carts) - 1536x512
  carts: {
    input: 'public/assets/village/Isometric Assets 4.png',
    sprites: {
      cartApples: { x: 512, y: 0, width: 512, height: 400 }
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
