import Phaser from 'phaser';

// Isometric configuration
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MAP_SIZE = 20;

function cartToIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// Village buildings - optimized layout
const BUILDINGS = {
    myHome: { gridX: 6, gridY: 6, type: 'smallHouse', name: "🏠 Ma Maison", activity: "Home sweet home..." },
    neighbor1: { gridX: 10, gridY: 5, type: 'smallHouse', name: "🏡 Voisin", activity: "Visiting..." },
    neighbor2: { gridX: 6, gridY: 10, type: 'mediumHouse', name: "🏡 Voisine", activity: "Chatting..." },
    tavern: { gridX: 13, gridY: 8, type: 'largeHouse', name: "🍺 Taverne", activity: "Having a drink..." },
    shop: { gridX: 10, gridY: 12, type: 'mediumHouse', name: "🏪 Boutique", activity: "Shopping..." },
    library: { gridX: 14, gridY: 13, type: 'largeHouse', name: "📚 Bibliothèque", activity: "Reading..." },
    well: { gridX: 9, gridY: 8, type: 'well', name: "⛲ Puits", activity: "Getting water..." },
    tent: { gridX: 4, gridY: 13, type: 'tent', name: "⛺ Campement", activity: "Resting..." },
};

// Trees - forest border
const TREES = [
    // Top edge
    { gridX: 3, gridY: 2, type: 'autumnTree' },
    { gridX: 5, gridY: 1, type: 'greenTree' },
    { gridX: 8, gridY: 2, type: 'autumnTree' },
    { gridX: 12, gridY: 1, type: 'greenTree' },
    { gridX: 15, gridY: 2, type: 'autumnTree' },
    // Left edge
    { gridX: 2, gridY: 4, type: 'greenTree' },
    { gridX: 1, gridY: 7, type: 'autumnTree' },
    { gridX: 2, gridY: 11, type: 'greenTree' },
    { gridX: 1, gridY: 15, type: 'autumnTree' },
    // Right edge
    { gridX: 17, gridY: 4, type: 'greenTree' },
    { gridX: 18, gridY: 7, type: 'autumnTree' },
    { gridX: 17, gridY: 11, type: 'greenTree' },
    { gridX: 18, gridY: 15, type: 'autumnTree' },
    // Bottom edge
    { gridX: 5, gridY: 17, type: 'greenTree' },
    { gridX: 9, gridY: 18, type: 'autumnTree' },
    { gridX: 13, gridY: 17, type: 'greenTree' },
];

// Decorations
const DECORATIONS = [
    // Rocks scattered
    { gridX: 4, gridY: 3, type: 'rockLarge' },
    { gridX: 16, gridY: 5, type: 'rockMedium' },
    { gridX: 16, gridY: 12, type: 'rockSmall' },
    { gridX: 3, gridY: 14, type: 'rockMedium' },
    // Stumps
    { gridX: 6, gridY: 3, type: 'stump' },
    { gridX: 14, gridY: 3, type: 'stump' },
    // Bushes and grass
    { gridX: 8, gridY: 4, type: 'bush' },
    { gridX: 14, gridY: 6, type: 'bush' },
    { gridX: 7, gridY: 14, type: 'bush' },
    { gridX: 16, gridY: 8, type: 'tallGrass' },
    { gridX: 3, gridY: 9, type: 'tallGrass' },
    { gridX: 12, gridY: 16, type: 'tallGrass' },
    // Props near buildings
    { gridX: 7, gridY: 7, type: 'barrel' },
    { gridX: 11, gridY: 6, type: 'crate' },
    { gridX: 14, gridY: 9, type: 'barrel' },
    { gridX: 11, gridY: 13, type: 'crate' },
    // Flower pots
    { gridX: 7, gridY: 5, type: 'flowerPot' },
    { gridX: 11, gridY: 11, type: 'flowerPot' },
    // Cart with apples - market area
    { gridX: 11, gridY: 10, type: 'cartApples' },
    // Lamps along path
    { gridX: 8, gridY: 8, type: 'lamp' },
    { gridX: 12, gridY: 8, type: 'lamp' },
    { gridX: 10, gridY: 14, type: 'lamp' },
];

