/**
 * Silly Sums - Interactive Educational Game
 * Created: November 2024
 * 
 * This file contains the core game logic for an interactive math learning game
 * that helps users practice basic arithmetic operations through engaging gameplay.
 * Features include single player mode, multiplayer mode, achievements, and a
 * leaderboard system.
 */

let currentOperation = 'addition';      //Current math operation
let currentDifficulty = 'easy';     // Current difficulty level
let score = 0;      // Player's current score
let streak = 0;      // Current streak of correct answers
let totalAttempts = 0;      // Total number of attempted questions
let timerActive = false;        // Whether the countdown timer is active
let timeRemaining = 30;     // Whether the countdown timer is active
let timerInterval;       // Interval reference for the timer
let isMultiplayer = false;        // Whether multiplayer mode is active
let currentPlayer = 1;         // Current player (1 or 2)
let p1Score = 0;        // Player 1's score
let p2Score = 0;        // Player 2's score
let totalTime = 0;      // Total time spent on questions
let questionsStartTime;      // Timestamp when current question started
let isMultiplayerRound = false;      // Whether a multiplayer round is in progress
let multiplayerTimer = 15;         // Time per player in multiplayer mode
let multiplayerInterval;        // Interval reference for multiplayer timer


/**
 * Achievement definitions for the game
 * Each achievement has an ID, name, requirement, and description
 */
const achievements = {
    streaks: [
        { id: 'streak5', name: 'High Five!', requirement: 5, description: 'Get a streak of 5 correct answers', awarded: false },
        { id: 'streak10', name: 'Perfect Ten!', requirement: 10, description: 'Get a streak of 10 correct answers', awarded: false },
        { id: 'streak15', name: 'Unstoppable!', requirement: 15, description: 'Get a streak of 15 correct answers', awarded: false },
        { id: 'streak20', name: 'Math Master!', requirement: 20, description: 'Get a streak of 20 correct answers', awarded: false }
    ],
    // Accuracy-based achievements
    accuracy: [
        { id: 'accuracy100_15', name: 'Sharp Shooter!', 
          requirement: { accuracy: 100, questions: 15 }, 
          description: '100% accuracy over 15 questions', 
          }
    ]
};

// Audio element references
const backgroundMusic = document.getElementById('backgroundMusic');
const correctSound = document.getElementById('correctSound');
const wrongSound = document.getElementById('wrongSound');
const toggleMusicButton = document.getElementById('toggleMusic');
const volumeSlider = document.getElementById('volumeSlider');


let isMusicPlaying = false;


/**
 * Difficulty ranges for number generation
 * Each difficulty level has a minimum and maximum value for numbers used in problems
 */
const difficultyRanges = {
    easy: { min: 1, max: 10 },
    medium: { min: 10, max: 25 },
    hard: { min: 25, max: 100 }
};



/**
 * Initializes the game when the DOM content is loaded
 * Sets up event listeners and initializes the game state
 */
