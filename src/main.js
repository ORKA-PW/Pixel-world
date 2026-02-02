import Phaser from 'phaser';

// Isometric configuration - ZOOMED IN for immersion
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MAP_SIZE = 24; // Big map but zoomed in
const WORLD_WIDTH = MAP_SIZE * TILE_WIDTH;
const WORLD_HEIGHT = MAP_SIZE * TILE_HEIGHT * 2;

// Convert cartesian to isometric
function cartToIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// All buildings in the village
const BUILDINGS = {
    // Residential area (top-left)
    myHome: { gridX: 3, gridY: 3, type: 'house1', name: "🏠 Ma Maison", activity: "Home sweet home..." },
    neighbor1: { gridX: 6, gridY: 2, type: 'house2', name: "🏡 Voisin Pierre", activity: "Visiting Pierre..." },
    neighbor2: { gridX: 3, gridY: 6, type: 'house3', name: "🏡 Voisine Marie", activity: "Chatting with Marie..." },
    
    // Commercial area (center)
    tavern: { gridX: 10, gridY: 8, type: 'tavern', name: "🍺 Taverne du Poulpe", activity: "Having a drink..." },
    bakery: { gridX: 14, gridY: 7, type: 'shop', name: "🥖 Boulangerie", activity: "Fresh bread smell..." },
    market: { gridX: 11, gridY: 11, type: 'market', name: "🏪 Marché", activity: "Shopping..." },
    blacksmith: { gridX: 15, gridY: 11, type: 'workshop', name: "⚒️ Forgeron", activity: "Watching the forge..." },
    
    // Cultural area (right)
    library: { gridX: 19, gridY: 5, type: 'library', name: "📚 Bibliothèque", activity: "Reading books..." },
    temple: { gridX: 20, gridY: 9, type: 'temple', name: "⛪ Temple", activity: "Meditating..." },
    
    // Farm area (bottom)
    farm: { gridX: 5, gridY: 15, type: 'farm', name: "🌾 Ferme", activity: "Farming life..." },
    barn: { gridX: 8, gridY: 17, type: 'barn', name: "🐄 Grange", activity: "With the animals..." },
    windmill: { gridX: 4, gridY: 19, type: 'windmill', name: "🌀 Moulin", activity: "Watching it spin..." },
    
    // Outskirts
    watchtower: { gridX: 20, gridY: 2, type: 'tower', name: "🗼 Tour de guet", activity: "Watching the horizon..." },
    dock: { gridX: 18, gridY: 18, type: 'dock', name: "⚓ Quai", activity: "By the water..." },
    
    // Special places
    fountain: { gridX: 12, gridY: 9, type: 'fountain', name: "⛲ Fontaine", activity: "Relaxing by the fountain..." },
    park: { gridX: 8, gridY: 10, type: 'park', name: "🌳 Parc", activity: "Enjoying nature..." },
};

// Decorations scattered around
const DECORATIONS = [];
// Add trees around the map
for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * MAP_SIZE);
    const y = Math.floor(Math.random() * MAP_SIZE);
    // Don't place on buildings
    const onBuilding = Object.values(BUILDINGS).some(b => 
        Math.abs(b.gridX - x) < 2 && Math.abs(b.gridY - y) < 2
    );
    if (!onBuilding && Math.random() > 0.3) {
        DECORATIONS.push({
            gridX: x, gridY: y,
            type: Math.random() > 0.5 ? 'tree1' : 'tree2'
        });
    }
}

