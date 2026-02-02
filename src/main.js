import Phaser from 'phaser';

// Isometric configuration
const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const MAP_SIZE = 18;

function cartToIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2),
        y: (x + y) * (TILE_HEIGHT / 2)
    };
}

// Village buildings
const BUILDINGS = {
    myHome: { gridX: 4, gridY: 4, type: 'smallHouse', name: "🏠 Ma Maison", activity: "Home sweet home..." },
    neighbor1: { gridX: 8, gridY: 3, type: 'smallHouse', name: "🏡 Voisin", activity: "Visiting..." },
    neighbor2: { gridX: 4, gridY: 8, type: 'mediumHouse', name: "🏡 Voisine", activity: "Chatting..." },
    tavern: { gridX: 11, gridY: 6, type: 'largeHouse', name: "🍺 Taverne", activity: "Having a drink..." },
    shop: { gridX: 8, gridY: 10, type: 'mediumHouse', name: "🏪 Boutique", activity: "Shopping..." },
    library: { gridX: 13, gridY: 10, type: 'largeHouse', name: "📚 Bibliothèque", activity: "Reading..." },
    well: { gridX: 7, gridY: 6, type: 'well', name: "⛲ Puits", activity: "Getting water..." },
};

// Trees - deterministic placement
const DECORATIONS = [];
const treePositions = [
    [2, 2], [3, 1], [1, 5], [2, 11], [5, 13], [6, 1],
    [10, 2], [13, 3], [15, 7], [15, 3], [14, 13], [3, 14],
    [10, 14], [16, 11], [1, 9], [14, 1]
];
treePositions.forEach(([x, y], i) => {
    DECORATIONS.push({ gridX: x, gridY: y, type: i % 3 === 0 ? 'greenTree' : 'autumnTree' });
});

let pixel, currentBuilding = 'myHome', isMoving = false;

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    preload() {
        // Load individual cropped sprites
        // Use relative path or base URL for Vite compatibility
        const base = import.meta.env.BASE_URL || '/';
        this.load.image('smallHouse', `${base}assets/sprites/smallHouse.png`);
        this.load.image('mediumHouse', `${base}assets/sprites/mediumHouse.png`);
        this.load.image('largeHouse', `${base}assets/sprites/largeHouse.png`);
        this.load.image('well', `${base}assets/sprites/well.png`);
        this.load.image('autumnTree', `${base}assets/sprites/autumnTree.png`);
        this.load.image('greenTree', `${base}assets/sprites/greenTree.png`);
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.cameras.main.setZoom(1.4);
        
        const centerX = 500, centerY = 20;
        
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
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const iso = cartToIso(x, y);
                const tile = this.add.graphics();
                
                const colors = [0x7CB342, 0x8BC34A, 0x689F38, 0x6B8E23];
                tile.fillStyle(colors[(x * 3 + y * 7) % 4], 1);
                
                tile.beginPath();
                tile.moveTo(iso.x, iso.y - TILE_HEIGHT / 2);
                tile.lineTo(iso.x + TILE_WIDTH / 2, iso.y);
                tile.lineTo(iso.x, iso.y + TILE_HEIGHT / 2);
                tile.lineTo(iso.x - TILE_WIDTH / 2, iso.y);
                tile.closePath();
                tile.fillPath();
                
                tile.lineStyle(1, 0x558B2F, 0.1);
                tile.strokePath();
                
                this.groundLayer.add(tile);
            }
        }

        // Paths
        const pathTiles = [
            ...Array.from({length: 9}, (_, i) => [4 + i, 6]),
            ...Array.from({length: 3}, (_, i) => [4, 4 + i]),
            ...Array.from({length: 5}, (_, i) => [13, 6 + i]),
            ...Array.from({length: 4}, (_, i) => [8, 7 + i]),
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
        // Combine and sort by depth
        const allObjects = [
            ...Object.entries(BUILDINGS).map(([key, b]) => ({ ...b, key, isBuilding: true })),
            ...DECORATIONS.map((d, i) => ({ ...d, key: `tree_${i}`, isBuilding: false }))
        ];
        
        allObjects.sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
        
        allObjects.forEach(obj => {
            const iso = cartToIso(obj.gridX, obj.gridY);
            
            if (obj.isBuilding) {
                this.drawBuilding(obj, iso);
            } else {
                this.drawTree(obj, iso);
            }
        });
    }

    drawBuilding(building, iso) {
        const sprite = this.add.image(iso.x, iso.y, building.type);
        
        const scales = {
            smallHouse: 0.20,
            mediumHouse: 0.20,
            largeHouse: 0.18,
            well: 0.32
        };
        sprite.setScale(scales[building.type] || 0.20);
        sprite.setOrigin(0.5, 1);
        
        this.objectLayer.add(sprite);

        // Label
        const labelY = building.type === 'well' ? -50 : -140;
        const label = this.add.text(iso.x, iso.y + labelY, building.name, {
            fontSize: '11px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#222222',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.objectLayer.add(label);

        // Clickable
        const hitHeight = building.type === 'well' ? 80 : 160;
        const hitArea = this.add.zone(iso.x, iso.y - hitHeight/2, 100, hitHeight)
            .setInteractive()
            .on('pointerdown', () => this.moveToBuilding(building.key))
            .on('pointerover', () => {
                document.body.style.cursor = 'pointer';
                sprite.setTint(0xcccccc);
            })
            .on('pointerout', () => {
                document.body.style.cursor = 'default';
                sprite.clearTint();
            });
        this.objectLayer.add(hitArea);
    }

    drawTree(deco, iso) {
        const tree = this.add.image(iso.x, iso.y, deco.type);
        tree.setScale(0.18);
        tree.setOrigin(0.5, 1);
        this.objectLayer.add(tree);
    }

    createPixel() {
        const building = BUILDINGS[currentBuilding];
        const iso = cartToIso(building.gridX, building.gridY);

        pixel = this.add.container(iso.x + 500, iso.y + 20);

        // Shadow
        const shadow = this.add.ellipse(0, 24, 50, 20, 0x000000, 0.3);
        pixel.add(shadow);

        // Glow
        const glow = this.add.circle(0, 0, 38, 0x00d4ff, 0.12);
        pixel.add(glow);

        // Body
        const body = this.add.graphics();
        
        // Main blob
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -14, 30);
        
        // Tentacles
        body.fillStyle(0x00a8cc, 1);
        [-24, -12, 0, 12, 24].forEach(x => body.fillEllipse(x, 22, 12, 26));

        // Eyes
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-12, -18, 12);
        body.fillCircle(12, -18, 12);
        
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-10, -16, 6);
        body.fillCircle(14, -16, 6);
        
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-8, -19, 3);
        body.fillCircle(16, -19, 3);

        // Glasses
        body.lineStyle(3, 0x333333, 1);
        body.strokeRoundedRect(-24, -30, 20, 18, 3);
        body.strokeRoundedRect(4, -30, 20, 18, 3);
        body.lineBetween(-4, -21, 4, -21);

        // Smile
        body.lineStyle(3, 0x0077aa, 1);
        body.beginPath();
        body.arc(0, -6, 15, 0.3, Math.PI - 0.3);
        body.strokePath();

        pixel.add(body);

        // Float
        this.tweens.add({
            targets: pixel,
            y: pixel.y - 15,
            duration: 1400,
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
            x: iso.x + 500,
            y: iso.y + 20,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                isMoving = false;
                this.tweens.add({
                    targets: pixel,
                    y: pixel.y - 15,
                    duration: 1400,
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
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#2E7D32',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        this.add.text(10, 35, '↑↓←→ Explorer | Clic = Se déplacer', {
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