document.addEventListener('DOMContentLoaded', function() {
    // Start page functionality
    const startButton = document.getElementById('start-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const playerNameInput = document.getElementById('player-name');

    if (startButton && playerNameInput) {  // Check if we're on start page
        // Check if there's a saved name
        const savedName = localStorage.getItem('currentPlayer');
        if (savedName) {
            playerNameInput.value = savedName;
        }

        // Start button click handler
        startButton.addEventListener('click', function() {
            const playerName = playerNameInput.value.trim();
            if (!playerName) {
                alert('Please enter your name first!');
                return;
            }
            
            // Save the player name
            localStorage.setItem('currentPlayer', playerName);
            
            // Redirect to game
            window.location.href = 'mathgame.html';
        });

        // Leaderboard button click handler
        leaderboardButton.addEventListener('click', function() {
            window.location.href = 'leaderboard.html';
        });
    }

    // Leaderboard page functionality
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    if (leaderboardEntries) {  // Check if we're on leaderboard page
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        
        // Clear existing entries
        leaderboardEntries.innerHTML = '';
        
        // Add leaderboard entries
        leaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            entryElement.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            `;
            leaderboardEntries.appendChild(entryElement);
        });
        
        // Fill empty slots if less than 5 entries
        while (leaderboardEntries.children.length < 5) {
            const emptyEntry = document.createElement('div');
            emptyEntry.className = 'leaderboard-entry empty';
            emptyEntry.innerHTML = `
                <span class="rank">${leaderboardEntries.children.length + 1}</span>
                <span class="name">---</span>
                <span class="score">---</span>
            `;
            leaderboardEntries.appendChild(emptyEntry);
        }
    }
});



/**
 * Toggles background music on/off
 * Updates button appearance and music state
 */
function toggleMusic() {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        toggleMusicButton.textContent = '🔈 Music';
        toggleMusicButton.classList.add('muted');
    } else {
        backgroundMusic.play();
        toggleMusicButton.textContent = '🔊 Music';
        toggleMusicButton.classList.remove('muted');
    }
    isMusicPlaying = !isMusicPlaying;
}

// Add click event listener for the music toggle button
toggleMusicButton.addEventListener('click', toggleMusic);

// Set initial volume
backgroundMusic.volume = correctSound.volume = wrongSound.volume = 0.5;

/**
 * Disables or enables all option buttons, during the countdown for multiplayer mode
 * @param {boolean} disable - Whether to disable the buttons
 */
function disableOptions(disable) {
    const options = document.querySelectorAll('.option-button');
    options.forEach(button => {
        button.style.pointerEvents = disable ? 'none' : 'auto';
        button.style.opacity = disable ? '0.7' : '1';
    });
}

/**
 * Shows a countdown animation before starting the game
 * @param {Function} callback - Function to call when countdown finishes
 */
function showCountdown(callback) {
    const countdownElement = document.getElementById('countdown');
    const counts = ['3', '2', '1', 'GO!'];
    let i = 0;

    // Disable options during countdown
    disableOptions(true);

    function showNumber() {
        if (i < counts.length) {        // Check if we still have numbers left to show in the countdown sequence
            countdownElement.textContent = counts[i];      // Display the current number in the countdown sequence
            countdownElement.classList.add('show');             // Make the countdown number visible by adding the 'show' class

            // Set up a nested series of timeouts to handle the animation sequence
            setTimeout(() => {
                countdownElement.classList.remove('show');
                setTimeout(showNumber, 500);
            }, 1000);       // Wait 1 second before starting fade out
            i++;
        } else {
            disableOptions(false); // Re--enable options after countdon
            callback();
        }
    }

    showNumber();
}

/**
 * Updates player statistics and saves them to localStorage
 */
function updateReportData() {
    const accuracyPercentage = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    const avgTime = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;
    
    // Save stats to localStorage for report page
    localStorage.setItem('accuracy', `${accuracyPercentage}%`);
    localStorage.setItem('questionsSolved', totalAttempts.toString());
    localStorage.setItem('avgTime', `${avgTime}s`);
}

/**
 * Changes the current operation (addition, subtraction, etc.)
 * @param {string} operation - The operation to switch to
 */
function setOperation(operation) {
    currentOperation = operation;       // Update visual feedback on operation buttons
    // Update visual feedback on operation buttons
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

/**
 * Changes the difficulty level
 * @param {string} difficulty - The difficulty level to switch to
 */
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    document.querySelectorAll('.difficulty-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    generateNewProblem();
}

/**
 * Generates a random number within the current difficulty range
 * @returns {number} A random number within the difficulty range
 */
function generateNumber() {
    const range = difficultyRanges[currentDifficulty];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * Generates a new math problem based on current operation and difficulty
 */
function generateNewProblem() {
    let num1 = generateNumber();
    let num2 = generateNumber();
    let problem, answer;


    if (currentOperation === 'division') {      // Special handling for division to ensure whole number answers
        num1 = num1 * num2;
        problem = `${num1} ÷ ${num2}`;
        answer = num1 / num2;
    } else {
        problem = `${num1} ${getOperationSymbol()} ${num2}`;
        answer = calculateAnswer(num1, num2);
    }

    document.getElementById('problem').textContent = problem;
    generateOptions(answer);
    
    questionsStartTime = Date.now();
}

/**
 * Gets the mathematical symbol for the current operation
 * @returns {string} The symbol representing the current operation
 */
function getOperationSymbol() {
    switch (currentOperation) {
        case 'addition': return '+';
        case 'subtraction': return '-';
        case 'multiplication': return '×';
        case 'division': return '÷';
    }
}

/**
 * Calculates the answer for the current math problem
 * @param {number} num1 - First number in the operation
 * @param {number} num2 - Second number in the operation
 * @returns {number} The result of the mathematical operation
 */
function calculateAnswer(num1, num2) {
    switch (currentOperation) {
        case 'addition': return num1 + num2;
        case 'subtraction': return num1 - num2;
        case 'multiplication': return num1 * num2;
        case 'division': return num1 / num2;
    }
}

/**
 * Generates multiple choice options for the current problem
 * Creates four options including the correct answer and three close alternatives
 * @param {number} correctAnswer - The correct answer to the current problem
 */
function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    // Generate three incorrect but plausible options
    while (options.length < 4) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const newOption = Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;
        if (!options.includes(newOption)) {
            options.push(newOption);
        }
    }

      // Shuffle options randomly
    options.sort(() => Math.random() - 0.5);

    // Create option buttons
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';        //Clears the content of the options container element.
                                            //This function is useful for resetting the displayed options 
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, correctAnswer);
        optionsContainer.appendChild(button);
    });
}

/**
 * Displays visual feedback for correct/incorrect answers
 * @param {boolean} isCorrect - Whether the answer was correct
 */
function showFeedback(isCorrect) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = isCorrect ? '✓' : '✗';
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

    setTimeout(() => {
        feedback.className = 'feedback';
    }, 500);
}

/**
 * Checks if the selected answer is correct and updates game state
 * @param {number} selected - The player's selected answer
 * @param {number} correct - The correct answer
 */
function checkAnswer(selected, correct) {
    const isCorrect = selected === correct;
    totalAttempts++;
    
    // Calculate time taken for this question
    const timeForQuestion = (Date.now() - questionsStartTime) / 1000;
    totalTime += timeForQuestion;

    if (isCorrect) {
        correctSound.play();
        score++;        //Add score if correct
        streak++;       //Add streak if correct
        if (isMultiplayerRound) {
            if (currentPlayer === 1) {
                p1Score++;
            } else {
                p2Score++;
            }
            updateMultiplayerScores();
        }
    } else {
        wrongSound.play();
        streak = 0;     //Reset streak back to 0 if answer is wrong
    }

    showFeedback(isCorrect);
    updateStats();
    checkAchievements();
    updateReportData();
    generateNewProblem();
}

/**
 * Updates the display of game statistics
 */
function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
    document.getElementById('accuracy').textContent =
        `${Math.round((score / totalAttempts) * 100)}%`;
}

/**
 * Toggles the countdown timer mode
 */
function toggleTimer() {
    timerActive = !timerActive;
    if (timerActive) {
        score = 0;
        timeRemaining = 30;
        updateTimer();
        timerInterval = setInterval(() => {     // setInterval runs the contained code every 1000ms (1 second)
            timeRemaining--;
            updateTimer();
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);   // Stop the timer interval to prevent negative counting
                showTimerEndMessage();
                resetGame();
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        document.getElementById('timer').textContent = 'Timer Off';
    }
}

/**
 * Updates the timer display
 */
function updateTimer() {
    document.getElementById('timer').textContent = `Time: ${timeRemaining}s`;
}

/**
 * Shows end-of-game message and updates leaderboard
 */
function showTimerEndMessage() {
    const playerName = localStorage.getItem('currentPlayer');
    updateLeaderboard(playerName, score);
    const winnerAnnouncement = document.getElementById('winner-announcement');
    winnerAnnouncement.textContent = `Great Effort ${playerName}!\nFinal Score: ${score}`;
    winnerAnnouncement.classList.add('show');
    
    setTimeout(() => {
        winnerAnnouncement.classList.remove('show');
        window.location.href = 'leaderboard.html';
    }, 3000);
}

/**
 * Multiplayer mode functions
 */

/**
 * Toggles multiplayer mode on/off
 */
function toggleMultiplayer() {
    isMultiplayer = !isMultiplayer;
    const multiplayerArea = document.getElementById('multiplayer-area');
    
    if (isMultiplayer) {
        multiplayerArea.style.display = 'block';
        startMultiplayerRound();
    } else {
        multiplayerArea.style.display = 'none';
        if (multiplayerInterval) {
            clearInterval(multiplayerInterval);
        }
        resetGame();
    }
}

/**
 * Initializes a new multiplayer round
 */
function startMultiplayerRound() {
    resetGame();
    currentPlayer = 1;
    p1Score = 0;
    p2Score = 0;
    updateMultiplayerScores();
    
    showCountdown(() => {
        startPlayerTurn();
    });
}


/**
 * Starts a player's turn in multiplayer mode
 */
function startPlayerTurn() {
    multiplayerTimer = 15;
    updateMultiplayerTimer();
    isMultiplayerRound = true;
    
    multiplayerInterval = setInterval(() => {
        multiplayerTimer--;
        updateMultiplayerTimer();
        
        if (multiplayerTimer <= 0) {
            clearInterval(multiplayerInterval);
            handleTurnEnd();
        }
    }, 1000);
}

/**
 * Updates the multiplayer timer display
 */
function updateMultiplayerTimer() {
    const timerElement = document.getElementById(`p${currentPlayer}-time`);
    timerElement.textContent = `${multiplayerTimer}s`;
}

/**
 * Updates the display of multiplayer scores
 */
function updateMultiplayerScores() {
    document.getElementById('p1-score').textContent = p1Score;
    document.getElementById('p2-score').textContent = p2Score;
}

/**
 * Handles the end of a player's turn in multiplayer mode
 */
function handleTurnEnd() {
    if (currentPlayer === 1) {      //If Player 1 is done
        currentPlayer = 2;      //Switch to Player 2
        const winnerAnnouncement = document.getElementById('winner-announcement');
        winnerAnnouncement.textContent = "Player 1 Done! Player 2 Get Ready!";      //Message to notify players
        winnerAnnouncement.classList.add('show');
        
        // Disable options during the transition so nobody starts before countdown
        disableOptions(true);
        
        setTimeout(() => {
            winnerAnnouncement.classList.remove('show');
            setTimeout(() => {
                showCountdown(() => {
                    startPlayerTurn();
                });
            }, 500);
        }, 8000); // Show message for 5 seconds
    } else {
        announceWinner();
    }
}

/**
 * Announces the winner of the multiplayer round
 */
function announceWinner() {
    const winnerAnnouncement = document.getElementById('winner-announcement');
    let message;
    
    if (p1Score > p2Score) {
        message = `Player 1 Wins!\nScore: ${p1Score} vs ${p2Score}`;
    } else if (p2Score > p1Score) {
        message = `Player 2 Wins!\nScore: ${p2Score} vs ${p1Score}`;
    } else {
        message = `It's a Tie!\nScore: ${p1Score} vs ${p2Score}`;
    }
    
    winnerAnnouncement.textContent = message;
    winnerAnnouncement.classList.add('show');

    // Only show celebration confetti if there's a clear winner (no tie)
    if (p1Score !== p2Score) {
        confetti.start();
    }
    // Set up cleanup after announcement
    setTimeout(() => {
        winnerAnnouncement.classList.remove('show');
        isMultiplayer = false;
        // Hide the multiplayer UI section
        document.getElementById('multiplayer-area').style.display = 'none';
        resetGame();
        confetti.stop(); // Stop confetti after announcement
    }, 3000);
}

/**
 * Resets all game state variables to their initial values
 */
function resetGame() {
    score = 0;
    streak = 0;
    totalAttempts = 0;
    p1Score = 0;
    p2Score = 0;
    currentPlayer = 1;
    totalTime = 0;
    isMultiplayerRound = false;
    if (multiplayerInterval) {
        clearInterval(multiplayerInterval);
    }
    updateStats();
    updateReportData();
    updateMultiplayerScores();
    generateNewProblem();
}

volumeSlider.addEventListener('input', function() {
    const volume = this.value;
    backgroundMusic.volume = volume;
});


// Confetti animation class
class Confetti {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');    // Get the canvas element where confetti will be drawn
        this.ctx = this.canvas.getContext('2d');       // Get the drawing context from canvas
        this.particles = [];
        this.particleCount = 150;
        this.resizeCanvas();     // Make canvas responsive by setting its size
        window.addEventListener('resize', () => this.resizeCanvas());        // Update canvas size when window is resized
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                // Random starting position
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,

                rotation: Math.random() * 360,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                size: Math.random() * 10 + 5,
                speedY: Math.random() * 30 + 2,
                speedX: Math.random() * 2 - 1,
                speedRotation: (Math.random() - 0.5) * 2
            });
        }
    }
    
    // Draws a single confetti particle
    drawParticle(particle) {
        this.ctx.save();    // Save current canvas state
        this.ctx.translate(particle.x, particle.y);     // Move to particle position
        this.ctx.rotate((particle.rotation * Math.PI) / 180);
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();   // Begin drawing the particle shape
        // Draw a custom shape (elongated hexagon)
        this.ctx.moveTo(-particle.size/2, -particle.size/2);
        this.ctx.lineTo(0, -particle.size);
        this.ctx.lineTo(particle.size/2, -particle.size/2);
        this.ctx.lineTo(particle.size/2, particle.size/2);
        this.ctx.lineTo(-particle.size/2, particle.size/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();     // Restore canvas state
    }
    
    // Updates positions of all particles
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.y += particle.speedY;  // Move down
            particle.x += particle.speedX;  // Drift to the side
            particle.rotation += particle.speedRotation;    // Spin
            
            // Remove particles that have fallen below the screen
            if (particle.y > this.canvas.height + particle.size) {
                this.particles.splice(i, 1);
            }
        }
        
        // Stop animation when all particles are gone
        if (this.particles.length === 0) {
            this.stop();
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);    // Clear previous frame
        
        this.updateParticles();
        this.particles.forEach(particle => this.drawParticle(particle));
        
        if (this.isAnimating) {     // Continue animation if still active
            requestAnimationFrame(() => this.animate());
        }
    }
    
    start() {
        this.isAnimating = true;
        this.particles = [];    // Clear any existing particles
        this.createParticles();
        this.animate();
        

    }
    
    stop() {
        this.isAnimating = false;
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);    // Clear canvas
    }
}

