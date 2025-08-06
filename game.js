class ColorMatchingGame {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        
        // Modal elements
        this.gameOverModal = document.getElementById('game-over-modal');
        this.pauseModal = document.getElementById('pause-modal');
        this.finalScoreElement = document.getElementById('final-score');
        this.finalMovesElement = document.getElementById('final-moves');
        this.finalTimeElement = document.getElementById('final-time');
        this.finalDifficultyElement = document.getElementById('final-difficulty');
        
        // Modal buttons
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.quitBtn = document.getElementById('quit-btn');
        
        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameEnded = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        
        // Color sets for different difficulties
        this.colorSets = {
            easy: [
                'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'
            ],
            medium: [
                'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan',
                'lime', 'magenta', 'teal', 'indigo', 'coral', 'gold', 'emerald', 'ruby',
                'sapphire', 'amethyst'
            ],
            hard: [
                'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan',
                'lime', 'magenta', 'teal', 'indigo', 'coral', 'gold', 'emerald', 'ruby',
                'sapphire', 'amethyst', 'topaz', 'jade', 'pearl', 'onyx', 'bronze', 'silver',
                'turquoise', 'lavender', 'mint', 'peach', 'navy', 'maroon', 'olive', 'salmon'
            ]
        };
        
        this.difficultySettings = {
            easy: { size: 4, pairs: 8, baseScore: 100, timeBonus: 10 },
            medium: { size: 6, pairs: 18, baseScore: 200, timeBonus: 20 },
            hard: { size: 8, pairs: 32, baseScore: 300, timeBonus: 30 }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.newGame();
    }
    
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.closeModalBtn.addEventListener('click', () => this.closeGameOverModal());
        this.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.quitBtn.addEventListener('click', () => this.quitGame());
        this.difficultySelect.addEventListener('change', () => this.newGame());
    }
    
    newGame() {
        this.resetGame();
        this.generateCards();
        this.renderBoard();
        this.updateDisplay();
    }
    
    resetGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameEnded = false;
        this.startTime = null;
        this.elapsedTime = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.pauseBtn.textContent = 'Pause';
        this.pauseBtn.disabled = false;
        this.closeGameOverModal();
        this.closePauseModal();
    }
    
    generateCards() {
        const difficulty = this.difficultySelect.value;
        const settings = this.difficultySettings[difficulty];
        const colors = this.colorSets[difficulty];
        
        // Create pairs of cards
        const cardColors = [];
        for (let i = 0; i < settings.pairs; i++) {
            const color = colors[i % colors.length];
            cardColors.push(color, color);
        }
        
        // Shuffle the cards
        this.cards = this.shuffleArray(cardColors).map((color, index) => ({
            id: index,
            color: color,
            flipped: false,
            matched: false
        }));
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    renderBoard() {
        const difficulty = this.difficultySelect.value;
        this.gameBoard.className = `game-board ${difficulty}`;
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        
        const cardFront = document.createElement('div');
        cardFront.className = `card-face card-front color-${card.color}`;
        
        cardElement.appendChild(cardBack);
        cardElement.appendChild(cardFront);
        
        cardElement.addEventListener('click', () => this.flipCard(card.id));
        
        return cardElement;
    }
    
    flipCard(cardId) {
        if (this.gamePaused || this.gameEnded) return;
        
        const card = this.cards.find(c => c.id === cardId);
        const cardElement = document.querySelector(`[data-id="${cardId}"]`);
        
        if (!card || card.flipped || card.matched || this.flippedCards.length >= 2) {
            return;
        }
        
        if (!this.gameStarted) {
            this.startGame();
        }
        
        // Flip the card
        card.flipped = true;
        cardElement.classList.add('flipped');
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            this.checkForMatch();
        }
    }
    
    checkForMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.color === card2.color) {
            // Match found
            setTimeout(() => {
                this.handleMatch(card1, card2);
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                this.handleNoMatch(card1, card2);
            }, 1000);
        }
    }
    
    handleMatch(card1, card2) {
        // Mark cards as matched
        card1.matched = true;
        card2.matched = true;
        
        const card1Element = document.querySelector(`[data-id="${card1.id}"]`);
        const card2Element = document.querySelector(`[data-id="${card2.id}"]`);
        
        card1Element.classList.add('matched');
        card2Element.classList.add('matched');
        
        this.matchedPairs++;
        this.updateScore();
        this.flippedCards = [];
        
        // Check if game is complete
        const difficulty = this.difficultySelect.value;
        const totalPairs = this.difficultySettings[difficulty].pairs;
        
        if (this.matchedPairs === totalPairs) {
            this.endGame();
        }
    }
    
    handleNoMatch(card1, card2) {
        // Flip cards back
        card1.flipped = false;
        card2.flipped = false;
        
        const card1Element = document.querySelector(`[data-id="${card1.id}"]`);
        const card2Element = document.querySelector(`[data-id="${card2.id}"]`);
        
        card1Element.classList.remove('flipped');
        card2Element.classList.remove('flipped');
        
        this.flippedCards = [];
    }
    
    updateScore() {
        const difficulty = this.difficultySelect.value;
        const settings = this.difficultySettings[difficulty];
        
        // Base score for match
        let matchScore = settings.baseScore;
        
        // Bonus for fewer moves
        const moveBonus = Math.max(0, (settings.pairs * 2 - this.moves) * 10);
        
        // Time bonus (points per second remaining, max 5 minutes)
        const timeBonus = Math.max(0, (300 - this.elapsedTime) * settings.timeBonus);
        
        this.score += matchScore + moveBonus + timeBonus;
        this.updateDisplay();
    }
    
    startGame() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.startTimer();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.gamePaused && !this.gameEnded) {
                this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
                this.updateTimerDisplay();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = this.elapsedTime % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
    }
    
    togglePause() {
        if (this.gameEnded || !this.gameStarted) return;
        
        if (this.gamePaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        this.gamePaused = true;
        this.pauseBtn.textContent = 'Resume';
        this.showPauseModal();
        
        // Disable all cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.classList.add('disabled'));
    }
    
    resumeGame() {
        this.gamePaused = false;
        this.pauseBtn.textContent = 'Pause';
        this.closePauseModal();
        
        // Enable all cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.classList.remove('disabled'));
    }
    
    endGame() {
        this.gameEnded = true;
        this.pauseBtn.disabled = true;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Final score calculation with completion bonus
        const difficulty = this.difficultySelect.value;
        const settings = this.difficultySettings[difficulty];
        const completionBonus = settings.baseScore * 2;
        this.score += completionBonus;
        
        this.updateDisplay();
        this.showGameOverModal();
    }
    
    showGameOverModal() {
        this.finalScoreElement.textContent = this.score;
        this.finalMovesElement.textContent = this.moves;
        this.finalTimeElement.textContent = this.timerElement.textContent;
        this.finalDifficultyElement.textContent = this.difficultySelect.options[this.difficultySelect.selectedIndex].text;
        this.gameOverModal.classList.remove('hidden');
    }
    
    closeGameOverModal() {
        this.gameOverModal.classList.add('hidden');
    }
    
    showPauseModal() {
        this.pauseModal.classList.remove('hidden');
    }
    
    closePauseModal() {
        this.pauseModal.classList.add('hidden');
    }
    
    playAgain() {
        this.closeGameOverModal();
        this.newGame();
    }
    
    quitGame() {
        this.closePauseModal();
        this.resetGame();
    }
    
    // Additional utility methods
    getGameStats() {
        return {
            score: this.score,
            moves: this.moves,
            time: this.elapsedTime,
            difficulty: this.difficultySelect.value,
            matchedPairs: this.matchedPairs,
            totalPairs: this.difficultySettings[this.difficultySelect.value].pairs
        };
    }
    
    // Method to handle keyboard controls
    handleKeyPress(event) {
        switch(event.key) {
            case 'n':
            case 'N':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.newGame();
                }
                break;
            case 'p':
            case 'P':
                if (this.gameStarted && !this.gameEnded) {
                    this.togglePause();
                }
                break;
            case 'Escape':
                if (this.gamePaused) {
                    this.resumeGame();
                } else if (!this.gameOverModal.classList.contains('hidden')) {
                    this.closeGameOverModal();
                }
                break;
        }
    }
    
    // Method to get hint (for future enhancement)
    getHint() {
        if (this.gameEnded || this.gamePaused) return null;
        
        const unmatched = this.cards.filter(card => !card.matched && !card.flipped);
        if (unmatched.length < 2) return null;
        
        // Find a matching pair
        for (let i = 0; i < unmatched.length; i++) {
            for (let j = i + 1; j < unmatched.length; j++) {
                if (unmatched[i].color === unmatched[j].color) {
                    return [unmatched[i], unmatched[j]];
                }
            }
        }
        return null;
    }
    
    // Method to calculate accuracy percentage
    getAccuracy() {
        if (this.moves === 0) return 100;
        const difficulty = this.difficultySelect.value;
        const perfectMoves = this.difficultySettings[difficulty].pairs;
        return Math.round((perfectMoves / this.moves) * 100);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ColorMatchingGame();
    
    // Add keyboard event listeners
    document.addEventListener('keydown', (event) => {
        game.handleKeyPress(event);
    });
    
    // Add visibility change listener to pause game when tab is not active
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.gameStarted && !game.gameEnded && !game.gamePaused) {
            game.pauseGame();
        }
    });
    
    // Prevent context menu on cards
    document.addEventListener('contextmenu', (event) => {
        if (event.target.closest('.card')) {
            event.preventDefault();
        }
    });
    
    // Add touch support for mobile devices
    let touchStartTime = 0;
    document.addEventListener('touchstart', (event) => {
        touchStartTime = Date.now();
    });
    
    document.addEventListener('touchend', (event) => {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        // Prevent accidental taps (too quick or too long)
        if (touchDuration < 50 || touchDuration > 500) {
            event.preventDefault();
        }
    });
    
    // Add smooth scrolling for mobile
    document.addEventListener('touchmove', (event) => {
        // Allow scrolling but prevent default for game board
        if (event.target.closest('.game-board')) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Performance optimization - preload card flip animations
    const style = document.createElement('style');
    style.textContent = `
        .card {
            will-change: transform;
        }
        .card.flipped {
            animation: cardFlip 0.6s ease-in-out;
        }
        @keyframes cardFlip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(180deg); }
        }
        .card.matched {
            animation: cardMatch 0.8s ease-in-out;
        }
        @keyframes cardMatch {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    // Add focus management for accessibility
    const focusableElements = 'button, select, input, [tabindex]:not([tabindex="-1"])';
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            const modal = document.querySelector('.modal:not(.hidden)');
            if (modal) {
                const focusable = modal.querySelectorAll(focusableElements);
                const firstFocusable = focusable[0];
                const lastFocusable = focusable[focusable.length - 1];
                
                if (event.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        event.preventDefault();
                    }
                }
            }
        }
    });
    
    // Initialize service worker for offline support (if available)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, continue without offline support
        });
    }
    
    // Add game statistics tracking
    const gameStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        bestScore: 0,
        totalTime: 0,
        bestTime: 0
    };
    
    // Load stats from localStorage if available
    try {
        const savedStats = localStorage.getItem('colorMatchingGameStats');
        if (savedStats) {
            Object.assign(gameStats, JSON.parse(savedStats));
        }
    } catch (e) {
        // localStorage not available, continue without stats
    }
    
    // Save stats function
    function saveStats() {
        try {
            localStorage.setItem('colorMatchingGameStats', JSON.stringify(gameStats));
        } catch (e) {
            // localStorage not available
        }
    }
    
    // Update stats when game ends
    const originalEndGame = game.endGame;
    game.endGame = function() {
        originalEndGame.call(this);
        
        gameStats.gamesPlayed++;
        gameStats.gamesWon++;
        gameStats.totalScore += this.score;
        gameStats.totalTime += this.elapsedTime;
        
        if (this.score > gameStats.bestScore) {
            gameStats.bestScore = this.score;
        }
        
        if (gameStats.bestTime === 0 || this.elapsedTime < gameStats.bestTime) {
            gameStats.bestTime = this.elapsedTime;
        }
        
        saveStats();
    };
    
    // Console commands for debugging (development only)
    if (typeof window !== 'undefined') {
        window.gameDebug = {
            getGame: () => game,
            getStats: () => gameStats,
            autoSolve: () => {
                // Auto-solve the game (for testing)
                const unmatched = game.cards.filter(card => !card.matched);
                const pairs = {};
                
                unmatched.forEach(card => {
                    if (!pairs[card.color]) {
                        pairs[card.color] = [];
                    }
                    pairs[card.color].push(card);
                });
                
                Object.values(pairs).forEach(pair => {
                    if (pair.length === 2) {
                        setTimeout(() => {
                            game.flipCard(pair[0].id);
                            setTimeout(() => {
                                game.flipCard(pair[1].id);
                            }, 100);
                        }, Math.random() * 1000);
                    }
                });
            }
        };
    }
});