let pixel, currentBuilding = 'myHome', isMoving = false;

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    preload() {
        const base = import.meta.env.BASE_URL || '/';
        
        // Buildings
        this.load.image('smallHouse', `${base}assets/sprites/smallHouse.png`);
        this.load.image('mediumHouse', `${base}assets/sprites/mediumHouse.png`);
        this.load.image('largeHouse', `${base}assets/sprites/largeHouse.png`);
        this.load.image('well', `${base}assets/sprites/well.png`);
        this.load.image('tent', `${base}assets/sprites/tent.png`);
        
        // Trees
        this.load.image('autumnTree', `${base}assets/sprites/autumnTree.png`);
        this.load.image('greenTree', `${base}assets/sprites/greenTree.png`);
        
        // Decorations
        this.load.image('rockLarge', `${base}assets/sprites/rockLarge.png`);
        this.load.image('rockMedium', `${base}assets/sprites/rockMedium.png`);
        this.load.image('rockSmall', `${base}assets/sprites/rockSmall.png`);
        this.load.image('barrel', `${base}assets/sprites/barrel.png`);
        this.load.image('crate', `${base}assets/sprites/crate.png`);
        this.load.image('stump', `${base}assets/sprites/stump.png`);
        this.load.image('bush', `${base}assets/sprites/bush.png`);
        this.load.image('tallGrass', `${base}assets/sprites/tallGrass.png`);
        this.load.image('flowerPot', `${base}assets/sprites/flowerPot.png`);
        this.load.image('cartApples', `${base}assets/sprites/cartApples.png`);
        this.load.image('lamp', `${base}assets/sprites/lamp.png`);
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.cameras.main.setZoom(0.95);
        
        const centerX = 650, centerY = 0;
        
        this.groundLayer = this.add.container(centerX, centerY);
        this.objectLayer = this.add.container(centerX, centerY);

        this.drawGround();
        this.drawAllObjects();
        this.createPixel();
        this.createUI();
        this.updateUI();

        this.cameras.main.startFollow(pixel, true, 0.08, 0.08);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.time.addEvent({ delay: 3000, callback: () => this.pollStatus(), loop: true });
    }

    drawGround() {
        // Draw grass tiles
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const iso = cartToIso(x, y);
                const tile = this.add.graphics();
                
                const colors = [0x7CB342, 0x8BC34A, 0x689F38, 0x6B8E23, 0x7CB342];
                tile.fillStyle(colors[(x * 3 + y * 7) % 5], 1);
                
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.fillPath();
                
                tile.lineStyle(1, 0x558B2F, 0.08);
                tile.strokePath();
                
                this.groundLayer.add(tile);
            }
        }

        // Draw paths - village roads
        const pathTiles = [
            // Main horizontal road
            ...Array.from({length: 10}, (_, i) => [6 + i, 8]),
            // Vertical paths
            ...Array.from({length: 3}, (_, i) => [6, 6 + i]),
            ...Array.from({length: 3}, (_, i) => [10, 6 + i]),
            ...Array.from({length: 6}, (_, i) => [14, 8 + i]),
            ...Array.from({length: 5}, (_, i) => [10, 9 + i]),
            // Path to tent
            ...Array.from({length: 6}, (_, i) => [4 + i, 13]),
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

    drawAllObjects() {
        // Combine all objects for depth sorting
        const allObjects = [
            ...Object.entries(BUILDINGS).map(([key, b]) => ({ ...b, key, category: 'building' })),
            ...TREES.map((t, i) => ({ ...t, key: `tree_${i}`, category: 'tree' })),
            ...DECORATIONS.map((d, i) => ({ ...d, key: `deco_${i}`, category: 'deco' })),
        ];
        
        // Sort by depth
        allObjects.sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
        
        allObjects.forEach(obj => {
            const iso = cartToIso(obj.gridX, obj.gridY);
            
            if (obj.category === 'building') {
                this.drawBuilding(obj, iso);
            } else if (obj.category === 'tree') {
                this.drawTree(obj, iso);
            } else {
                this.drawDecoration(obj, iso);
            }
        });
    }

    drawBuilding(building, iso) {
        const sprite = this.add.image(iso.x, iso.y, building.type);
        
        const scales = {
            smallHouse: 0.18,
            mediumHouse: 0.18,
            largeHouse: 0.16,
            well: 0.28,
            tent: 0.22
        };
        sprite.setScale(scales[building.type] || 0.18);
        sprite.setOrigin(0.5, 1);
        
        this.objectLayer.add(sprite);
        
        // Add smoke animation to tavern
        if (building.type === 'largeHouse' && building.name.includes('Taverne')) {
            this.createSmoke(iso.x + 20, iso.y - 140);
        }

        // Label
        const labelOffsets = {
            well: -45,
            tent: -80,
            smallHouse: -120,
            mediumHouse: -125,
            largeHouse: -135
        };
        const labelY = labelOffsets[building.type] || -120;
        
        const label = this.add.text(iso.x, iso.y + labelY, building.name, {
            fontSize: '11px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#222222',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.objectLayer.add(label);

        // Clickable
        const hitHeights = { well: 70, tent: 100 };
        const hitHeight = hitHeights[building.type] || 150;
        
        const hitArea = this.add.zone(iso.x, iso.y - hitHeight/2, 100, hitHeight)
            .setInteractive()
            .on('pointerdown', () => this.moveToBuilding(building.key))
            .on('pointerover', () => {
                document.body.style.cursor = 'pointer';
                sprite.setTint(0xdddddd);
            })
            .on('pointerout', () => {
                document.body.style.cursor = 'default';
                sprite.clearTint();
            });
        this.objectLayer.add(hitArea);
    }

    drawTree(tree, iso) {
        const sprite = this.add.image(iso.x, iso.y, tree.type);
        sprite.setScale(0.16);
        sprite.setOrigin(0.5, 1);
        this.objectLayer.add(sprite);
    }

    createSmoke(x, y) {
        // Create simple smoke puffs
        const createPuff = () => {
            const puff = this.add.circle(x + Phaser.Math.Between(-5, 5), y, Phaser.Math.Between(4, 8), 0x666666, 0.5);
            this.objectLayer.add(puff);
            
            this.tweens.add({
                targets: puff,
                y: y - 50,
                alpha: 0,
                scale: 2,
                duration: 2000,
                ease: 'Sine.easeOut',
                onComplete: () => puff.destroy()
            });
        };
        
        // Emit smoke periodically
        this.time.addEvent({
            delay: 800,
            callback: createPuff,
            loop: true
        });
        createPuff(); // Initial puff
    }

    drawDecoration(deco, iso) {
        const sprite = this.add.image(iso.x, iso.y, deco.type);
        
        const scales = {
            rockLarge: 0.35,
            rockMedium: 0.30,
            rockSmall: 0.25,
            barrel: 0.30,
            crate: 0.28,
            stump: 0.25,
            bush: 0.30,
            tallGrass: 0.28,
            flowerPot: 0.25,
            cartApples: 0.22,
            lamp: 0.30
        };
        sprite.setScale(scales[deco.type] || 0.25);
        sprite.setOrigin(0.5, 1);
        this.objectLayer.add(sprite);
    }

    createPixel() {
        const building = BUILDINGS[currentBuilding];
        const iso = cartToIso(building.gridX, building.gridY);

        pixel = this.add.container(iso.x + 650, iso.y);

        // Shadow
        const shadow = this.add.ellipse(0, 26, 55, 22, 0x000000, 0.3);
        pixel.add(shadow);

        // Glow effect
        const glow = this.add.circle(0, 0, 42, 0x00d4ff, 0.12);
        pixel.add(glow);

        // Body
        const body = this.add.graphics();
        
        // Main blob
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -16, 34);
        
        // Tentacles
        body.fillStyle(0x00a8cc, 1);
        [-28, -14, 0, 14, 28].forEach(x => body.fillEllipse(x, 26, 14, 30));

        // Eyes
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-14, -20, 14);
        body.fillCircle(14, -20, 14);
        
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-12, -18, 7);
        body.fillCircle(16, -18, 7);
        
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-10, -21, 3);
        body.fillCircle(18, -21, 3);

        // Glasses
        body.lineStyle(4, 0x333333, 1);
        body.strokeRoundedRect(-28, -34, 22, 20, 4);
        body.strokeRoundedRect(6, -34, 22, 20, 4);
        body.lineBetween(-6, -24, 6, -24);

        // Smile
        body.lineStyle(3, 0x0077aa, 1);
        body.beginPath();
        body.arc(0, -8, 18, 0.25, Math.PI - 0.25);
        body.strokePath();

        pixel.add(body);

        // Float animation
        this.tweens.add({
            targets: pixel,
            y: pixel.y - 18,
            duration: 1500,
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
            x: iso.x + 650,
            y: iso.y,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                isMoving = false;
                this.tweens.add({
                    targets: pixel,
                    y: pixel.y - 18,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        this.updateUI();
    }

    createUI() {
        this.add.text(10, 10, '🏘️ Pixel Village', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#2E7D32',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        this.add.text(10, 38, '↑↓←→ Explorer | Clic = Se déplacer', {
            fontSize: '11px',
            fontFamily: 'Arial, sans-serif',
            color: '#555555'
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
        const speed = 10;
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