let achievementsUnlocked = new Set();   // Allows achievments to be acheived more than once




/**
 * Checks if any achievements have been unlocked
 */
function checkAchievements() {
    // Check streak achievements
    achievements.streaks.forEach(achievement => {
        if (streak == achievement.requirement) {
            awardAchievement(achievement);
        }
    });

    // Check accuracy achievements
    achievements.accuracy.forEach(achievement => {
        if (!achievement.awarded && 
            totalAttempts == achievement.requirement.questions && 
            (score / totalAttempts) * 100 === achievement.requirement.accuracy) {
            awardAchievement(achievement);
        }
    });
}

/**
 * Displays achievement notification and plays celebration sound
 * @param {Object} achievement - The achievement that was unlocked
 */
function awardAchievement(achievement) {
    // Create achievement notification
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);

}


/**
 * Updates the leaderboard with a new score
 * @param {string} playerName - Name of the player
 * @param {number} score - Player's score
 * 
 *  The updateLeaderboard function handles high scores in the browser's local storage. When a game ends,
 *  it grabs the existing leaderboard data (or creates an empty one if none exists), adds the new score
 *  with the player's name, sorts all scores from highest to lowest, keeps only the top 5 scores, and
 *  saves this back to localStorage. It's like maintaining a "Top 5" list that stays saved even when
 *  you close the browser. 
 */
