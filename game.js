window.onload = function() {
// Game Configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        pixelArt: true,
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
    let correctWordsInLevel = 0;
    let wordsNeededForNextLevel = 20;
    let spawnTimer;
    let scoreText;
    let livesText;
    let levelText;
    let inputText;
    let progressText;
    let isFrozen = false;
    let freezeTimer = null;
    let wordData = null;
    let progressBar;
    let progressBarBg;
    let gameStarted = false; // NEW: Track if game has started
    let isPaused = false;
    let pauseMenu = null;
    let pauseButton = null;
    let isFreezeActive = false;
    let totalCharactersTyped = 0;
    let typingStartTime = null;
    let currentWPM = 0;
    let wpmText;

    // Power-up collection system
    let collectedPowerUps = [];
    let powerUpSlots = [];

    function preload() {
        this.load.json('words', 'assets/words.json');

        //left
        this.load.image('powerup_shelf', 'assets/left/bookcase_powerup.png');
        this.load.image('shelf_bk', 'assets/left/bookcase_bk.png');
        this.load.image('progress_bk', 'assets/left/progress_bk.png');
        this.load.image('panel_divider', 'assets/left/leftPanelDivider.png');

        // middle
        this.load.image('bk', 'assets/middle/bookcase_bk.png');
        this.load.image('word_normal', 'assets/middle/word/word_bk.png');
        this.load.image('word_fire', 'assets/middle/word/word_fire_bk.png');
        this.load.image('word_ice', 'assets/middle/word/word_ice_bk.png');
        this.load.image('word_heal', 'assets/middle/word/word_heal_bk.png');
        this.load.image('word_slow', 'assets/middle/word/word_slow_bk.png');
        this.load.image('middle_platform', 'assets/middle/platform.png');
        this.load.image('typing_table', 'assets/middle/typing_table.png');
        this.load.image('typing_bk', 'assets/middle/typing_bk.png'); // TODO to implement the grey placeholder
        // TODO add books to indicate the lives lefft
        

        // right panel
        this.load.image('right_bk_curtain', 'assets/right/curtain_1.png');
        this.load.image('right_bk_window', 'assets/right/curtain_2.png');
        this.load.image('right_bk_sky', 'assets/right/curtain_3.png');
        this.load.image('right_bk_menu', 'assets/right/menu_bk.png');
        this.load.spritesheet('pause_button', 'assets/right/pause_btn.png', {
            frameWidth: 15,  // Adjust to your actual button width in pixels
            frameHeight: 15  // Adjust to your actual button height in pixels
        });
        this.load.image('null_btn', 'assets/right/null_btn.png');
    }

    function create() {
        // Load word data
        // Future plans:
        // Level 1 - words
        // Level 2 - phrases
        // Level 3 - sentences
        wordData = this.cache.json.get('words');

        // Show start screen popup first
        showStartScreen.call(this);
    }

    function showStartScreen() {
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.9);

        // Create dialog container with glow effect
        const dialogBg = this.add.rectangle(400, 400, 600, 400, 0x1a1a2e);
        dialogBg.setStrokeStyle(6, 0x00ffff);

        // Game title with cyber effect
        const titleText = this.add.text(400, 280, 'TYPING CASTER', {
            fontSize: '64px',
            fontFamily: 'Pixuf',
            color: '#00ffff',
            fontStyle: 'bold',
            stroke: '#0088ff',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Subtitle
        const subtitleText = this.add.text(400, 350, 'TYPE TO SURVIVE', {
            fontSize: '24px',
            fontFamily: 'Pixuf',
            color: '#ffffff',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Start button
        const buttonBg = this.add.rectangle(400, 480, 280, 70, 0x00ff00);
        buttonBg.setStrokeStyle(4, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(400, 480, 'START TYPING', {
            fontSize: '32px',
            fontFamily: 'Pixuf',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00cc00);
            buttonBg.setScale(1.05);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00ff00);
            buttonBg.setScale(1);
        });

        // Button click - start the game
        buttonBg.on('pointerdown', () => {
            // Remove start screen elements
            overlay.destroy();
            dialogBg.destroy();
            titleText.destroy();
            subtitleText.destroy();
            buttonBg.destroy();
            buttonText.destroy();

            // Initialize the actual game
            initializeGame.call(this);
        });

        // Add pulsing animation to title
        this.tweens.add({
            targets: titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    function initializeGame() {
        gameStarted = true;

        // Left
        const leftBkPanel = this.add.image(100, 500, 'progress_bk');
        leftBkPanel.setDepth(-1);
        leftBkPanel.setScale(3);
        const leftShelfBk = this.add.image(100, 160, 'shelf_bk');
        leftShelfBk.setDepth(-1);
        const leftPowerUpBk = this.add.image(100, 145, 'powerup_shelf');
        leftPowerUpBk.setDisplaySize(180, 255);
        leftPowerUpBk.setDepth(-1);
        const panelDivider = this.add.image(100, 310, 'panel_divider');
        panelDivider.setDepth(-1);
        // TODO - tile to span across the panel width

        // Middle
        const middleBk = this.add.image(400, 400, 'bk');
        middleBk.setDepth(-1);
        middleBk.setScale(1.5);
        const middlePlatform = this.add.image(400, 780, 'middle_platform');
        middlePlatform.setDepth(-1);
        middlePlatform.setScale(2);
        // TODO - tile to span across entire bottom area
        const typingTable = this.add.image(400, 720, 'typing_table');
        typingTable.setScale(2);

        // Right
        const rightBkSky = this.add.image(700, 400, 'right_bk_sky');
        const rightBkWindow = this.add.image(700, 400, 'right_bk_window');
        const rightBkCurtain = this.add.image(700, 400, 'right_bk_curtain');
        rightBkSky.setDepth(-1);
        rightBkWindow.setDepth(-1);
        rightBkCurtain.setDepth(-1);
        rightBkSky.setDisplaySize(200, 800);
        rightBkWindow.setDisplaySize(200, 800);
        rightBkCurtain.setDisplaySize(200, 800);
        const rightBkMenu = this.add.image(700, 680, 'right_bk_menu');
        rightBkMenu.setDepth(-1);
        rightBkMenu.setScale(3);
        

        const graphics = this.add.graphics();

        //Left - ENTIRE side panel
        graphics.lineStyle(3, 0x00ffff, 1);
        graphics.strokeRect(0, 0, 200, 800);

        // Left - powerup section
        graphics.lineStyle(3, 0xffff00, 1);
        graphics.strokeRect(20, 20, 160, 250);
        
        // Left - lives section
        graphics.lineStyle(3, 0xff00ff, 1);
        graphics.strokeRect(20, 350, 160, 400);

        //Right - ENTIRE panel
        graphics.lineStyle(3, 0xffff00, 1);
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
        wpmText = this.add.text(620, 180, 'WPM: 0', {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#00ff00'
        });

        //Right - Menu button
        pauseButton = this.add.sprite(660, 720, 'pause_button', 0);
        pauseButton.setDisplaySize(40, 40);
        pauseButton.setInteractive({ useHandCursor: true });

        // Hover effect - slightly highlight (scale up)
        pauseButton.on('pointerover', () => {
            if (!isPaused) {
                pauseButton.setTint(0xcccccc); // Optional: slight gray tint for hover
            }
        });

        // Mouse out - return to normal
        pauseButton.on('pointerout', () => {
            pauseButton.clearTint();
            pauseButton.setFrame(0); // Ensure it's back to unpressed state
        });

        // Press down - show pressed frame
        pauseButton.on('pointerdown', () => {
            pauseButton.setFrame(1); // Pressed state
        });

        // Release - trigger pause and return to normal
        pauseButton.on('pointerup', () => {
            pauseButton.setFrame(0); // Back to unpressed
            togglePause.call(this);
        });

        //Right - Settings(?) button
        const settingsButton = this.add.image(740, 720, 'null_btn');
        settingsButton.setDisplaySize(40, 40);

        //middle - play area outline (where words fall)
        graphics.lineStyle(3, 0xff00ff, 1);
        graphics.strokeRect(200, 60, 400, 690);
        
        // middle - Input area outline (bottom)
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.strokeRect(250, 700, 300, 50);
        
        // Title
        this.add.text(400, 30, 'Typing Caster', {
            fontSize: '32px',
            fontFamily: 'Pixuf',
            color: '#00ffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Power-up slots
        for (let i = 0; i < 6; i++) {
            const y = 245 - (i * 35);
            
            // Create image with proper size to fit bookshelf
            const slotImage = this.add.image(100, y, 'word_normal');
            slotImage.setDisplaySize(139, 30);
            slotImage.setVisible(false);
            
            const slotText = this.add.text(100, y, '', {
                fontSize: '14px',
                fontFamily: 'Pixuf',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            slotText.setVisible(false);
            
            powerUpSlots.push({
                image: slotImage,
                text: slotText,
                filled: false
            });
        }

        // Score display
        scoreText = this.add.text(620, 100, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#00ff00'
        });

        // Lives display
        livesText = this.add.text(20, 350, 'LIVES: 0%', {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#ff0000'
        });

        // Progress bar background (just below lives text)
        progressBarBg = this.add.graphics();
        progressBarBg.fillStyle(0x333333, 1);
        progressBarBg.fillRect(30, 390, 140, 20);
        progressBarBg.lineStyle(2, 0x00ff00, 1);
        progressBarBg.strokeRect(30, 390, 140, 20);

        // Progress bar fill
        progressBar = this.add.graphics();

        // Progress text (shows X/Y words)
        progressText = this.add.text(100, 420, '0/20', {
            fontSize: '16px',
            fontFamily: 'Pixuf',
            color: '#00ff00'
        }).setOrigin(0.5);

        updateProgressBar.call(this);

        // Level display
        levelText = this.add.text(620, 20, 'LEVEL: 1', {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#ffff00'
        });

        // Current input display
        inputText = this.add.text(400, 725, '', {
            fontSize: '24px',
            fontFamily: 'Pixuf',
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

    function togglePause() {
        if (!isPaused) {
            // Pause the game
            isPaused = true;
            isFrozen = true;
            spawnTimer.paused = true;

            // Create pause menu overlay
            const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.8);
            
            const menuBg = this.add.rectangle(400, 400, 500, 350, 0x1a1a2e);
            menuBg.setStrokeStyle(6, 0x00ffff);

            const titleText = this.add.text(400, 280, 'PAUSED', {
                fontSize: '48px',
                fontFamily: 'Pixuf',
                color: '#00ffff',
                fontStyle: 'bold',
                stroke: '#0088ff',
                strokeThickness: 6
            }).setOrigin(0.5);

            const levelInfoText = this.add.text(400, 350, `Level: ${level}`, {
                fontSize: '24px',
                fontFamily: 'Pixuf',
                color: '#ffff00'
            }).setOrigin(0.5);

            const scoreInfoText = this.add.text(400, 390, `Score: ${score}`, {
                fontSize: '24px',
                fontFamily: 'Pixuf',
                color: '#00ff00'
            }).setOrigin(0.5);

            // Resume button
            const resumeButton = this.add.rectangle(400, 470, 200, 50, 0x00ff00);
            resumeButton.setStrokeStyle(3, 0xffffff);
            resumeButton.setInteractive({ useHandCursor: true });

            const resumeText = this.add.text(400, 470, 'RESUME', {
                fontSize: '24px',
                fontFamily: 'Pixuf',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Quit button
            const quitButton = this.add.rectangle(400, 540, 200, 50, 0xff0000);
            quitButton.setStrokeStyle(3, 0xffffff);
            quitButton.setInteractive({ useHandCursor: true });

            const quitText = this.add.text(400, 540, 'QUIT', {
                fontSize: '24px',
                fontFamily: 'Pixuf',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Store menu elements
            pauseMenu = {
                overlay,
                menuBg,
                titleText,
                levelInfoText,
                scoreInfoText,
                resumeButton,
                resumeText,
                quitButton,
                quitText
            };

            // Button interactions
            resumeButton.on('pointerover', () => {
                resumeButton.setFillStyle(0x00cc00);
            });
            resumeButton.on('pointerout', () => {
                resumeButton.setFillStyle(0x00ff00);
            });
            resumeButton.on('pointerdown', () => {
                togglePause.call(this);
            });

            quitButton.on('pointerover', () => {
                quitButton.setFillStyle(0xcc0000);
            });
            quitButton.on('pointerout', () => {
                quitButton.setFillStyle(0xff0000);
            });
            quitButton.on('pointerdown', () => {
                // Quit to main menu (reload game for now)
                location.reload();
            });

        } else {
            // Resume the game
            isPaused = false;
            isFrozen = false;
            spawnTimer.paused = false;

            // Remove pause menu
            if (pauseMenu) {
                Object.values(pauseMenu).forEach(element => {
                    if (element) element.destroy();
                });
                pauseMenu = null;
            }
        }
    }

    function update(time, delta) {
        // Only update if game has started
        if (!gameStarted) return;

        // Update falling words (skip if frozen)
        if (!isFrozen) {
            words.forEach((wordObj, index) => {
                wordObj.y += wordObj.speed;
                wordObj.container.setY(wordObj.y);

                // Check if word reached bottom
                if (wordObj.y > 730) {
                    loseLife.call(this);
                    removeWord.call(this, index);
                }
            });
        }
    }

    function updateProgressBar() {
        progressBar.clear();
        
        const progress = correctWordsInLevel / wordsNeededForNextLevel;
        const barWidth = 136 * progress;
        
        progressBar.fillStyle(0x00ff00, 1);
        progressBar.fillRect(32, 392, barWidth, 16);
        
        progressText.setText(`${correctWordsInLevel}/${wordsNeededForNextLevel}`);
    }

    function spawnWord() {
        // Get word list based on current level
        let wordList;
        if (level === 1) {
            wordList = wordData.level1;
        } else if (level === 2) {
            wordList = wordData.level2;
        } else {
            wordList = wordData.level3;
        }

        const word = wordList[Math.floor(Math.random() * wordList.length)];
        
        const types = [
            { name: 'normal', color: '#ffffff' }, // Removed image property
            { name: 'fire', color: '#ff5234ff' },
            { name: 'ice', color: '#44efffff' },
            { name: 'heal', color: '#44ff44' },
            { name: 'slow', color: '#cf67ffff' }
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

        const container = this.add.container(x, y);

        const textBg = this.add.image(0, 0, 'word_normal');
        textBg.setDisplaySize(100, 40);

        const typedText = this.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'Pixuf',
            color: '#fff200ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        const untypedText = this.add.text(0, 0, word, {
            fontSize: '14px',
            fontFamily: 'Pixuf',
            color: type.color, // Color still differentiates power-up type
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        const fullWidth = untypedText.width;
        typedText.setX(-fullWidth / 2);
        untypedText.setX(-fullWidth / 2);

        container.add([textBg, typedText, untypedText]);

        const baseSpeed = 0.5 + (level * 0.1);
        
        const isSlowActive = words.some(w => w.slowedAt !== undefined);
        const actualSpeed = isSlowActive ? baseSpeed * 0.5 : baseSpeed;

        const newWord = {
            container: container,
            typedText: typedText,
            untypedText: untypedText,
            word: word,
            x: x,
            y: y,
            speed: actualSpeed,
            type: type.name,
            matchedLength: 0
        };
        
        // If slow is active, mark this word and apply tint
        if (isSlowActive) {
            newWord.slowedAt = words.find(w => w.slowedAt !== undefined).slowedAt;
            typedText.setTint(0xff44ff);
            untypedText.setTint(0xff44ff);
        }

        words.push(newWord);
    }

    function handleKeyPress(event) {
        const key = event.key;

        // Start timing on first keystroke
        if (typingStartTime === null && key.length === 1 && key.match(/[a-z]/i)) {
            typingStartTime = this.time.now;
        }

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
            
            // Track character typed
            totalCharactersTyped++;
            updateWPM.call(this);
        }
    }

    function updateWPM() {
        if (typingStartTime === null) return;
        
        const currentTime = this.time.now;
        const timeElapsedMinutes = (currentTime - typingStartTime) / 60000; // Convert ms to minutes
        
        if (timeElapsedMinutes > 0) {
            // WPM = (total characters / 5) / time in minutes
            currentWPM = Math.round((totalCharactersTyped / 5) / timeElapsedMinutes);
            wpmText.setText('WPM: ' + currentWPM);
        }
    }

    function updateWordHighlights() {
        words.forEach(wordObj => {
            const word = wordObj.word;
            let matchedLength = 0;

            if (currentInput.length > 0 && word.startsWith(currentInput)) {
                matchedLength = currentInput.length;
            }

            const typedPortion = word.substring(0, matchedLength);
            const untypedPortion = word.substring(matchedLength);

            wordObj.typedText.setText(typedPortion);
            wordObj.untypedText.setText(untypedPortion);

            const fullWidth = wordObj.typedText.width + wordObj.untypedText.width;
            wordObj.typedText.setX(-fullWidth / 2);
            wordObj.untypedText.setX(-fullWidth / 2 + wordObj.typedText.width);

            wordObj.matchedLength = matchedLength;
        });
    }

    function checkWord() {
        if (currentInput === '') return;

        // First, check if input matches a collected power-up
        const powerUpIndex = collectedPowerUps.indexOf(currentInput);
        if (powerUpIndex !== -1) {
            // Found a matching power-up - activate it!
            usePowerUp.call(this, currentInput);
            
            // Remove the power-up from collection
            collectedPowerUps.splice(powerUpIndex, 1);
            updatePowerUpDisplay.call(this);
            
            // Clear input
            currentInput = '';
            inputText.setText('');
            updateWordHighlights.call(this);
            
            // Visual feedback
            this.cameras.main.flash(200, 0, 255, 0);
            return;
        }

        // If not a power-up, check for regular words
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

        if (!foundMatch) {
            this.cameras.main.shake(300, 0.01);
        }
    }

    function handleCorrectWord(index) {
        const wordObj = words[index];
        let points = 10;
        
        if (wordObj.type !== 'normal') {
            if (collectedPowerUps.length < 6) {
                collectedPowerUps.push(wordObj.type);
                updatePowerUpDisplay.call(this);
            }
            
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

        // Increment progress
        correctWordsInLevel++;
        updateProgressBar.call(this);

        createExplosion.call(this, wordObj.x, wordObj.y, wordObj.type);
        removeWord.call(this, index);

        // Check if level is complete
        if (correctWordsInLevel >= wordsNeededForNextLevel) {
            completeLevel.call(this);
        }
    }

    function completeLevel() {
        // Pause the game
        spawnTimer.paused = true;
        isFrozen = true;

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.7);

        // Create dialog container
        const dialogBg = this.add.rectangle(400, 400, 500, 300, 0x222222);
        dialogBg.setStrokeStyle(4, 0x00ffff);

        // Provide WPM feedback
        const wpmText = this.add.text(400, 400, `Typing Speed: ${currentWPM} WPM`, {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Level complete text
        const titleText = this.add.text(400, 300, `LEVEL ${level} COMPLETE!`, {
            fontSize: '36px',
            fontFamily: 'Pixuf',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Current score text
        const currentScoreText = this.add.text(400, 360, `Current Score: ${score}`, {
            fontSize: '24px',
            fontFamily: 'Pixuf',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Continue button
        const buttonBg = this.add.rectangle(400, 450, 200, 60, 0x00ff00);
        buttonBg.setStrokeStyle(3, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(400, 450, 'CONTINUE', {
            fontSize: '24px',
            fontFamily: 'Pixuf',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00cc00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00ff00);
        });

        buttonBg.on('pointerdown', () => {
            // Remove dialog elements
            overlay.destroy();
            dialogBg.destroy();
            titleText.destroy();
            currentScoreText.destroy();
            buttonBg.destroy();
            buttonText.destroy();
            wpmText.destroy();

            // Advance to next level
            advanceToNextLevel.call(this);
        });
    }

    function advanceToNextLevel() {
        level++;
        correctWordsInLevel = 0;
        totalCharactersTyped = 0;
        typingStartTime = this.time.now;
        currentWPM = 0;
        collectedPowerUps = [];
        updatePowerUpDisplay.call(this);

        // Set words needed for next level
        if (level === 2) {
            wordsNeededForNextLevel = 25;
        } else if (level === 3) {
            wordsNeededForNextLevel = 30;
        } else {
            // Level 3 completed - could add win condition here
            wordsNeededForNextLevel = 30;
        }

        levelText.setText('LEVEL: ' + level);
        updateProgressBar.call(this);
        
        this.cameras.main.flash(200, 0, 255, 0);
        
        // Adjust spawn speed
        spawnTimer.delay = Math.max(1000, 2000 - (level * 100));
        
        // Resume game
        spawnTimer.paused = false;
        isFrozen = false;
    }

    function updatePowerUpDisplay() {
        for (let i = 0; i < 6; i++) {
            if (i < collectedPowerUps.length) {
                const powerType = collectedPowerUps[i];
                const imageKeys = {
                    'fire': 'word_fire',
                    'ice': 'word_ice',
                    'heal': 'word_heal',
                    'slow': 'word_slow'
                };
                
                const names = {
                    'fire': 'FIRE',
                    'ice': 'ICE',
                    'heal': 'HEAL',
                    'slow': 'SLOW'
                };
                
                // Set the appropriate image
                powerUpSlots[i].image.setTexture(imageKeys[powerType]);
                powerUpSlots[i].image.setDisplaySize(139, 30); // Ensure consistent size
                powerUpSlots[i].image.setVisible(true);
                
                powerUpSlots[i].text.setText(names[powerType]);
                powerUpSlots[i].text.setColor('#000000ff');
                powerUpSlots[i].text.setVisible(true);
                powerUpSlots[i].filled = true;
            } else {
                powerUpSlots[i].image.setVisible(false);
                powerUpSlots[i].text.setVisible(false);
                powerUpSlots[i].filled = false;
            }
        }
    }

    function usePowerUp(powerType) {
        switch(powerType) {
            case 'fire':
                clearAllWords.call(this);
                break;
            case 'ice':
                freezeWords.call(this);
                break;
            case 'heal':
                lives = 0; // Reset lives to 0%
                livesText.setText('LIVES: 0%');
                break;
            case 'slow':
                slowDownWords.call(this);
                break;
        }
    }

    function clearAllWords() {
        // Pause spawning
        spawnTimer.paused = true;
        
        // Clear all words with explosions
        const currentWords = [...words];
        currentWords.forEach((wordObj, index) => {
            createExplosion.call(this, wordObj.x, wordObj.y, 'fire');
        });
        
        // Remove all words from the array
        words.forEach(wordObj => {
            if (wordObj.container) {
                wordObj.container.destroy();
            }
        });
        words = [];
        
        // If freeze was active, end it since all words are cleared
        if (isFreezeActive && freezeTimer) {
            freezeTimer.remove();
            freezeTimer = null;
            isFreezeActive = false;
            isFrozen = false;
        }
        
        // Add points for cleared words
        score += currentWords.length * 5;
        scoreText.setText('SCORE: ' + score);
        
        // Wait 1 second before resuming spawning
        this.time.delayedCall(1000, () => {
            spawnTimer.paused = false;
        });
    }

    function freezeWords() {
        isFrozen = true;
        isFreezeActive = true;
        
        // Pause the word spawning timer
        spawnTimer.paused = true;
        
        words.forEach(wordObj => {
            // Mark this word as frozen
            wordObj.isFrozen = true;
            // Apply tint to both typed and untyped text
            wordObj.typedText.setTint(0x4444ff);
            wordObj.untypedText.setTint(0x4444ff);
        });
        
        if (freezeTimer) {
            freezeTimer.remove();
        }
        
        freezeTimer = this.time.addEvent({
            delay: 4000, // 4 seconds
            callback: () => {
                endFreeze.call(this);
            },
            callbackScope: this
        });
    }

    function endFreeze() {
        isFrozen = false;
        isFreezeActive = false;
        
        // Resume word spawning
        spawnTimer.paused = false;
        
        // Clear tints from any remaining frozen words
        words.forEach(wordObj => {
            if (wordObj.isFrozen) {
                wordObj.typedText.clearTint();
                wordObj.untypedText.clearTint();
                wordObj.isFrozen = false;
            }
        });
    }

    function checkFrozenWordsCleared() {
        // Only check if freeze is currently active
        if (!isFreezeActive) return;
        
        // Check if there are any frozen words remaining
        const hasFrozenWords = words.some(wordObj => wordObj.isFrozen);
        
        // If no frozen words remain, end the freeze early
        if (!hasFrozenWords) {
            if (freezeTimer) {
                freezeTimer.remove();
                freezeTimer = null;
            }
            endFreeze.call(this);
        }
    }

    function slowDownWords() {
        // Store the original speeds and mark when slow started
        const slowStartTime = this.time.now;
        const slowDuration = 5000; // 5 seconds
        
        // Apply slow effect to current words
        words.forEach(wordObj => {
            wordObj.speed *= 0.5; // Reduce speed to 50%
            wordObj.slowedAt = slowStartTime; // Mark when this word was slowed
            // Apply tint to both text elements
            wordObj.typedText.setTint(0xff44ff);
            wordObj.untypedText.setTint(0xff44ff);
        });
        
        // Create timer to end slow effect
        this.time.delayedCall(slowDuration, () => {
            // Restore speed only for words that were slowed at the start time
            // (not newly spawned words during the slow period)
            words.forEach(wordObj => {
                if (wordObj.slowedAt === slowStartTime) {
                    wordObj.speed *= 2; // Restore to original speed (multiply by 2 to undo the 0.5)
                    wordObj.typedText.clearTint();
                    wordObj.untypedText.clearTint();
                    delete wordObj.slowedAt;
                }
            });
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
            words[index].container.destroy();
            words.splice(index, 1);
            
            // Check if all frozen words have been cleared
            checkFrozenWordsCleared.call(this);
        }
    }

    function loseLife() {
        lives++;
        livesText.setText('LIVES: ' + lives + '%');

        this.cameras.main.flash(200, 255, 0, 0);
        
        // if (lives >= 100) {
        //     gameOver.call(this);
        // }
    }

    function gameOver() {
        spawnTimer.remove();
        isFrozen = true;
        isPaused = true;
        
        // Destroy all word containers properly
        words.forEach(wordObj => {
            if (wordObj.container) {
                wordObj.container.destroy();
            }
        });
        words = [];

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(400, 400, 800, 800, 0x000000, 0.8);

        const wpmText = this.add.text(400, 400, `Typing Speed: ${currentWPM} WPM`, {
            fontSize: '20px',
            fontFamily: 'Pixuf',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Pixuf',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 370, 'FINAL SCORE: ' + score, {
            fontSize: '32px',
            fontFamily: 'Pixuf',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.rectangle(400, 450, 200, 60, 0x00ff00);
        restartButton.setStrokeStyle(3, 0xffffff);
        restartButton.setInteractive({ useHandCursor: true });

        const restartText = this.add.text(400, 450, 'RESTART', {
            fontSize: '24px',
            fontFamily: 'Pixuf',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x00cc00);
        });

        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x00ff00);
        });

        restartButton.on('pointerdown', () => {
            location.reload();
        });
    }
};