// Sprite configuration for the village assets
// All coordinates are in the original image (2560x2560 for assets 1-3, 1536x512 for asset 4)

export const SPRITES = {
  // Asset 3 - Houses (2560x2560)
  houses: {
    file: 'houses',
    items: {
      // House 1 - Small house with fence (top-left)
      smallHouse: { x: 0, y: 0, width: 640, height: 700 },
      // House 2 - Large house with chimney (top-right)
      largeHouse: { x: 1280, y: 0, width: 750, height: 900 },
      // House 3 - Medium house (bottom-left)
      mediumHouse: { x: 0, y: 1000, width: 700, height: 750 },
      // Well (bottom-right)
      well: { x: 1400, y: 1500, width: 300, height: 400 }
    }
  },

  // Asset 2 - Objects and decorations (2560x2560)
  objects: {
    file: 'objects',
    items: {
      // Trees
      autumnTree: { x: 0, y: 1280, width: 640, height: 800 },
      greenTree: { x: 770, y: 1280, width: 640, height: 800 },
      // Rocks
      rockLarge: { x: 0, y: 0, width: 200, height: 200 },
      rockMedium: { x: 200, y: 0, width: 150, height: 150 },
      // Props
      barrel: { x: 640, y: 128, width: 100, height: 120 },
      crate: { x: 512, y: 128, width: 100, height: 100 },
      pot: { x: 0, y: 128, width: 80, height: 100 },
      // Cart
      cart: { x: 1920, y: 900, width: 280, height: 200 },
      // Lamp
      lamp: { x: 2200, y: 900, width: 100, height: 200 },
      // Chest
      chest: { x: 1920, y: 1800, width: 200, height: 180 },
      // Stump
      stump: { x: 2100, y: 1400, width: 150, height: 150 },
      // Bush
      bush: { x: 1920, y: 64, width: 120, height: 100 },
      // Flowers
      flowers: { x: 1280, y: 256, width: 128, height: 128 }
    }
  },

  // Asset 1 - Terrain tiles (2560x2560)
  terrain: {
    file: 'terrain',
    tileSize: 256,
    items: {
      // Grass tiles (row 0-1)
      grassFull: { x: 0, y: 0, width: 256, height: 256 },
      grassEdgeN: { x: 256, y: 0, width: 256, height: 256 },
      grassEdgeE: { x: 512, y: 0, width: 256, height: 256 },
      // Path tiles (middle rows)
      pathStraight: { x: 0, y: 1280, width: 256, height: 256 },
      pathCorner: { x: 256, y: 1280, width: 256, height: 256 },
      // Stone tiles
      stonePath: { x: 0, y: 512, width: 256, height: 256 }
    }
  },

  // Asset 4 - Carts (1536x512)
  carts: {
    file: 'carts',
    items: {
      cartEmpty: { x: 0, y: 0, width: 512, height: 512 },
      cartApples1: { x: 512, y: 0, width: 512, height: 512 },
      cartApples2: { x: 1024, y: 0, width: 512, height: 512 }
    }
  }
};

// Building types mapped to sprites
export const BUILDING_SPRITES = {
  house: 'houses.smallHouse',
  tavern: 'houses.largeHouse',
  shop: 'houses.mediumHouse',
  market: 'houses.mediumHouse',
  workshop: 'houses.largeHouse',
  library: 'houses.largeHouse',
  temple: 'houses.largeHouse',
  farm: 'houses.smallHouse',
  barn: 'houses.largeHouse',
  windmill: 'houses.largeHouse',  // TODO: need windmill sprite
  tower: 'houses.largeHouse',      // TODO: need tower sprite
  dock: 'houses.smallHouse',
  fountain: 'objects.well',
  park: null  // Use decorations
};

// Decoration types mapped to sprites
export const DECORATION_SPRITES = {
  tree1: 'objects.autumnTree',
  tree2: 'objects.greenTree',
  rock: 'objects.rockLarge',
  bush: 'objects.bush',
  flowers: 'objects.flowers'
};