function updateLeaderboard(playerName, score) {
    // Check if we have a valid player name
    if (!playerName) {
        playerName = localStorage.getItem('currentPlayer') || 'Anonymous';
    }
    
     // Get existing leaderboard from localStorage
    // If no leaderboard exists yet, start with empty array
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    // Add new score entry to leaderboard
    leaderboard.push({ name: playerName, score: score });
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 5
    leaderboard = leaderboard.slice(0, 5);
    
    // Save updated leaderboard back to localStorage
    // Convert array to string with JSON.stringify since localStorage only stores strings
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

/**
 * Displays the leaderboard on the leaderboard page
 */
function displayLeaderboard() {
    // Retrieve leaderboard data from localStorage
    // Parse it from JSON string back to array
    // If no data exists ('||' operator), use empty array as fallback
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const container = document.getElementById('leaderboard-entries');

    // Safety check: if container isn't found, we're not on leaderboard page
    // Exit function early to prevent errors
    if (!container) return; // Only run on leaderboard page
    

    // Clear out any existing entries in the container
    // This prevents duplicate entries when updating
    container.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';   // Add CSS class for styling
        entryElement.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        container.appendChild(entryElement);
    });

    // Fill empty slots if less than 5 entries
    while (container.children.length < 5) {
        const emptyEntry = document.createElement('div');
        emptyEntry.className = 'leaderboard-entry empty';
        emptyEntry.innerHTML = `
            <span class="rank">${container.children.length + 1}</span>
            <span class="name">---</span>
            <span class="score">---</span>
        `;
        container.appendChild(emptyEntry);          // Add this entry to the leaderboard container

    }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    displayLeaderboard(); // This will only run on the leaderboard page
});


// Create the confetti instance
const confetti = new Confetti();

// Initialize the game
generateNewProblem();