let pixel;
let currentBuilding = 'myHome';
let isMoving = false;

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    create() {
        // Set world bounds for camera - bigger world
        this.cameras.main.setBounds(-1000, -500, WORLD_WIDTH + 2000, WORLD_HEIGHT + 1000);
        
        // Zoom in for immersion!
        this.cameras.main.setZoom(1.5);
        
        // Create container for isometric world
        const centerX = 900;
        const centerY = 200;
        
        this.groundLayer = this.add.container(centerX, centerY);
        this.decorLayer = this.add.container(centerX, centerY);
        this.buildingLayer = this.add.container(centerX, centerY);
        this.characterLayer = this.add.container(centerX, centerY);
        this.uiLayer = this.add.container(0, 0);
        this.uiLayer.setScrollFactor(0);

        // Draw world
        this.drawGround();
        this.drawPaths();
        this.drawWater();
        this.drawDecorations();
        this.drawBuildings();
        this.createPixel();
        this.createUI();
        this.updateUI();

        // Camera follows pixel
        this.cameras.main.startFollow(pixel, true, 0.08, 0.08);
        
        // Keyboard controls for camera
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Poll status
        this.time.addEvent({
            delay: 3000,
            callback: () => this.pollStatus(),
            loop: true
        });
    }

    drawGround() {
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const iso = cartToIso(x, y);
                const tile = this.add.graphics();
                
                // Vary grass color slightly
                const grassColors = [0x7CB342, 0x8BC34A, 0x689F38, 0x7CB342];
                const colorIndex = (x + y * 3) % grassColors.length;
                
                tile.fillStyle(grassColors[colorIndex], 1);
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.fillPath();
                
                tile.lineStyle(1, 0x558B2F, 0.2);
                tile.strokePath();
                
                this.groundLayer.add(tile);
            }
        }
    }

    drawPaths() {
        // Main paths connecting buildings
        const pathTiles = [
            // Main street (horizontal)
            ...Array.from({length: 16}, (_, i) => [4 + i, 9]),
            // Residential street
            ...Array.from({length: 6}, (_, i) => [4, 3 + i]),
            // Market street
            ...Array.from({length: 6}, (_, i) => [12, 8 + i]),
            // Farm road
            ...Array.from({length: 8}, (_, i) => [6, 12 + i]),
            // To library
            ...Array.from({length: 5}, (_, i) => [15 + i, 6]),
            // To dock
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
            
            // Path texture
            path.fillStyle(0x6D4C41, 0.3);
            for (let i = 0; i < 3; i++) {
                path.fillCircle(
                    iso.x + (Math.random() - 0.5) * 20,
                    iso.y + (Math.random() - 0.5) * 10,
                    3
                );
            }
            
            this.groundLayer.add(path);
        });
    }

    drawWater() {
        // Pond/lake in bottom right
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
            
            // Water shimmer
            water.fillStyle(0x81D4FA, 0.5);
            water.fillCircle(iso.x + 5, iso.y - 3, 4);
            
            this.groundLayer.add(water);
        });
    }

    drawDecorations() {
        const sorted = [...DECORATIONS].sort((a, b) => 
            (a.gridX + a.gridY) - (b.gridX + b.gridY)
        );

        sorted.forEach(deco => {
            const iso = cartToIso(deco.gridX, deco.gridY);
            const g = this.add.graphics();
            
            if (deco.type === 'tree1') {
                // Pine tree
                g.fillStyle(0x5D4037, 1);
                g.fillRect(iso.x - 3, iso.y - 10, 6, 20);
                g.fillStyle(0x2E7D32, 1);
                g.fillTriangle(iso.x, iso.y - 50, iso.x - 18, iso.y - 10, iso.x + 18, iso.y - 10);
                g.fillStyle(0x388E3C, 1);
                g.fillTriangle(iso.x, iso.y - 40, iso.x - 14, iso.y - 15, iso.x + 14, iso.y - 15);
            } else {
                // Deciduous tree
                g.fillStyle(0x5D4037, 1);
                g.fillRect(iso.x - 4, iso.y - 15, 8, 25);
                g.fillStyle(0x8BC34A, 1);
                g.fillCircle(iso.x, iso.y - 35, 20);
                g.fillStyle(0x9CCC65, 1);
                g.fillCircle(iso.x - 8, iso.y - 28, 12);
                g.fillCircle(iso.x + 10, iso.y - 30, 14);
            }
            
            this.decorLayer.add(g);
        });
    }

    drawBuildings() {
        const sorted = Object.entries(BUILDINGS).sort((a, b) => 
            (a[1].gridX + a[1].gridY) - (b[1].gridX + b[1].gridY)
        );

        sorted.forEach(([key, building]) => {
            const iso = cartToIso(building.gridX, building.gridY);
            const container = this.add.container(iso.x, iso.y);
            
            this.drawBuildingByType(container, building.type);
            this.buildingLayer.add(container);

            // Label (smaller for big map)
            const label = this.add.text(iso.x, iso.y - this.getBuildingHeight(building.type) - 10, building.name, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.buildingLayer.add(label);

            // Clickable
            const hitHeight = this.getBuildingHeight(building.type);
            const hitArea = this.add.zone(iso.x, iso.y - hitHeight/2, 60, hitHeight)
                .setInteractive()
                .on('pointerdown', () => this.moveToBuilding(key))
                .on('pointerover', () => {
                    document.body.style.cursor = 'pointer';
                    container.setScale(1.05);
                })
                .on('pointerout', () => {
                    document.body.style.cursor = 'default';
                    container.setScale(1);
                });
            this.buildingLayer.add(hitArea);
        });
    }

    getBuildingHeight(type) {
        const heights = {
            house1: 70, house2: 70, house3: 65,
            tavern: 80, shop: 60, market: 40,
            workshop: 70, library: 90, temple: 100,
            farm: 50, barn: 60, windmill: 110,
            tower: 120, dock: 30, fountain: 50, park: 30
        };
        return heights[type] || 60;
    }

    drawBuildingByType(container, type) {
        const g = this.add.graphics();
        
        switch(type) {
            case 'house1':
            case 'house2':
            case 'house3':
                this.drawHouse(g, type);
                break;
            case 'tavern':
                this.drawTavern(g);
                break;
            case 'shop':
                this.drawShop(g);
                break;
            case 'market':
                this.drawMarket(g);
                break;
            case 'workshop':
                this.drawWorkshop(g);
                break;
            case 'library':
                this.drawLibrary(g);
                break;
            case 'temple':
                this.drawTemple(g);
                break;
            case 'farm':
                this.drawFarm(g);
                break;
            case 'barn':
                this.drawBarn(g);
                break;
            case 'windmill':
                this.drawWindmill(g);
                break;
            case 'tower':
                this.drawTower(g);
                break;
            case 'dock':
                this.drawDock(g);
                break;
            case 'fountain':
                this.drawFountain(g);
                break;
            case 'park':
                this.drawPark(g);
                break;
            default:
                this.drawHouse(g, 'house1');
        }
        
        container.add(g);
    }

    drawHouse(g, type) {
        const colors = {
            house1: { wall: 0x8D6E63, roof: 0xD84315 },
            house2: { wall: 0xBCAAA4, roof: 0x5D4037 },
            house3: { wall: 0xA1887F, roof: 0x1565C0 }
        };
        const c = colors[type];
        
        // Walls
        g.fillStyle(c.wall, 1);
        g.beginPath();
        g.moveTo(-25, 0); g.lineTo(-25, -50); g.lineTo(0, -65); g.lineTo(0, -15);
        g.closePath(); g.fillPath();
        
        g.fillStyle(Phaser.Display.Color.ValueToColor(c.wall).darken(15).color, 1);
        g.beginPath();
        g.moveTo(0, -15); g.lineTo(0, -65); g.lineTo(25, -50); g.lineTo(25, 0);
        g.closePath(); g.fillPath();
        
        // Roof
        g.fillStyle(c.roof, 1);
        g.beginPath();
        g.moveTo(0, -85); g.lineTo(-30, -50); g.lineTo(0, -65); g.lineTo(30, -50);
        g.closePath(); g.fillPath();
        
        // Autumn leaves
        g.fillStyle(0xFF9800, 0.7);
        [[-15, -70], [10, -65], [-5, -75]].forEach(([x, y]) => g.fillCircle(x, y, 4));
        
        // Door & window
        g.fillStyle(0x4E342E, 1);
        g.fillRect(-18, -5, 10, -20);
        g.fillStyle(0x81D4FA, 1);
        g.fillRect(5, -45, 8, 8);
    }

    drawTavern(g) {
        // Bigger building
        g.fillStyle(0x6D4C41, 1);
        g.beginPath();
        g.moveTo(-35, 0); g.lineTo(-35, -60); g.lineTo(0, -80); g.lineTo(0, -20);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0x5D4037, 1);
        g.beginPath();
        g.moveTo(0, -20); g.lineTo(0, -80); g.lineTo(35, -60); g.lineTo(35, 0);
        g.closePath(); g.fillPath();
        
        // Roof
        g.fillStyle(0x8D6E63, 1);
        g.beginPath();
        g.moveTo(0, -100); g.lineTo(-40, -60); g.lineTo(0, -80); g.lineTo(40, -60);
        g.closePath(); g.fillPath();
        
        // Sign
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-40, -50, 8, 30);
        g.fillStyle(0xFFCC80, 1);
        g.fillRect(-52, -55, 20, 15);
        
        // Windows lit
        g.fillStyle(0xFFEB3B, 0.8);
        g.fillRect(-25, -50, 10, 10);
        g.fillRect(10, -55, 10, 10);
    }

    drawShop(g) {
        g.fillStyle(0xBCAAA4, 1);
        g.beginPath();
        g.moveTo(-20, 0); g.lineTo(-20, -40); g.lineTo(0, -50); g.lineTo(0, -10);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0xA1887F, 1);
        g.beginPath();
        g.moveTo(0, -10); g.lineTo(0, -50); g.lineTo(20, -40); g.lineTo(20, 0);
        g.closePath(); g.fillPath();
        
        // Awning
        g.fillStyle(0xE57373, 1);
        g.beginPath();
        g.moveTo(-25, -35); g.lineTo(25, -35); g.lineTo(20, -25); g.lineTo(-20, -25);
        g.closePath(); g.fillPath();
        
        // Bread display
        g.fillStyle(0xFFCC80, 1);
        g.fillCircle(-5, -5, 5);
        g.fillCircle(5, -8, 4);
    }

    drawMarket(g) {
        // Stalls
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-25, -5, 50, 10);
        
        // Canopy
        g.fillStyle(0xF44336, 1);
        g.beginPath();
        g.moveTo(-30, -30); g.lineTo(30, -30); g.lineTo(25, -5); g.lineTo(-25, -5);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0xFFFFFF, 1);
        g.fillRect(-20, -28, 10, 20);
        g.fillRect(10, -28, 10, 20);
        
        // Goods
        g.fillStyle(0x4CAF50, 1);
        [[-15, -8], [-5, -10], [5, -8], [15, -10]].forEach(([x, y]) => {
            g.fillCircle(x, y, 4);
        });
    }

    drawWorkshop(g) {
        this.drawHouse(g, 'house2');
        // Anvil outside
        g.fillStyle(0x424242, 1);
        g.fillRect(-35, 5, 15, 8);
        g.fillRect(-32, -5, 9, 10);
    }

    drawLibrary(g) {
        // Tall building
        g.fillStyle(0x90A4AE, 1);
        g.beginPath();
        g.moveTo(-25, 0); g.lineTo(-25, -70); g.lineTo(0, -85); g.lineTo(0, -15);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0x78909C, 1);
        g.beginPath();
        g.moveTo(0, -15); g.lineTo(0, -85); g.lineTo(25, -70); g.lineTo(25, 0);
        g.closePath(); g.fillPath();
        
        // Dome roof
        g.fillStyle(0x5D4037, 1);
        g.fillCircle(0, -85, 20);
        
        // Windows (many)
        g.fillStyle(0xFFEB3B, 0.6);
        for (let i = 0; i < 3; i++) {
            g.fillRect(-18, -60 + i * 18, 8, 10);
            g.fillRect(8, -65 + i * 18, 8, 10);
        }
    }

    drawTemple(g) {
        // Tall spire
        g.fillStyle(0xECEFF1, 1);
        g.beginPath();
        g.moveTo(-20, 0); g.lineTo(-20, -60); g.lineTo(0, -70); g.lineTo(0, -10);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0xCFD8DC, 1);
        g.beginPath();
        g.moveTo(0, -10); g.lineTo(0, -70); g.lineTo(20, -60); g.lineTo(20, 0);
        g.closePath(); g.fillPath();
        
        // Spire
        g.fillStyle(0x5D4037, 1);
        g.fillTriangle(0, -110, -15, -70, 15, -70);
        
        // Cross/symbol
        g.fillStyle(0xFFD700, 1);
        g.fillRect(-2, -105, 4, 15);
        g.fillRect(-6, -100, 12, 4);
    }

    drawFarm(g) {
        // Small farmhouse
        g.fillStyle(0xA1887F, 1);
        g.fillRect(-20, -30, 40, 30);
        g.fillStyle(0x8D6E63, 1);
        g.fillTriangle(0, -50, -25, -30, 25, -30);
        
        // Fields nearby
        g.fillStyle(0xCDDC39, 0.6);
        g.fillRect(-40, 5, 25, 15);
        g.fillRect(15, 5, 25, 15);
    }

    drawBarn(g) {
        g.fillStyle(0xC62828, 1);
        g.beginPath();
        g.moveTo(-25, 0); g.lineTo(-25, -45); g.lineTo(0, -55); g.lineTo(0, -10);
        g.closePath(); g.fillPath();
        
        g.fillStyle(0xB71C1C, 1);
        g.beginPath();
        g.moveTo(0, -10); g.lineTo(0, -55); g.lineTo(25, -45); g.lineTo(25, 0);
        g.closePath(); g.fillPath();
        
        // Roof
        g.fillStyle(0x5D4037, 1);
        g.fillTriangle(0, -70, -30, -45, 30, -45);
        
        // Barn doors
        g.fillStyle(0x4E342E, 1);
        g.fillRect(-15, -5, 12, -25);
        g.fillRect(3, -5, 12, -25);
    }

    drawWindmill(g) {
        // Tower
        g.fillStyle(0xBCAAA4, 1);
        g.beginPath();
        g.moveTo(-15, 0); g.lineTo(-10, -80); g.lineTo(10, -80); g.lineTo(15, 0);
        g.closePath(); g.fillPath();
        
        // Cap
        g.fillStyle(0x5D4037, 1);
        g.fillTriangle(0, -100, -15, -80, 15, -80);
        
        // Blades
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-2, -110, 4, 35);
        g.fillRect(-17, -92, 35, 4);
    }

    drawTower(g) {
        g.fillStyle(0x757575, 1);
        g.beginPath();
        g.moveTo(-12, 0); g.lineTo(-12, -100); g.lineTo(12, -100); g.lineTo(12, 0);
        g.closePath(); g.fillPath();
        
        // Top
        g.fillStyle(0x616161, 1);
        g.fillRect(-18, -110, 36, 15);
        
        // Crenellations
        g.fillStyle(0x757575, 1);
        [-15, -5, 5, 15].forEach(x => {
            g.fillRect(x - 3, -120, 6, 10);
        });
        
        // Flag
        g.fillStyle(0x4CAF50, 1);
        g.fillTriangle(0, -135, 0, -120, 15, -127);
    }

    drawDock(g) {
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-30, -5, 60, 10);
        g.fillRect(-5, -5, 10, 25);
        
        // Posts
        g.fillStyle(0x5D4037, 1);
        g.fillRect(-25, -15, 5, 20);
        g.fillRect(20, -15, 5, 20);
    }

    drawFountain(g) {
        // Base
        g.fillStyle(0x9E9E9E, 1);
        g.fillCircle(0, 0, 25);
        
        // Water
        g.fillStyle(0x4FC3F7, 0.8);
        g.fillCircle(0, -2, 20);
        
        // Center piece
        g.fillStyle(0x757575, 1);
        g.fillRect(-4, -30, 8, 28);
        
        // Water spray
        g.fillStyle(0x81D4FA, 0.6);
        g.fillCircle(0, -35, 8);
        g.fillCircle(-5, -30, 4);
        g.fillCircle(5, -30, 4);
    }

    drawPark(g) {
        // Bench
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-20, -5, 40, 8);
        g.fillRect(-18, -15, 5, 10);
        g.fillRect(13, -15, 5, 10);
        
        // Flowers
        g.fillStyle(0xE91E63, 1);
        g.fillCircle(-30, 5, 4);
        g.fillCircle(30, 5, 4);
        g.fillStyle(0xFFEB3B, 1);
        g.fillCircle(-25, 8, 3);
        g.fillCircle(25, 2, 3);
    }

    createPixel() {
        const building = BUILDINGS[currentBuilding];
        const iso = cartToIso(building.gridX, building.gridY);

        pixel = this.add.container(iso.x + 900, iso.y + 200);

        // Shadow
        const shadow = this.add.ellipse(0, 15, 30, 10, 0x000000, 0.3);
        pixel.add(shadow);

        // Glow
        const glow = this.add.circle(0, 0, 22, 0x00d4ff, 0.2);
        pixel.add(glow);

        // Body
        const body = this.add.graphics();
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -5, 15);
        
        body.fillStyle(0x00a8cc, 1);
        [-12, -6, 0, 6, 12].forEach(x => body.fillEllipse(x, 10, 5, 12));

        body.fillStyle(0xffffff, 1);
        body.fillCircle(-5, -7, 5);
        body.fillCircle(5, -7, 5);
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-4, -6, 3);
        body.fillCircle(6, -6, 3);

        body.lineStyle(2, 0x333333, 1);
        body.strokeRoundedRect(-11, -13, 10, 8, 1);
        body.strokeRoundedRect(1, -13, 10, 8, 1);
        body.lineBetween(-1, -9, 1, -9);

        pixel.add(body);

        // Float animation
        this.tweens.add({
            targets: pixel,
            y: pixel.y - 8,
            duration: 1000,
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
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                isMoving = false;
                this.tweens.add({
                    targets: pixel,
                    y: pixel.y - 8,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.updateUI();
    }

    createUI() {
        this.uiLayer.add(
            this.add.text(10, 10, '🏘️ Pixel Village', {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#2E7D32',
                stroke: '#ffffff',
                strokeThickness: 3
            }).setScrollFactor(0)
        );
        
        this.uiLayer.add(
            this.add.text(10, 35, 'Click buildings to move • Arrow keys to look around', {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#666666'
            }).setScrollFactor(0)
        );
    }

    updateUI() {
        const building = BUILDINGS[currentBuilding];
        if (building) {
            document.getElementById('location').textContent = building.name;
            document.getElementById('activity').textContent = building.activity;
        }
    }

    update() {
        // Camera manual control
        if (this.cursors.left.isDown) {
            this.cameras.main.scrollX -= 5;
        }
        if (this.cursors.right.isDown) {
            this.cameras.main.scrollX += 5;
        }
        if (this.cursors.up.isDown) {
            this.cameras.main.scrollY -= 5;
        }
        if (this.cursors.down.isDown) {
            this.cameras.main.scrollY += 5;
        }
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
