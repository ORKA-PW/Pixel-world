import Phaser from 'phaser';

// Isometric configuration
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MAP_SIZE = 24;
const WORLD_WIDTH = MAP_SIZE * TILE_WIDTH;
const WORLD_HEIGHT = MAP_SIZE * TILE_HEIGHT * 2;

function cartToIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// Village buildings
const BUILDINGS = {
    myHome: { gridX: 3, gridY: 3, type: 'house', name: "🏠 Ma Maison", activity: "Home sweet home..." },
    neighbor1: { gridX: 6, gridY: 2, type: 'house', name: "🏡 Voisin", activity: "Visiting..." },
    neighbor2: { gridX: 3, gridY: 6, type: 'house', name: "🏡 Voisine", activity: "Chatting..." },
    tavern: { gridX: 10, gridY: 8, type: 'tavern', name: "🍺 Taverne", activity: "Having a drink..." },
    bakery: { gridX: 14, gridY: 7, type: 'shop', name: "🥖 Boulangerie", activity: "Fresh bread..." },
    market: { gridX: 11, gridY: 11, type: 'market', name: "🏪 Marché", activity: "Shopping..." },
    blacksmith: { gridX: 15, gridY: 11, type: 'workshop', name: "⚒️ Forgeron", activity: "At the forge..." },
    library: { gridX: 19, gridY: 5, type: 'library', name: "📚 Bibliothèque", activity: "Reading..." },
    temple: { gridX: 20, gridY: 9, type: 'temple', name: "⛪ Temple", activity: "Meditating..." },
    farm: { gridX: 5, gridY: 15, type: 'farm', name: "🌾 Ferme", activity: "Farming..." },
    barn: { gridX: 8, gridY: 17, type: 'barn', name: "🐄 Grange", activity: "With animals..." },
    windmill: { gridX: 4, gridY: 19, type: 'windmill', name: "🌀 Moulin", activity: "Watching it spin..." },
    tower: { gridX: 20, gridY: 2, type: 'tower', name: "🗼 Tour de guet", activity: "Watching..." },
    dock: { gridX: 18, gridY: 18, type: 'dock', name: "⚓ Quai", activity: "By the water..." },
    fountain: { gridX: 12, gridY: 9, type: 'fountain', name: "⛲ Fontaine", activity: "Relaxing..." },
    park: { gridX: 8, gridY: 10, type: 'park', name: "🌳 Parc", activity: "Nature..." },
};

// Random trees
const DECORATIONS = [];
for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * MAP_SIZE);
    const y = Math.floor(Math.random() * MAP_SIZE);
    const onBuilding = Object.values(BUILDINGS).some(b => 
        Math.abs(b.gridX - x) < 3 && Math.abs(b.gridY - y) < 3
    );
    if (!onBuilding) {
        DECORATIONS.push({ gridX: x, gridY: y, type: Math.random() > 0.5 ? 'tree1' : 'tree2' });
    }
}

