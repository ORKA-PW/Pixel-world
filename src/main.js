import Phaser from 'phaser';

// Isometric configuration
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MAP_SIZE = 12;

// Convert cartesian to isometric
function cartToIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// Buildings in the village with asset positions
const BUILDINGS = {
    home: { 
        gridX: 3, gridY: 3, 
        name: "🏠 Ma Maison", 
        activity: "Relaxing at home...",
        sprite: 'house1',
        scale: 0.35
    },
    workshop: { 
        gridX: 7, gridY: 2, 
        name: "🔨 Atelier", 
        activity: "Crafting things...",
        sprite: 'house2',
        scale: 0.35
    },
    tavern: { 
        gridX: 3, gridY: 7, 
        name: "🍺 Taverne", 
        activity: "Having a drink...",
        sprite: 'house3',
        scale: 0.30
    },
    market: { 
        gridX: 8, gridY: 6, 
        name: "🏪 Marché", 
        activity: "Shopping...",
        sprite: 'cart',
        scale: 0.5
    }
};

// Decorations
const DECORATIONS = [
    { gridX: 1, gridY: 1, sprite: 'tree1', scale: 0.4 },
    { gridX: 10, gridY: 1, sprite: 'tree2', scale: 0.35 },
    { gridX: 1, gridY: 9, sprite: 'tree1', scale: 0.4 },
    { gridX: 10, gridY: 9, sprite: 'tree2', scale: 0.35 },
    { gridX: 5, gridY: 1, sprite: 'rock', scale: 0.25 },
    { gridX: 6, gridY: 10, sprite: 'well', scale: 0.3 },
];

