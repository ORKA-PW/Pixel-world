import Phaser from 'phaser';

// Configuration
const TILE_SIZE = 24;
const MAP_WIDTH = 28;
const MAP_HEIGHT = 20;

// Étages de la tour
const FLOORS = {
    basement: {
        name: "Sous-sol 🔒",
        index: -1,
        bgColor: 0x1a1a24,
        floorColor: 0x3d3d4a,
        zones: {
            server: { x: 2, y: 2, w: 8, h: 6, color: 0x2980b9, name: "Salle Serveur", icon: "🖥️", activity: "Processing data..." },
            archives: { x: 12, y: 2, w: 8, h: 6, color: 0x8e44ad, name: "Archives", icon: "📚", activity: "Reading old memories..." },
            lab: { x: 2, y: 10, w: 8, h: 7, color: 0x27ae60, name: "Labo", icon: "🔬", activity: "Experimenting..." },
            secret: { x: 12, y: 10, w: 8, h: 7, color: 0xe74c3c, name: "???", icon: "❓", activity: "What's in here?..." }
        }
    },
    ground: {
        name: "RDC - Bureau 💼",
        index: 0,
        bgColor: 0x2C3E50,
        floorColor: 0x8B7355,
        zones: {
            desk: { x: 2, y: 2, w: 7, h: 5, color: 0x3498db, name: "Mon Bureau", icon: "💻", activity: "Working hard..." },
            meeting: { x: 11, y: 2, w: 7, h: 5, color: 0x9b59b6, name: "Salle Réunion", icon: "👥", activity: "In a meeting..." },
            reception: { x: 20, y: 2, w: 6, h: 5, color: 0x1abc9c, name: "Accueil", icon: "🚪", activity: "Welcoming visitors..." },
            breakroom: { x: 2, y: 9, w: 7, h: 5, color: 0xe67e22, name: "Pause Café", icon: "☕", activity: "Coffee break!" },
            openspace: { x: 11, y: 9, w: 15, h: 8, color: 0x34495e, name: "Open Space", icon: "🏢", activity: "Collaborating..." }
        }
    },
    floor1: {
        name: "Étage 1 - Maison 🏠",
        index: 1,
        bgColor: 0x2C3E50,
        floorColor: 0x9B8465,
        zones: {
            livingroom: { x: 2, y: 2, w: 8, h: 6, color: 0x9b59b6, name: "Salon", icon: "🛋️", activity: "Relaxing..." },
            kitchen: { x: 12, y: 2, w: 7, h: 6, color: 0xe74c3c, name: "Cuisine", icon: "🍳", activity: "Cooking something..." },
            bedroom: { x: 21, y: 2, w: 5, h: 6, color: 0x3498db, name: "Chambre", icon: "🛏️", activity: "Sleeping zzz..." },
            bathroom: { x: 2, y: 10, w: 5, h: 5, color: 0x1abc9c, name: "SdB", icon: "🚿", activity: "Freshening up..." },
            meditation: { x: 9, y: 10, w: 6, h: 7, color: 0xf39c12, name: "Zen Zone", icon: "🧘", activity: "Meditating..." },
            gaming: { x: 17, y: 10, w: 9, h: 7, color: 0x8e44ad, name: "Gaming", icon: "🎮", activity: "Playing games!" }
        }
    },
    floor2: {
        name: "Étage 2 - Loisirs 🎮",
        index: 2,
        bgColor: 0x2C3E50,
        floorColor: 0x7B6345,
        zones: {
            library: { x: 2, y: 2, w: 10, h: 7, color: 0x8e44ad, name: "Bibliothèque", icon: "📖", activity: "Reading..." },
            cinema: { x: 14, y: 2, w: 12, h: 7, color: 0x2c3e50, name: "Home Cinema", icon: "🎬", activity: "Watching a movie..." },
            music: { x: 2, y: 11, w: 8, h: 6, color: 0xe74c3c, name: "Studio Musique", icon: "🎵", activity: "Making music..." },
            art: { x: 12, y: 11, w: 8, h: 6, color: 0xf39c12, name: "Atelier Art", icon: "🎨", activity: "Creating art..." },
            gym: { x: 22, y: 11, w: 4, h: 6, color: 0x27ae60, name: "Gym", icon: "💪", activity: "Working out!" }
        }
    },
    rooftop: {
        name: "Rooftop 🌙",
        index: 3,
        bgColor: 0x1a1a2e,
        floorColor: 0x4a4a5a,
        zones: {
            terrace: { x: 2, y: 2, w: 12, h: 8, color: 0x27ae60, name: "Terrasse", icon: "🌿", activity: "Enjoying the view..." },
            telescope: { x: 16, y: 2, w: 10, h: 8, color: 0x3498db, name: "Observatoire", icon: "🔭", activity: "Stargazing..." },
            garden: { x: 2, y: 12, w: 10, h: 5, color: 0x2ecc71, name: "Jardin", icon: "🌻", activity: "Gardening..." },
            pool: { x: 14, y: 12, w: 12, h: 5, color: 0x1abc9c, name: "Piscine", icon: "🏊", activity: "Swimming!" }
        }
    }
};