let pixel, currentBuilding = 'myHome', isMoving = false;

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    preload() {
        // Load the real assets!
        this.load.image('terrain', '/assets/village/Isometric Assets 1.png');
        this.load.image('objects', '/assets/village/Isometric Assets 2.png');
        this.load.image('houses', '/assets/village/Isometric Assets 3.png');
        this.load.image('carts', '/assets/village/Isometric Assets 4.png');
    }

    create() {
        this.cameras.main.setBounds(-1000, -500, WORLD_WIDTH + 2000, WORLD_HEIGHT + 1000);
        this.cameras.main.setZoom(1.5);
        
        const centerX = 900, centerY = 200;
        
        this.groundLayer = this.add.container(centerX, centerY);
        this.decorLayer = this.add.container(centerX, centerY);
        this.buildingLayer = this.add.container(centerX, centerY);
        this.characterLayer = this.add.container(centerX, centerY);

        this.drawGround();
        this.drawPaths();
        this.drawWater();
        this.drawDecorations();
        this.drawBuildings();
        this.createPixel();
        this.createUI();
        this.updateUI();

        this.cameras.main.startFollow(pixel, true, 0.08, 0.08);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.time.addEvent({ delay: 3000, callback: () => this.pollStatus(), loop: true });
    }

    drawGround() {
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const iso = cartToIso(x, y);
                const tile = this.add.graphics();
                const colors = [0x7CB342, 0x8BC34A, 0x689F38, 0x7CB342];
                
                tile.fillStyle(colors[(x + y * 3) % 4], 1);
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.fillPath();
                tile.lineStyle(1, 0x558B2F, 0.15);
                tile.strokePath();
                
                this.groundLayer.add(tile);
            }
        }
    }

    drawPaths() {
        const pathTiles = [
            ...Array.from({length: 16}, (_, i) => [4 + i, 9]),
            ...Array.from({length: 6}, (_, i) => [4, 3 + i]),
            ...Array.from({length: 6}, (_, i) => [12, 8 + i]),
            ...Array.from({length: 8}, (_, i) => [6, 12 + i]),
            ...Array.from({length: 5}, (_, i) => [15 + i, 6]),
            ...Array.from({length: 6}, (_, i) => [15, 12 + i]),
        ];
        
        pathTiles.forEach(([x, y]) => {
            const iso = cartToIso(x, y);
            const path = this.add.graphics();
            path.fillStyle(0x8D6E63, 1);
            path.beginPath();
            path.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
            path.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
            path.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
            path.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
            path.closePath();
            path.fillPath();
            this.groundLayer.add(path);
        });
    }

    drawWater() {
        const waterTiles = [
            [19, 16], [20, 16], [21, 16],
            [18, 17], [19, 17], [20, 17], [21, 17], [22, 17],
            [18, 18], [19, 18], [20, 18], [21, 18], [22, 18],
            [19, 19], [20, 19], [21, 19],
        ];
        
        waterTiles.forEach(([x, y]) => {
            const iso = cartToIso(x, y);
            const water = this.add.graphics();
            water.fillStyle(0x4FC3F7, 0.8);
            water.beginPath();
            water.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
            water.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
            water.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
            water.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
            water.closePath();
            water.fillPath();
            
            // Animated shimmer
            water.fillStyle(0xB3E5FC, 0.4);
            water.fillCircle(iso.x + Math.sin(Date.now()/500 + x) * 10, iso.y - 5, 6);
            
            this.groundLayer.add(water);
        });
    }

    drawDecorations() {
        const sorted = [...DECORATIONS].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));

        sorted.forEach(deco => {
            const iso = cartToIso(deco.gridX, deco.gridY);
            
            // Use real tree from spritesheet - crop from objects image
            // Asset 2 has trees at bottom left area
            // For now, draw nice programmatic trees that match the style
            const tree = this.add.graphics();
            
            if (deco.type === 'tree1') {
                // Autumn conifer (matching asset style)
                tree.fillStyle(0x5D4037, 1);
                tree.fillRect(iso.x - 6, iso.y - 20, 12, 40);
                tree.fillStyle(0x8D6E63, 1);
                tree.fillTriangle(iso.x, iso.y - 100, iso.x - 35, iso.y - 20, iso.x + 35, iso.y - 20);
                tree.fillStyle(0xA1887F, 1);
                tree.fillTriangle(iso.x, iso.y - 80, iso.x - 28, iso.y - 30, iso.x + 28, iso.y - 30);
                tree.fillStyle(0xBCAAA4, 1);
                tree.fillTriangle(iso.x, iso.y - 60, iso.x - 20, iso.y - 35, iso.x + 20, iso.y - 35);
            } else {
                // Green deciduous tree
                tree.fillStyle(0x5D4037, 1);
                tree.fillRect(iso.x - 8, iso.y - 25, 16, 45);
                tree.fillStyle(0x558B2F, 1);
                tree.fillCircle(iso.x, iso.y - 60, 35);
                tree.fillStyle(0x689F38, 1);
                tree.fillCircle(iso.x - 15, iso.y - 50, 22);
                tree.fillCircle(iso.x + 18, iso.y - 55, 25);
                tree.fillStyle(0x7CB342, 1);
                tree.fillCircle(iso.x + 5, iso.y - 70, 18);
            }
            
            this.decorLayer.add(tree);
        });
    }

    drawBuildings() {
        const sorted = Object.entries(BUILDINGS).sort((a, b) => 
            (a[1].gridX + a[1].gridY) - (b[1].gridX + b[1].gridY)
        );

        sorted.forEach(([key, building]) => {
            const iso = cartToIso(building.gridX, building.gridY);
            const container = this.add.container(iso.x, iso.y);
            
            // For houses, use the real spritesheet!
            if (building.type === 'house') {
                // Add cropped house from Asset 3
                // The houses in Asset 3 are roughly 500x500px each
                // House 1 starts at approximately (0, 0)
                const houseSprite = this.add.image(0, -120, 'houses');
                houseSprite.setCrop(0, 0, 640, 700); // First house
                houseSprite.setScale(0.22);
                houseSprite.setOrigin(0.5, 1);
                container.add(houseSprite);
            } else {
                // Draw other buildings programmatically (matching autumn style)
                this.drawBuildingByType(container, building.type);
            }
            
            this.buildingLayer.add(container);

            // Label
            const label = this.add.text(iso.x, iso.y - 140, building.name, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.buildingLayer.add(label);

            // Clickable
            const hitArea = this.add.zone(iso.x, iso.y - 70, 100, 140)
                .setInteractive()
                .on('pointerdown', () => this.moveToBuilding(key))
                .on('pointerover', () => {
                    document.body.style.cursor = 'pointer';
                    container.setScale(1.03);
                })
                .on('pointerout', () => {
                    document.body.style.cursor = 'default';
                    container.setScale(1);
                });
            this.buildingLayer.add(hitArea);
        });
    }

    drawBuildingByType(container, type) {
        const g = this.add.graphics();
        
        // All buildings in autumn/medieval style to match assets
        switch(type) {
            case 'tavern':
                // Large building with sign
                g.fillStyle(0x6D4C41, 1);
                g.beginPath();
                g.moveTo(-45, 0); g.lineTo(-45, -80); g.lineTo(0, -100); g.lineTo(0, -20);
                g.closePath(); g.fillPath();
                g.fillStyle(0x5D4037, 1);
                g.beginPath();
                g.moveTo(0, -20); g.lineTo(0, -100); g.lineTo(45, -80); g.lineTo(45, 0);
                g.closePath(); g.fillPath();
                // Thatched roof
                g.fillStyle(0xBCAAA4, 1);
                g.beginPath();
                g.moveTo(0, -130); g.lineTo(-55, -80); g.lineTo(0, -100); g.lineTo(55, -80);
                g.closePath(); g.fillPath();
                // Autumn leaves on roof
                g.fillStyle(0xFF8A65, 0.8);
                [[-25, -105], [15, -100], [-10, -115]].forEach(([x, y]) => g.fillCircle(x, y, 8));
                g.fillStyle(0xFFAB91, 0.7);
                [[-15, -110], [5, -108]].forEach(([x, y]) => g.fillCircle(x, y, 5));
                // Sign
                g.fillStyle(0x8D6E63, 1);
                g.fillRect(-55, -60, 6, 40);
                g.fillStyle(0xFFCC80, 1);
                g.fillRect(-72, -65, 25, 18);
                // Windows
                g.fillStyle(0xFFE082, 0.9);
                g.fillRect(-32, -65, 14, 14);
                g.fillRect(15, -70, 14, 14);
                break;
                
            case 'shop':
                g.fillStyle(0xA1887F, 1);
                g.beginPath();
                g.moveTo(-30, 0); g.lineTo(-30, -55); g.lineTo(0, -70); g.lineTo(0, -15);
                g.closePath(); g.fillPath();
                g.fillStyle(0x8D6E63, 1);
                g.beginPath();
                g.moveTo(0, -15); g.lineTo(0, -70); g.lineTo(30, -55); g.lineTo(30, 0);
                g.closePath(); g.fillPath();
                // Roof
                g.fillStyle(0xD7CCC8, 1);
                g.beginPath();
                g.moveTo(0, -90); g.lineTo(-38, -55); g.lineTo(0, -70); g.lineTo(38, -55);
                g.closePath(); g.fillPath();
                // Awning
                g.fillStyle(0xC62828, 1);
                g.beginPath();
                g.moveTo(-35, -45); g.lineTo(35, -45); g.lineTo(30, -30); g.lineTo(-30, -30);
                g.closePath(); g.fillPath();
                g.fillStyle(0xFFFFFF, 0.8);
                g.fillRect(-25, -43, 12, 10);
                g.fillRect(13, -43, 12, 10);
                break;
                
            case 'market':
                g.fillStyle(0x8D6E63, 1);
                g.fillRect(-35, -8, 70, 15);
                g.fillStyle(0xD32F2F, 1);
                g.beginPath();
                g.moveTo(-40, -45); g.lineTo(40, -45); g.lineTo(35, -8); g.lineTo(-35, -8);
                g.closePath(); g.fillPath();
                g.fillStyle(0xFFFFFF, 1);
                g.fillRect(-28, -40, 15, 28);
                g.fillRect(13, -40, 15, 28);
                // Goods
                g.fillStyle(0xFFC107, 1);
                [[-20, -12], [0, -14], [20, -12]].forEach(([x, y]) => g.fillCircle(x, y, 6));
                g.fillStyle(0x4CAF50, 1);
                [[-10, -10], [10, -13]].forEach(([x, y]) => g.fillCircle(x, y, 5));
                break;
                
            case 'workshop':
                // Similar to house but with workshop elements
                g.fillStyle(0x795548, 1);
                g.beginPath();
                g.moveTo(-35, 0); g.lineTo(-35, -65); g.lineTo(0, -80); g.lineTo(0, -15);
                g.closePath(); g.fillPath();
                g.fillStyle(0x6D4C41, 1);
                g.beginPath();
                g.moveTo(0, -15); g.lineTo(0, -80); g.lineTo(35, -65); g.lineTo(35, 0);
                g.closePath(); g.fillPath();
                g.fillStyle(0x5D4037, 1);
                g.beginPath();
                g.moveTo(0, -100); g.lineTo(-42, -65); g.lineTo(0, -80); g.lineTo(42, -65);
                g.closePath(); g.fillPath();
                // Chimney with smoke
                g.fillStyle(0x424242, 1);
                g.fillRect(15, -110, 12, 25);
                g.fillStyle(0x9E9E9E, 0.5);
                g.fillCircle(21, -120, 8);
                g.fillCircle(25, -130, 6);
                // Anvil
                g.fillStyle(0x37474F, 1);
                g.fillRect(-50, 2, 20, 10);
                g.fillRect(-47, -8, 14, 10);
                break;
                
            case 'library':
                g.fillStyle(0x78909C, 1);
                g.beginPath();
                g.moveTo(-30, 0); g.lineTo(-30, -90); g.lineTo(0, -105); g.lineTo(0, -15);
                g.closePath(); g.fillPath();
                g.fillStyle(0x607D8B, 1);
                g.beginPath();
                g.moveTo(0, -15); g.lineTo(0, -105); g.lineTo(30, -90); g.lineTo(30, 0);
                g.closePath(); g.fillPath();
                // Dome
                g.fillStyle(0x5D4037, 1);
                g.fillCircle(0, -105, 25);
                g.fillStyle(0x4E342E, 1);
                g.fillCircle(0, -105, 15);
                // Windows
                g.fillStyle(0xFFF59D, 0.7);
                for (let i = 0; i < 3; i++) {
                    g.fillRect(-22, -75 + i * 22, 10, 14);
                    g.fillRect(10, -80 + i * 22, 10, 14);
                }
                break;
                
            case 'temple':
                g.fillStyle(0xECEFF1, 1);
                g.beginPath();
                g.moveTo(-25, 0); g.lineTo(-25, -75); g.lineTo(0, -90); g.lineTo(0, -15);
                g.closePath(); g.fillPath();
                g.fillStyle(0xCFD8DC, 1);
                g.beginPath();
                g.moveTo(0, -15); g.lineTo(0, -90); g.lineTo(25, -75); g.lineTo(25, 0);
                g.closePath(); g.fillPath();
                // Spire
                g.fillStyle(0x5D4037, 1);
                g.fillTriangle(0, -140, -20, -90, 20, -90);
                // Cross
                g.fillStyle(0xFFD700, 1);
                g.fillRect(-3, -138, 6, 20);
                g.fillRect(-9, -130, 18, 5);
                // Stained glass
                g.fillStyle(0x7C4DFF, 0.6);
                g.fillCircle(-10, -55, 8);
                g.fillStyle(0xE91E63, 0.6);
                g.fillCircle(12, -60, 8);
                break;
                
            case 'farm':
                g.fillStyle(0xA1887F, 1);
                g.fillRect(-30, -40, 60, 40);
                g.fillStyle(0x8D6E63, 1);
                g.fillTriangle(0, -65, -38, -40, 38, -40);
                // Fields
                g.fillStyle(0xDCE775, 0.7);
                g.fillRect(-55, 5, 35, 20);
                g.fillRect(20, 5, 35, 20);
                // Wheat lines
                g.lineStyle(1, 0xAFB42B, 0.8);
                for (let i = 0; i < 5; i++) {
                    g.lineBetween(-50 + i*7, 5, -50 + i*7, 25);
                    g.lineBetween(25 + i*7, 5, 25 + i*7, 25);
                }
                break;
                
            case 'barn':
                g.fillStyle(0xB71C1C, 1);
                g.beginPath();
                g.moveTo(-35, 0); g.lineTo(-35, -60); g.lineTo(0, -75); g.lineTo(0, -15);
                g.closePath(); g.fillPath();
                g.fillStyle(0x8D0000, 1);
                g.beginPath();
                g.moveTo(0, -15); g.lineTo(0, -75); g.lineTo(35, -60); g.lineTo(35, 0);
                g.closePath(); g.fillPath();
                g.fillStyle(0x5D4037, 1);
                g.fillTriangle(0, -95, -42, -60, 42, -60);
                // Barn doors
                g.fillStyle(0x3E2723, 1);
                g.fillRect(-22, -8, 18, -35);
                g.fillRect(4, -8, 18, -35);
                // X pattern
                g.lineStyle(2, 0x5D4037, 1);
                g.lineBetween(-20, -8, -6, -40);
                g.lineBetween(-6, -8, -20, -40);
                break;
                
            case 'windmill':
                g.fillStyle(0xD7CCC8, 1);
                g.beginPath();
                g.moveTo(-20, 0); g.lineTo(-12, -100); g.lineTo(12, -100); g.lineTo(20, 0);
                g.closePath(); g.fillPath();
                g.fillStyle(0x5D4037, 1);
                g.fillTriangle(0, -120, -18, -100, 18, -100);
                // Blades
                g.fillStyle(0x8D6E63, 1);
                g.save();
                const time = Date.now() / 1000;
                const bladeLength = 45;
                for (let i = 0; i < 4; i++) {
                    const angle = time + (i * Math.PI / 2);
                    const bx = Math.cos(angle) * bladeLength;
                    const by = Math.sin(angle) * bladeLength * 0.5;
                    g.fillRect(-2 + bx/2, -105 + by/2, 4, bladeLength);
                }
                g.restore();
                break;
                
            case 'tower':
                g.fillStyle(0x757575, 1);
                g.beginPath();
                g.moveTo(-18, 0); g.lineTo(-18, -120); g.lineTo(18, -120); g.lineTo(18, 0);
                g.closePath(); g.fillPath();
                g.fillStyle(0x616161, 1);
                g.fillRect(-25, -130, 50, 15);
                // Crenellations
                g.fillStyle(0x757575, 1);
                [-20, -8, 4, 16].forEach(x => g.fillRect(x - 4, -145, 8, 15));
                // Flag
                g.fillStyle(0x43A047, 1);
                g.fillTriangle(5, -160, 5, -145, 25, -152);
                g.fillStyle(0x5D4037, 1);
                g.fillRect(3, -165, 4, 25);
                // Windows
                g.fillStyle(0x37474F, 1);
                for (let i = 0; i < 4; i++) {
                    g.fillRect(-8, -110 + i*25, 10, 15);
                }
                break;
                
            case 'dock':
                g.fillStyle(0x6D4C41, 1);
                g.fillRect(-40, -8, 80, 15);
                g.fillRect(-8, -8, 16, 35);
                // Posts
                g.fillStyle(0x5D4037, 1);
                g.fillRect(-35, -25, 8, 30);
                g.fillRect(27, -25, 8, 30);
                // Rope
                g.lineStyle(2, 0xBCAAA4, 1);
                g.lineBetween(-31, -20, 31, -20);
                break;
                
            case 'fountain':
                g.fillStyle(0x9E9E9E, 1);
                g.fillCircle(0, 0, 35);
                g.fillStyle(0x4FC3F7, 0.85);
                g.fillCircle(0, -3, 28);
                g.fillStyle(0x757575, 1);
                g.fillRect(-6, -50, 12, 45);
                g.fillCircle(0, -55, 10);
                // Water spray
                g.fillStyle(0x81D4FA, 0.7);
                g.fillCircle(0, -65, 12);
                g.fillCircle(-8, -58, 6);
                g.fillCircle(8, -58, 6);
                break;
                
            case 'park':
                // Bench
                g.fillStyle(0x6D4C41, 1);
                g.fillRect(-30, -8, 60, 12);
                g.fillRect(-26, -25, 8, 18);
                g.fillRect(18, -25, 8, 18);
                // Flowers
                const flowerColors = [0xE91E63, 0xFFEB3B, 0x9C27B0, 0xFF5722];
                for (let i = 0; i < 8; i++) {
                    g.fillStyle(flowerColors[i % 4], 1);
                    const fx = -45 + (i % 4) * 25 + Math.random() * 10;
                    const fy = 8 + Math.floor(i / 4) * 12;
                    g.fillCircle(fx, fy, 5);
                }
                break;
        }
        
        container.add(g);
    }

    createPixel() {
        const building = BUILDINGS[currentBuilding];
        const iso = cartToIso(building.gridX, building.gridY);

        pixel = this.add.container(iso.x + 900, iso.y + 200);

        const shadow = this.add.ellipse(0, 20, 35, 12, 0x000000, 0.25);
        pixel.add(shadow);

        const glow = this.add.circle(0, 0, 28, 0x00d4ff, 0.15);
        pixel.add(glow);

        const body = this.add.graphics();
        
        // Bigger, cuter Pixel
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -8, 22);
        
        body.fillStyle(0x00a8cc, 1);
        [-18, -9, 0, 9, 18].forEach(x => body.fillEllipse(x, 15, 8, 18));

        body.fillStyle(0xffffff, 1);
        body.fillCircle(-8, -12, 8);
        body.fillCircle(8, -12, 8);
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-6, -10, 4);
        body.fillCircle(10, -10, 4);
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-4, -13, 2);
        body.fillCircle(12, -13, 2);

        // Glasses
        body.lineStyle(3, 0x333333, 1);
        body.strokeRoundedRect(-16, -20, 14, 12, 2);
        body.strokeRoundedRect(2, -20, 14, 12, 2);
        body.lineBetween(-2, -14, 2, -14);

        // Smile
        body.lineStyle(2, 0x0277BD, 1);
        body.beginPath();
        body.arc(0, -2, 10, 0.3, Math.PI - 0.3);
        body.strokePath();

        pixel.add(body);

        this.tweens.add({
            targets: pixel,
            y: pixel.y - 10,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    moveToBuilding(buildingKey) {
        if (isMoving || !BUILDINGS[buildingKey]) return;

        const building = BUILDINGS[buildingKey];
        const iso = cartToIso(building.gridX, building.gridY);
        
        isMoving = true;
        currentBuilding = buildingKey;

        this.tweens.killTweensOf(pixel);

        this.tweens.add({
            targets: pixel,
            x: iso.x + 900,
            y: iso.y + 200,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                isMoving = false;
                this.tweens.add({
                    targets: pixel,
                    y: pixel.y - 10,
                    duration: 1100,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.updateUI();
    }

    createUI() {
        const uiText = this.add.text(10, 10, '🏘️ Pixel Village', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#2E7D32',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setScrollFactor(0);
        
        this.add.text(10, 32, '↑↓←→ Explorer | Clic = Se déplacer', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setScrollFactor(0);
    }

    updateUI() {
        const building = BUILDINGS[currentBuilding];
        if (building) {
            document.getElementById('location').textContent = building.name;
            document.getElementById('activity').textContent = building.activity;
        }
    }

    update() {
        const speed = 8;
        if (this.cursors.left.isDown) this.cameras.main.scrollX -= speed;
        if (this.cursors.right.isDown) this.cameras.main.scrollX += speed;
        if (this.cursors.up.isDown) this.cameras.main.scrollY -= speed;
        if (this.cursors.down.isDown) this.cameras.main.scrollY += speed;
    }

    async pollStatus() {
        try {
            const response = await fetch('/status.json?' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (data.building && data.building !== currentBuilding && BUILDINGS[data.building]) {
                    this.moveToBuilding(data.building);
                }
                if (data.activity) {
                    document.getElementById('activity').textContent = data.activity;
                }
            }
        } catch (e) {}
    }
}

const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: VillageScene
};

new Phaser.Game(config);