let pixel;
let currentBuilding = 'home';
let isMoving = false;

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    preload() {
        // Load spritesheets
        this.load.image('terrain', '/assets/village/Isometric Assets 1.png');
        this.load.image('objects', '/assets/village/Isometric Assets 2.png');
        this.load.image('houses', '/assets/village/Isometric Assets 3.png');
        this.load.image('carts', '/assets/village/Isometric Assets 4.png');
    }

    create() {
        // Center the view
        const centerX = this.cameras.main.width / 2;
        const centerY = 120;

        // Create layers
        this.groundLayer = this.add.container(centerX, centerY);
        this.decorLayer = this.add.container(centerX, centerY);
        this.buildingLayer = this.add.container(centerX, centerY);
        this.characterLayer = this.add.container(centerX, centerY);

        // Draw everything
        this.drawGround();
        this.drawDecorations();
        this.drawBuildings();
        this.createPixel();
        this.createUI();
        this.updateUI();

        // Poll status
        this.time.addEvent({
            delay: 3000,
            callback: () => this.pollStatus(),
            loop: true
        });
    }

    drawGround() {
        // Draw isometric grass tiles
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const iso = cartToIso(x, y);
                
                // Use cropped grass tile from terrain spritesheet
                // For now, draw programmatic tiles with texture
                const tile = this.add.graphics();
                
                // Determine tile type
                const isPath = this.isPathTile(x, y);
                const baseColor = isPath ? 0x8D6E63 : 0x7CB342;
                const darkColor = isPath ? 0x6D4C41 : 0x558B2F;
                
                // Top face
                tile.fillStyle(baseColor, 1);
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.fillPath();
                
                // Add grass texture dots
                if (!isPath) {
                    tile.fillStyle(0x8BC34A, 0.5);
                    for (let i = 0; i < 5; i++) {
                        const dotX = iso.x + (Math.random() - 0.5) * TILE_WIDTH * 0.6;
                        const dotY = iso.y + (Math.random() - 0.5) * TILE_HEIGHT * 0.6;
                        tile.fillCircle(dotX, dotY, 2);
                    }
                }
                
                // Border
                tile.lineStyle(1, darkColor, 0.3);
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.strokePath();
                
                this.groundLayer.add(tile);
            }
        }
    }

    isPathTile(x, y) {
        const pathTiles = [
            [4, 3], [5, 3], [6, 3], [5, 4], [5, 5], [5, 6], [4, 6], [4, 7],
            [6, 4], [7, 4], [7, 5], [7, 6], [8, 5]
        ];
        return pathTiles.some(([px, py]) => px === x && py === y);
    }

    drawDecorations() {
        // Sort by depth
        const sorted = [...DECORATIONS].sort((a, b) => 
            (a.gridX + a.gridY) - (b.gridX + b.gridY)
        );

        sorted.forEach(deco => {
            const iso = cartToIso(deco.gridX, deco.gridY);
            this.drawDecoSprite(iso.x, iso.y, deco.sprite, deco.scale);
        });
    }

    drawDecoSprite(x, y, type, scale) {
        const graphics = this.add.graphics();
        
        switch(type) {
            case 'tree1':
                // Conifer tree
                graphics.fillStyle(0x5D4037, 1);
                graphics.fillRect(x - 8, y - 20, 16, 40);
                graphics.fillStyle(0x33691E, 1);
                graphics.fillTriangle(x, y - 120, x - 50, y - 20, x + 50, y - 20);
                graphics.fillStyle(0x558B2F, 1);
                graphics.fillTriangle(x, y - 100, x - 40, y - 30, x + 40, y - 30);
                graphics.fillStyle(0x689F38, 1);
                graphics.fillTriangle(x, y - 80, x - 30, y - 40, x + 30, y - 40);
                break;
            case 'tree2':
                // Deciduous tree
                graphics.fillStyle(0x5D4037, 1);
                graphics.fillRect(x - 10, y - 30, 20, 50);
                graphics.fillStyle(0x8BC34A, 1);
                graphics.fillCircle(x, y - 70, 50);
                graphics.fillStyle(0x7CB342, 1);
                graphics.fillCircle(x - 25, y - 55, 35);
                graphics.fillCircle(x + 25, y - 55, 35);
                break;
            case 'rock':
                graphics.fillStyle(0x757575, 1);
                graphics.fillCircle(x, y - 15, 25);
                graphics.fillStyle(0x9E9E9E, 1);
                graphics.fillCircle(x - 5, y - 20, 15);
                break;
            case 'well':
                graphics.fillStyle(0x795548, 1);
                graphics.fillRect(x - 20, y - 10, 40, 30);
                graphics.fillStyle(0x5D4037, 1);
                graphics.fillRect(x - 25, y - 40, 10, 35);
                graphics.fillRect(x + 15, y - 40, 10, 35);
                graphics.fillRect(x - 25, y - 45, 50, 8);
                graphics.fillStyle(0x3E2723, 1);
                graphics.fillCircle(x, y, 15);
                break;
        }
        
        this.decorLayer.add(graphics);
    }

    drawBuildings() {
        // Sort by depth
        const sorted = Object.entries(BUILDINGS).sort((a, b) => 
            (a[1].gridX + a[1].gridY) - (b[1].gridX + b[1].gridY)
        );

        sorted.forEach(([key, building]) => {
            const iso = cartToIso(building.gridX, building.gridY);
            
            // Draw building based on sprite type
            const buildingContainer = this.add.container(iso.x, iso.y);
            
            if (building.sprite === 'cart') {
                this.drawCart(buildingContainer);
            } else {
                this.drawHouse(buildingContainer, building.sprite);
            }
            
            this.buildingLayer.add(buildingContainer);

            // Label
            const label = this.add.text(iso.x, iso.y - 150, building.name, {
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            this.buildingLayer.add(label);

            // Clickable area
            const hitArea = this.add.zone(iso.x, iso.y - 60, 120, 150)
                .setInteractive()
                .on('pointerdown', () => this.moveToBuilding(key))
                .on('pointerover', () => {
                    document.body.style.cursor = 'pointer';
                    buildingContainer.setScale(1.05);
                })
                .on('pointerout', () => {
                    document.body.style.cursor = 'default';
                    buildingContainer.setScale(1);
                });
            this.buildingLayer.add(hitArea);
        });
    }

    drawHouse(container, type) {
        const g = this.add.graphics();
        
        // Base/foundation
        g.fillStyle(0x5D4037, 1);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(50, -25);
        g.lineTo(0, -50);
        g.lineTo(-50, -25);
        g.closePath();
        g.fillPath();

        // Front wall
        g.fillStyle(0x8D6E63, 1);
        g.fillRect(-50, -25, 50, -80);
        g.beginPath();
        g.moveTo(-50, -25);
        g.lineTo(-50, -105);
        g.lineTo(0, -130);
        g.lineTo(0, -50);
        g.closePath();
        g.fillPath();

        // Side wall
        g.fillStyle(0x6D4C41, 1);
        g.beginPath();
        g.moveTo(0, -50);
        g.lineTo(0, -130);
        g.lineTo(50, -105);
        g.lineTo(50, -25);
        g.closePath();
        g.fillPath();

        // Roof
        g.fillStyle(0xD84315, 1);
        g.beginPath();
        g.moveTo(0, -160);
        g.lineTo(-60, -105);
        g.lineTo(0, -130);
        g.lineTo(60, -105);
        g.closePath();
        g.fillPath();
        
        // Roof side
        g.fillStyle(0xBF360C, 1);
        g.beginPath();
        g.moveTo(0, -160);
        g.lineTo(60, -105);
        g.lineTo(60, -95);
        g.lineTo(0, -150);
        g.closePath();
        g.fillPath();

        // Door
        g.fillStyle(0x4E342E, 1);
        g.fillRect(-35, -25, 20, -35);
        
        // Window
        g.fillStyle(0x81D4FA, 1);
        g.fillRect(-30, -75, 15, 15);
        g.fillRect(15, -95, 15, 15);

        // Autumn leaves on roof
        if (type === 'house1' || type === 'house2') {
            g.fillStyle(0xFF9800, 0.8);
            [[-30, -135], [-15, -145], [15, -130], [30, -120]].forEach(([lx, ly]) => {
                g.fillCircle(lx, ly, 8);
            });
            g.fillStyle(0xF57C00, 0.8);
            [[-20, -140], [5, -138], [25, -125]].forEach(([lx, ly]) => {
                g.fillCircle(lx, ly, 6);
            });
        }

        container.add(g);
    }

    drawCart(container) {
        const g = this.add.graphics();
        
        // Cart body
        g.fillStyle(0x6D4C41, 1);
        g.beginPath();
        g.moveTo(-30, 0);
        g.lineTo(30, 0);
        g.lineTo(40, -10);
        g.lineTo(40, -35);
        g.lineTo(-40, -35);
        g.lineTo(-40, -10);
        g.closePath();
        g.fillPath();
        
        // Wheels
        g.fillStyle(0x4E342E, 1);
        g.fillCircle(-25, 5, 15);
        g.fillCircle(25, 5, 15);
        g.fillStyle(0x3E2723, 1);
        g.fillCircle(-25, 5, 8);
        g.fillCircle(25, 5, 8);
        
        // Apples in cart
        g.fillStyle(0xC62828, 1);
        [[-20, -40], [-5, -45], [10, -40], [0, -38], [-15, -42], [15, -43]].forEach(([ax, ay]) => {
            g.fillCircle(ax, ay, 8);
        });
        g.fillStyle(0x388E3C, 1);
        [[-20, -48], [0, -52], [12, -48]].forEach(([lx, ly]) => {
            g.fillRect(lx, ly, 3, 5);
        });

        container.add(g);
    }

    createPixel() {
        const building = BUILDINGS[currentBuilding];
        const iso = cartToIso(building.gridX, building.gridY);

        pixel = this.add.container(iso.x, iso.y - 30);

        // Shadow
        const shadow = this.add.ellipse(0, 20, 40, 15, 0x000000, 0.3);
        pixel.add(shadow);

        // Glow
        const glow = this.add.circle(0, 0, 30, 0x00d4ff, 0.15);
        pixel.add(glow);

        // Body
        const body = this.add.graphics();
        
        // Head
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -8, 20);
        
        // Tentacles
        body.fillStyle(0x00a8cc, 1);
        [-16, -8, 0, 8, 16].forEach((x) => {
            body.fillEllipse(x, 12, 7, 16);
        });

        // Eyes
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-8, -10, 7);
        body.fillCircle(8, -10, 7);
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-6, -9, 4);
        body.fillCircle(10, -9, 4);
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-4, -11, 2);
        body.fillCircle(12, -11, 2);

        // Glasses
        body.lineStyle(2, 0x333333, 1);
        body.strokeRoundedRect(-16, -18, 14, 11, 2);
        body.strokeRoundedRect(2, -18, 14, 11, 2);
        body.lineBetween(-2, -12, 2, -12);

        // Smile
        body.lineStyle(2, 0x0288D1, 1);
        body.beginPath();
        body.arc(0, -2, 8, 0.2, Math.PI - 0.2);
        body.strokePath();

        pixel.add(body);
        this.characterLayer.add(pixel);

        // Float animation
        this.tweens.add({
            targets: pixel,
            y: pixel.y - 10,
            duration: 1200,
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
            x: iso.x,
            y: iso.y - 30,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                isMoving = false;
                this.updateUI();
                
                this.tweens.add({
                    targets: pixel,
                    y: pixel.y - 10,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.updateUI();
    }

    createUI() {
        // Title
        this.add.text(this.cameras.main.width / 2, 25, '🏘️ Pixel Village', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#2E7D32',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    updateUI() {
        const building = BUILDINGS[currentBuilding];
        if (building) {
            document.getElementById('location').textContent = building.name;
            document.getElementById('activity').textContent = building.activity;
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

// Config
const config = {
    type: Phaser.AUTO,
    width: 950,
    height: 650,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: VillageScene,
    pixelArt: false
};

new Phaser.Game(config);