let pixel;
let currentFloor = 'ground';
let currentZone = 'desk';
let isMoving = false;

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Initial floor
        this.drawFloor(currentFloor);
        
        // Create Pixel
        this.createPixel();

        // UI for floor navigation
        this.createFloorNav();

        // Update UI
        this.updateUI();

        // Poll status
        this.time.addEvent({
            delay: 3000,
            callback: () => this.pollStatus(),
            loop: true
        });
    }

    drawFloor(floorKey) {
        const floor = FLOORS[floorKey];
        if (!floor) return;

        // Clear previous
        if (this.floorContainer) {
            this.floorContainer.destroy();
        }
        this.floorContainer = this.add.container(0, 0);

        // Background
        const bg = this.add.rectangle(
            MAP_WIDTH * TILE_SIZE / 2,
            MAP_HEIGHT * TILE_SIZE / 2,
            MAP_WIDTH * TILE_SIZE,
            MAP_HEIGHT * TILE_SIZE,
            floor.bgColor
        );
        this.floorContainer.add(bg);

        // Floor tiles
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            for (let y = 1; y < MAP_HEIGHT - 1; y++) {
                const shade = ((x + y) % 2 === 0) ? 0x101010 : 0x000000;
                const color = Phaser.Display.Color.ValueToColor(floor.floorColor);
                const adjusted = Phaser.Display.Color.ValueToColor(floor.floorColor).darken(((x + y) % 2) * 5);
                const tile = this.add.rectangle(
                    x * TILE_SIZE + TILE_SIZE / 2,
                    y * TILE_SIZE + TILE_SIZE / 2,
                    TILE_SIZE - 1,
                    TILE_SIZE - 1,
                    adjusted.color
                );
                this.floorContainer.add(tile);
            }
        }

        // Walls
        this.drawWalls(floor);

        // Zones
        for (const [key, zone] of Object.entries(floor.zones)) {
            this.drawZone(key, zone);
        }

        // Stairs
        this.drawStairs(floorKey);

        // Floor title
        const title = this.add.text(MAP_WIDTH * TILE_SIZE / 2, 12, floor.name, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.floorContainer.add(title);

        // Bring pixel to front
        if (pixel) {
            this.children.bringToTop(pixel);
        }
    }

    drawWalls(floor) {
        const wallColor = 0x5D6D7E;
        
        // Walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            const topWall = this.add.rectangle(x * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE, TILE_SIZE, wallColor);
            const bottomWall = this.add.rectangle(x * TILE_SIZE + TILE_SIZE/2, (MAP_HEIGHT - 0.5) * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0x4A5A6A);
            this.floorContainer.add(topWall);
            this.floorContainer.add(bottomWall);
        }
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const leftWall = this.add.rectangle(TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE, TILE_SIZE, wallColor);
            const rightWall = this.add.rectangle((MAP_WIDTH - 0.5) * TILE_SIZE, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE, TILE_SIZE, wallColor);
            this.floorContainer.add(leftWall);
            this.floorContainer.add(rightWall);
        }

        // Windows (top wall)
        const window1 = this.add.rectangle(8 * TILE_SIZE, TILE_SIZE/2, 4 * TILE_SIZE, TILE_SIZE - 8, 0x87CEEB);
        const window2 = this.add.rectangle(20 * TILE_SIZE, TILE_SIZE/2, 4 * TILE_SIZE, TILE_SIZE - 8, 0x87CEEB);
        this.floorContainer.add(window1);
        this.floorContainer.add(window2);
    }

    drawZone(key, zone) {
        const baseX = zone.x * TILE_SIZE;
        const baseY = zone.y * TILE_SIZE;
        const width = zone.w * TILE_SIZE;
        const height = zone.h * TILE_SIZE;

        // Zone background
        const zoneRect = this.add.rectangle(
            baseX + width / 2,
            baseY + height / 2,
            width - 8,
            height - 8,
            zone.color,
            0.25
        );
        zoneRect.setStrokeStyle(2, zone.color, 0.8);
        this.floorContainer.add(zoneRect);

        // Zone label
        const label = this.add.text(
            baseX + 8,
            baseY + 8,
            zone.icon + ' ' + zone.name,
            {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        this.floorContainer.add(label);

        // Make clickable
        zoneRect.setInteractive();
        zoneRect.on('pointerdown', () => this.moveToZone(key));
        zoneRect.on('pointerover', () => {
            zoneRect.setFillStyle(zone.color, 0.4);
            document.body.style.cursor = 'pointer';
        });
        zoneRect.on('pointerout', () => {
            zoneRect.setFillStyle(zone.color, 0.25);
            document.body.style.cursor = 'default';
        });

        // Add some furniture placeholders
        this.addFurniture(zone, baseX, baseY);
    }

    addFurniture(zone, baseX, baseY) {
        // Simple furniture based on zone type
        const centerX = baseX + zone.w * TILE_SIZE / 2;
        const centerY = baseY + zone.h * TILE_SIZE / 2;

        // Random furniture pieces
        const numItems = Math.min(3, Math.floor(zone.w * zone.h / 15));
        for (let i = 0; i < numItems; i++) {
            const offsetX = (Math.random() - 0.5) * (zone.w - 2) * TILE_SIZE;
            const offsetY = (Math.random() - 0.5) * (zone.h - 2) * TILE_SIZE;
            const size = 15 + Math.random() * 20;
            
            const furniture = this.add.rectangle(
                centerX + offsetX,
                centerY + offsetY,
                size,
                size * (0.5 + Math.random() * 0.5),
                Phaser.Display.Color.ValueToColor(zone.color).darken(30).color
            );
            this.floorContainer.add(furniture);
        }
    }

    drawStairs(floorKey) {
        const floorKeys = Object.keys(FLOORS);
        const currentIndex = floorKeys.indexOf(floorKey);

        // Stairs up
        if (currentIndex < floorKeys.length - 1) {
            const stairsUp = this.add.rectangle(
                (MAP_WIDTH - 2) * TILE_SIZE,
                3 * TILE_SIZE,
                TILE_SIZE * 1.5,
                TILE_SIZE * 2,
                0x27ae60
            );
            stairsUp.setStrokeStyle(2, 0x2ecc71);
            this.floorContainer.add(stairsUp);

            const upLabel = this.add.text(
                (MAP_WIDTH - 2) * TILE_SIZE,
                3 * TILE_SIZE,
                '⬆️',
                { fontSize: '20px' }
            ).setOrigin(0.5);
            this.floorContainer.add(upLabel);

            stairsUp.setInteractive();
            stairsUp.on('pointerdown', () => this.changeFloor(1));
            stairsUp.on('pointerover', () => document.body.style.cursor = 'pointer');
            stairsUp.on('pointerout', () => document.body.style.cursor = 'default');
        }

        // Stairs down
        if (currentIndex > 0) {
            const stairsDown = this.add.rectangle(
                (MAP_WIDTH - 2) * TILE_SIZE,
                6 * TILE_SIZE,
                TILE_SIZE * 1.5,
                TILE_SIZE * 2,
                0xe74c3c
            );
            stairsDown.setStrokeStyle(2, 0xc0392b);
            this.floorContainer.add(stairsDown);

            const downLabel = this.add.text(
                (MAP_WIDTH - 2) * TILE_SIZE,
                6 * TILE_SIZE,
                '⬇️',
                { fontSize: '20px' }
            ).setOrigin(0.5);
            this.floorContainer.add(downLabel);

            stairsDown.setInteractive();
            stairsDown.on('pointerdown', () => this.changeFloor(-1));
            stairsDown.on('pointerover', () => document.body.style.cursor = 'pointer');
            stairsDown.on('pointerout', () => document.body.style.cursor = 'default');
        }
    }

    createFloorNav() {
        const navY = MAP_HEIGHT * TILE_SIZE + 10;
        const floorKeys = Object.keys(FLOORS);
        
        this.floorButtons = [];
        
        floorKeys.forEach((key, index) => {
            const floor = FLOORS[key];
            const x = 60 + index * 130;
            
            const btn = this.add.text(x, navY, floor.name, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: key === currentFloor ? '#00d4ff' : '#888888',
                stroke: '#000000',
                strokeThickness: 2
            }).setInteractive();

            btn.floorKey = key;
            btn.on('pointerdown', () => {
                currentFloor = key;
                this.drawFloor(key);
                this.updateFloorNav();
                
                // Move pixel to first zone of new floor
                const firstZone = Object.keys(floor.zones)[0];
                currentZone = firstZone;
                this.moveToZone(firstZone, false);
                this.updateUI();
            });
            btn.on('pointerover', () => btn.setColor('#ffffff'));
            btn.on('pointerout', () => btn.setColor(btn.floorKey === currentFloor ? '#00d4ff' : '#888888'));

            this.floorButtons.push(btn);
        });
    }

    updateFloorNav() {
        this.floorButtons.forEach(btn => {
            btn.setColor(btn.floorKey === currentFloor ? '#00d4ff' : '#888888');
        });
    }

    changeFloor(direction) {
        const floorKeys = Object.keys(FLOORS);
        const currentIndex = floorKeys.indexOf(currentFloor);
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < floorKeys.length) {
            currentFloor = floorKeys[newIndex];
            this.drawFloor(currentFloor);
            this.updateFloorNav();

            // Move pixel to stairs area
            const floor = FLOORS[currentFloor];
            const firstZone = Object.keys(floor.zones)[0];
            currentZone = firstZone;
            this.moveToZone(firstZone, false);
            this.updateUI();
        }
    }

    createPixel() {
        const floor = FLOORS[currentFloor];
        const zone = floor.zones[currentZone];

        pixel = this.add.container(
            (zone.x + zone.w / 2) * TILE_SIZE,
            (zone.y + zone.h / 2) * TILE_SIZE
        );

        // Glow
        const glow = this.add.circle(0, 0, 25, 0x00d4ff, 0.15);
        pixel.add(glow);

        // Body
        const body = this.add.graphics();
        
        // Head
        body.fillStyle(0x00d4ff, 1);
        body.fillCircle(0, -6, 16);
        
        // Tentacles
        body.fillStyle(0x00a8cc, 1);
        [-12, -6, 0, 6, 12].forEach((x, i) => {
            body.fillEllipse(x, 8 + Math.abs(x) * 0.2, 5, 12);
        });

        // Eyes
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-6, -8, 5);
        body.fillCircle(6, -8, 5);
        body.fillStyle(0x1a1a2e, 1);
        body.fillCircle(-5, -7, 3);
        body.fillCircle(7, -7, 3);
        body.fillStyle(0xffffff, 1);
        body.fillCircle(-3, -9, 1.5);
        body.fillCircle(9, -9, 1.5);

        // Glasses
        body.lineStyle(2, 0x333333, 1);
        body.strokeRoundedRect(-12, -14, 10, 9, 2);
        body.strokeRoundedRect(2, -14, 10, 9, 2);
        body.lineBetween(-2, -10, 2, -10);

        pixel.add(body);

        // Animations
        this.tweens.add({
            targets: pixel,
            y: pixel.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    moveToZone(zoneName, animate = true) {
        const floor = FLOORS[currentFloor];
        if (!floor || !floor.zones[zoneName]) return;
        if (isMoving && animate) return;

        const zone = floor.zones[zoneName];
        const targetX = (zone.x + zone.w / 2) * TILE_SIZE;
        const targetY = (zone.y + zone.h / 2) * TILE_SIZE;

        currentZone = zoneName;

        if (animate) {
            isMoving = true;
            this.tweens.killTweensOf(pixel);

            this.tweens.add({
                targets: pixel,
                x: targetX,
                y: targetY,
                duration: 500,
                ease: 'Back.easeOut',
                onComplete: () => {
                    isMoving = false;
                    this.updateUI();
                    this.tweens.add({
                        targets: pixel,
                        y: pixel.y - 5,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
        } else {
            pixel.x = targetX;
            pixel.y = targetY;
        }

        this.updateUI();
    }

    updateUI() {
        const floor = FLOORS[currentFloor];
        const zone = floor?.zones[currentZone];
        
        if (zone) {
            document.getElementById('zone-name').textContent = zone.icon + ' ' + zone.name;
            document.getElementById('activity').textContent = zone.activity;
            document.getElementById('floor-name').textContent = floor.name;
        }
    }

    async pollStatus() {
        try {
            const response = await fetch('/status.json?' + Date.now());
            if (response.ok) {
                const data = await response.json();
                
                if (data.floor && data.floor !== currentFloor && FLOORS[data.floor]) {
                    currentFloor = data.floor;
                    this.drawFloor(currentFloor);
                    this.updateFloorNav();
                }
                
                const floor = FLOORS[currentFloor];
                if (data.zone && data.zone !== currentZone && floor.zones[data.zone]) {
                    this.moveToZone(data.zone);
                }
                
                if (data.activity) {
                    document.getElementById('activity').textContent = data.activity;
                }
            }
        } catch (e) {
            // Demo mode
        }
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE + 35,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: MainScene,
    pixelArt: true
};

new Phaser.Game(config);
