window.onload = function() {
// Game Configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        physics: {
            default: 'arcade'
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    const game = new Phaser.Game(config);

    // Game variables
    let words = [];
    let currentInput = '';
    let score = 0;
    let lives = 3;
    let level = 1;
    let spawnTimer;
    let scoreText;
    let livesText;
    let levelText;
    let inputText;
    let isFrozen = false;
    let freezeTimer = null;

    // Power-up collection system
    let collectedPowerUps = []; // Array to store collected power-ups (max 3)
    let powerUpSlots = []; // Visual slots for power-ups

    // Word list
    let wordList = [
        'pixel', 'retro', 'arcade', 'game', 'code', 'type', 'fast', 'score',
        'combo', 'power', 'blast', 'shield',
        'speed', 'laser', 'burst', 'storm', 'thunder', 'freeze', 'boost'
    ];

    function preload() {
        // PLACEHOLDER: Load your assets here
    }

    function create() {
        // PLACEHOLDER: Add background image
        // this.add.image(400, 300, 'background');

        const graphics = this.add.graphics();

        //Left - ENTIRE side panel
        graphics.lineStyle(3, 0x00ffff, 1); // Cyan outline
        graphics.strokeRect(0, 0, 200, 800); // x, y, width, height

        // Left - powerup section
        graphics.lineStyle(3, 0xffff00, 1); // Cyan outline
        graphics.strokeRect(20, 20, 160, 250); // x, y, width, height
        
        // Left - lives section
        graphics.lineStyle(3, 0xff00ff, 1); // Cyan outline
        graphics.strokeRect(20, 350, 160, 400); // x, y, width, height

        //Right - ENTIRE panel
        graphics.lineStyle(3, 0xffff00, 1); // Yellow outline
        graphics.strokeRect(600, 0, 200, 800);

        //Right - Level section
        graphics.lineStyle(3, 0x00ffff, 1);
        graphics.strokeRect(620, 20, 160, 50);

        //Right - Score section
        graphics.lineStyle(3, 0xff00ff, 1);
        graphics.strokeRect(620, 100, 160, 50);

        //Right - Typing speed section (KIV)
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.strokeRect(620, 180, 160, 50);

        //Right - Menu button
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.strokeRect(640, 700, 40, 40);

        //Right - Settings(?) button
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.strokeRect(720, 700, 40, 40);

        //middle - play area outline (where words fall)
        graphics.lineStyle(3, 0xff00ff, 1);
        graphics.strokeRect(200, 60, 400, 690);
        
        // middle - Input area outline (bottom)
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.strokeRect(250, 700, 300, 50);
        
        // Title
        this.add.text(400, 30, 'Typing Caster', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        for (let i = 0; i < 6; i++) {
            const y = 245 - (i * 40);  // Start from bottom, go up
            
            // Slot background
            const slotBg = this.add.rectangle(100, y, 150, 35, 0x2a2a2a);
            slotBg.setStrokeStyle(2, 0x555555);
            
            // Slot text (initially hidden)
            const slotText = this.add.text(100, y, '', {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            slotText.setVisible(false);  // Hide initially
            
            powerUpSlots.push({
                bg: slotBg,
                text: slotText,
                filled: false
            });
        }

        // Score display
        scoreText = this.add.text(620, 100, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });

        // Lives display
        livesText = this.add.text(20, 350, 'LIVES: 0%', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ff0000'
        });

        // Level display
        levelText = this.add.text(620, 20, 'LEVEL: 1', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });

        // Current input display
        inputText = this.add.text(400, 725, '', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Keyboard input listener
        this.input.keyboard.on('keydown', (event) => {
            handleKeyPress.call(this, event);
        });

        // Start spawning words
        spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: spawnWord,
            callbackScope: this,
            loop: true
        });

        // Spawn first word immediately
        spawnWord.call(this);
    }

    function update(time, delta) {
        // Update falling words (skip if frozen)
        if (!isFrozen) {
            words.forEach((wordObj, index) => {
                wordObj.y += wordObj.speed;
                wordObj.container.setY(wordObj.y);  // Move container, not text

                // Check if word reached bottom
                if (wordObj.y > 730) {
                    loseLife.call(this);
                    removeWord.call(this, index);
                }
            });
        }
    }

    function spawnWord() {
        const word = wordList[Math.floor(Math.random() * wordList.length)];
        
        const types = [
            { name: 'normal', color: '#ffffff' },
            { name: 'fire', color: '#ff4444' },
            { name: 'ice', color: '#4444ff' },
            { name: 'heal', color: '#44ff44' },
            { name: 'slow', color: '#ff44ff' }
        ];
        
        const rand = Math.random();
        let type;
        if (rand < 0.7) {
            type = types[0];
        } else {
            type = types[Math.floor(Math.random() * 4) + 1];
        }

        const x = Phaser.Math.Between(260, 540);
        const y = 70;

        // Create a container to hold background and text
        const container = this.add.container(x, y);

        // Create rectangle background
        const textBg = this.add.rectangle(0, 0, 80, 30, 0x000000, 0.5);
        textBg.setStrokeStyle(2, parseInt(type.color.replace('#', '0x')));

        // Create TWO text objects for highlighting
        const typedText = this.add.text(0, 0, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#fff200ff',  // Yellow for typed portion
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);

        const untypedText = this.add.text(0, 0, word, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: type.color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);

        // Position them to align properly
        const fullWidth = untypedText.width;
        typedText.setX(-fullWidth / 2);
        untypedText.setX(-fullWidth / 2);

        // Add to container
        container.add([textBg, typedText, untypedText]);

        words.push({
            container: container,
            typedText: typedText,
            untypedText: untypedText,
            word: word,
            x: x,
            y: y,
            speed: 0.5 + (level * 0.1),
            type: type.name,
            matchedLength: 0  // Track how many letters match
        });
    }

    function handleKeyPress(event) {
        const key = event.key;

        if (key === 'Backspace') {
            currentInput = currentInput.slice(0, -1);
            inputText.setText(currentInput);
            updateWordHighlights.call(this);
            return;
        }

        if (key === 'Enter') {
            checkWord.call(this);
            return;
        }

        if (key.length === 1 && key.match(/[a-z]/i)) {
            currentInput += key.toLowerCase();
            inputText.setText(currentInput);
            updateWordHighlights.call(this);
        }
    }

    function updateWordHighlights() {
        words.forEach(wordObj => {
            const word = wordObj.word;
            let matchedLength = 0;

            // Check if current input matches the beginning of this word
            if (currentInput.length > 0 && word.startsWith(currentInput)) {
                matchedLength = currentInput.length;
            }

            // Update the typed (green) and untyped portions
            const typedPortion = word.substring(0, matchedLength);
            const untypedPortion = word.substring(matchedLength);

            wordObj.typedText.setText(typedPortion);
            wordObj.untypedText.setText(untypedPortion);

            // Reposition untyped text to follow typed text
            const fullWidth = wordObj.typedText.width + wordObj.untypedText.width;
            wordObj.typedText.setX(-fullWidth / 2);
            wordObj.untypedText.setX(-fullWidth / 2 + wordObj.typedText.width);

            wordObj.matchedLength = matchedLength;
        });
    }

    function checkWord() {
        if (currentInput === '') return;

        let foundMatch = false;
        for (let i = 0; i < words.length; i++) {
            if (words[i].word === currentInput) {
                handleCorrectWord.call(this, i);
                foundMatch = true;
                currentInput = '';
                inputText.setText('');
                updateWordHighlights.call(this);
                break;
            }
        }

        // If no match found, shake the camera + DON'T clear input
        if (!foundMatch) {
            this.cameras.main.shake(300, 0.01);
        }
    }

    // Collects power-ups instead of using them immediately
    function handleCorrectWord(index) {
        const wordObj = words[index];
        let points = 10;
        
        // NEW: Check if it's a power-up word and collect it
        if (wordObj.type !== 'normal') {
            // Collect the power-up (max 5)
            if (collectedPowerUps.length < 6) {
                collectedPowerUps.push(wordObj.type);
                updatePowerUpDisplay.call(this);
            }
            
            // Power-up points
            switch(wordObj.type) {
                case 'fire':
                    points = 50;
                    break;
                case 'ice':
                    points = 30;
                    break;
                case 'heal':
                    points = 15;
                    break;
                case 'slow':
                    points = 25;
                    break;
            }
        }
        
        score += points;
        scoreText.setText('SCORE: ' + score);

        createExplosion.call(this, wordObj.x, wordObj.y, wordObj.type);
        removeWord.call(this, index);

        if (score > 0 && score % 100 === 0) {
            levelUp.call(this);
        }
    }

    // Update the visual power-up slots
    function updatePowerUpDisplay() {
        for (let i = 0; i < 6; i++) {
            if (i < collectedPowerUps.length) {
                const powerType = collectedPowerUps[i];
                const colors = {
                    'fire': { color: 0xff4444, text: '#ffffff', name: 'FIRE' },
                    'ice': { color: 0x4444ff, text: '#ffffff', name: 'ICE' },
                    'heal': { color: 0x44ff44, text: '#ffffff', name: 'HEAL' },
                    'slow': { color: 0xff44ff, text: '#ffffff', name: 'SLOW' }
                };
                
                // Fill with power-up color
                powerUpSlots[i].bg.setFillStyle(colors[powerType].color);
                powerUpSlots[i].bg.setStrokeStyle(2, colors[powerType].color);
                
                // Show text with power-up name
                powerUpSlots[i].text.setText(colors[powerType].name);
                powerUpSlots[i].text.setColor(colors[powerType].text);
                powerUpSlots[i].text.setVisible(true);
                powerUpSlots[i].filled = true;
            } else {
                // Empty slot - dark gray
                powerUpSlots[i].bg.setFillStyle(0x2a2a2a);
                powerUpSlots[i].bg.setStrokeStyle(2, 0x555555);
                powerUpSlots[i].text.setVisible(false);
                powerUpSlots[i].filled = false;
            }
        }
    }

    // NEW: Use a collected power-up
    function usePowerUp(powerType) {
        switch(powerType) {
            case 'fire':
                clearAllWords.call(this);
                break;
            case 'ice':
                freezeWords.call(this);
                break;
            case 'heal':
                if (lives < 3) {
                    lives++;
                    livesText.setText('LIVES: ' + lives);
                }
                break;
            case 'slow':
                slowDownWords.call(this);
                break;
        }
    }

    function clearAllWords() {
        const currentWords = [...words];
        currentWords.forEach((wordObj, index) => {
            createExplosion.call(this, wordObj.x, wordObj.y, 'fire');
            removeWord.call(this, index);
        });
        score += currentWords.length * 5;
        scoreText.setText('SCORE: ' + score);
    }

    function freezeWords() {
        isFrozen = true;
        
        words.forEach(wordObj => {
            wordObj.text.setTint(0x4444ff);
        });
        
        if (freezeTimer) {
            freezeTimer.remove();
        }
        
        freezeTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
                isFrozen = false;
                words.forEach(wordObj => {
                    wordObj.text.clearTint();
                });
            },
            callbackScope: this
        });
    }

    function slowDownWords() {
        const originalSpeeds = words.map(w => w.speed);
        
        words.forEach(wordObj => {
            wordObj.speed *= 0.5;
            wordObj.text.setTint(0xff44ff);
        });
        
        this.time.addEvent({
            delay: 5000,
            callback: () => {
                words.forEach((wordObj, index) => {
                    if (wordObj && originalSpeeds[index]) {
                        wordObj.speed = originalSpeeds[index];
                        wordObj.text.clearTint();
                    }
                });
            },
            callbackScope: this
        });
    }

    function createExplosion(x, y, type) {
        const colors = {
            'normal': 0xffffff,
            'fire': 0xff4444,
            'ice': 0x4444ff,
            'heal': 0x44ff44,
            'slow': 0xff44ff
        };

        for (let i = 0; i < 8; i++) {
            const particle = this.add.rectangle(
                x, y, 4, 4, colors[type]
            );
            
            const angle = (Math.PI * 2 * i) / 8;
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    function removeWord(index) {
        if (words[index]) {
            words[index].container.destroy();  // Destroy container (destroys children too)
            words.splice(index, 1);
        }
    }

    function loseLife() {
        lives++;
        livesText.setText('LIVES: ' + lives + '%');

        this.cameras.main.flash(200, 255, 0, 0);

        // if (lives <= 0) {
        //     gameOver.call(this);
        // }
    }

    function levelUp() {
        level++;
        levelText.setText('LEVEL: ' + level);
        
        this.cameras.main.flash(200, 0, 255, 0);
        
        spawnTimer.delay = Math.max(1000, 2000 - (level * 100));
    }

    function gameOver() {
        spawnTimer.remove();
        
        words.forEach(wordObj => wordObj.text.destroy());
        words = [];

        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 370, 'FINAL SCORE: ' + score, {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 420, 'Mouse click to restart', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5);
    }
};