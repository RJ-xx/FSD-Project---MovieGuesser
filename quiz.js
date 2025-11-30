const MOVIE_POSTERS = [
    { 
        url: "https://your-image-host.com/path/to/poster/your_movie_1.jpg", 
        correct: "Your Movie Title 1", 
        lang: "Film Language (e.g., Hindi)" 
    },
    
    { 
        url: "https://another-host.io/posters/your_movie_2.jpg", 
        correct: "Your Movie Title 2", 
        lang: "Film Language (e.g., Telugu)" 
    },
    
    { 
        url: "https://last-host.net/posters/your_movie_50.jpg", 
        correct: "Your Movie Title 50", 
        lang: "Film Language (e.g., Kannada)" 
    }
    
];

// --- 2. DOM ELEMENTS & GAME STATE ---
const NUM_ROUNDS = 5;
const timeLimit = 15; // seconds

const posterEl = document.getElementById('poster');
const posterSubEl = document.getElementById('posterSub');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const attemptsEl = document.getElementById('attempts');
const optionsContainer = document.getElementById('optionsContainer');
const nextBtn = document.getElementById('nextBtn');
const revealBtn = document.getElementById('revealBtn');
const feedbackArea = document.getElementById('feedbackArea');
const timeLeftEl = document.getElementById('timeLeft');
const timeFillEl = document.getElementById('timeFill');
const startButton = document.getElementById('startButton');
const coverPage = document.getElementById('coverPage');
const movieListEl = document.getElementById('movieList');
const roundCircles = document.querySelectorAll('.round-circles .circle');

let availableMovies = [...MOVIE_POSTERS];
let currentMovie = null;
let score = 0;
let streak = 0;
let attempts = 0;
let round = 0;
let timer = null;
let questionAnswered = false;

// --- 3. HELPER FUNCTIONS ---

/** Shuffles the elements of an array in place (Fisher-Yates algorithm). */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/** Updates the displayed score, streak, and attempts. */
function updateStats() {
    scoreEl.textContent = score;
    attemptsEl.textContent = attempts;
    streakEl.textContent = streak;
}

/** Pre-populates the movie list in the <details> section. */
function populateMovieList() {
    movieListEl.innerHTML = MOVIE_POSTERS.map(movie => 
        // Use the movie title instead of the image in the list preview
        `<div>${movie.correct} (${movie.lang})</div>`
    ).join('');
}

/** Enables or disables option and control elements. */
function toggleControls(enableOptions, enableNext) {
    const options = optionsContainer.querySelectorAll('.option-btn');
    options.forEach(btn => btn.disabled = !enableOptions);
    
    // Only enable Reveal if options are enabled (i.e., question is active)
    revealBtn.disabled = !enableOptions;

    if (enableNext) {
        nextBtn.classList.remove('disabled');
        nextBtn.disabled = false;
    } else {
        nextBtn.classList.add('disabled');
        nextBtn.disabled = true;
    }
}

/** Resets timer visually and stops the interval. */
function stopTimer(reset = true) {
    clearInterval(timer);
    if (reset) {
        timeLeftEl.textContent = `${timeLimit}s`;
        timeFillEl.style.width = '100%';
        timeLeftEl.style.color = 'var(--color-success)';
    }
}

/** Starts the countdown timer. */
function startTimer() {
    stopTimer();
    let currentTime = timeLimit;

    // Reset bar transition for the new countdown
    timeFillEl.style.transition = 'none';
    timeFillEl.style.width = '100%';
    timeLeftEl.style.color = 'var(--color-success)';

    // Set transition duration right before starting the countdown
    setTimeout(() => {
        timeFillEl.style.transition = `width ${timeLimit}s linear`;
        timeFillEl.style.width = '0%';
    }, 50); 
    
    // Update text and color every second
    timer = setInterval(() => {
        currentTime--;
        timeLeftEl.textContent = `${currentTime}s`;

        if (currentTime <= 5) {
            timeLeftEl.style.color = 'var(--color-secondary)'; // Red/Orange
        }

        if (currentTime <= 0) {
            handleTimeout();
        }
    }, 1000);
}

/** Handles the game end or transition to the next state. */
function finishRound() {
    round++;
    if (round > NUM_ROUNDS) {
        handleGameOver();
    } else {
        // Update round marker
        roundCircles.forEach((circle, index) => {
            circle.classList.remove('current');
            if (index + 1 === round) {
                circle.classList.add('current');
            }
        });
        loadQuestion();
    }
}

/** Generates and shuffles options for the current movie. */
function renderOptions() {
    optionsContainer.innerHTML = '';
    
    // 1. Get the correct answer
    const correctAnswer = currentMovie.correct;
    
    // 2. Collect all incorrect options (all other movie titles)
    const incorrectOptionsPool = MOVIE_POSTERS
        .map(movie => movie.correct) // Get all titles
        .filter(title => title !== correctAnswer); // Exclude the correct answer
        
    const NUM_INCORRECT_OPTIONS = 3;
    let finalOptions = [correctAnswer]; // Start with the correct answer
    
    // 3. Shuffle the pool and select the required number of incorrect options
    shuffleArray(incorrectOptionsPool);
    const selectedIncorrectOptions = incorrectOptionsPool.slice(0, NUM_INCORRECT_OPTIONS);
    
    // 4. Combine and shuffle the final list of 4 options
    finalOptions.push(...selectedIncorrectOptions);
    shuffleArray(finalOptions); // Shuffle the final array to randomize the position of the correct answer

    // 5. Render the buttons
    finalOptions.forEach(title => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        button.textContent = title;
        button.setAttribute('data-value', title);
        button.type = 'button';
        button.addEventListener('click', handleGuess);
        optionsContainer.appendChild(button);
    });
}

// --- 4. GAME LOGIC ---

/** Selects and displays a new movie poster and options. */
function loadQuestion() {
    stopTimer();
    questionAnswered = false;
    feedbackArea.textContent = 'Click an option to submit your answer.';
    feedbackArea.className = 'feedback';
    
    if (availableMovies.length === 0) {
        // Reset available movies if all were used (in case of extension beyond initial 5 rounds)
        availableMovies = [...MOVIE_POSTERS];
    }
    
    // Select a random movie and remove it from the available pool
    const index = Math.floor(Math.random() * availableMovies.length);
    currentMovie = availableMovies[index];
    availableMovies.splice(index, 1);
    
    // Use an <img> tag for the poster element
    // Note: The alt text is important for accessibility.
    posterEl.innerHTML = `<img src="${currentMovie.url}" alt="Movie Poster" class="actual-poster">`; 
    posterSubEl.textContent = `Language: ${currentMovie.lang}`;
    
    renderOptions();
    toggleControls(true, false);
    startTimer();
}

/** Handles a user clicking one of the multiple-choice buttons. */
function handleGuess(event) {
    if (questionAnswered) return;
    
    stopTimer(false);
    questionAnswered = true;
    attempts++;
    
    const selectedButton = event.target;
    const guess = selectedButton.getAttribute('data-value');
    const isCorrect = guess === currentMovie.correct;

    // Mark all buttons as disabled after the first guess
    toggleControls(false, true);

    if (isCorrect) {
        score += 100;
        streak++;
        feedbackArea.className = 'feedback correct';
        feedbackArea.innerHTML = `✅ Correct! You earned 100 points.`;
        selectedButton.classList.add('correct');
    } else {
        streak = 0;
        feedbackArea.className = 'feedback incorrect';
        feedbackArea.innerHTML = `❌ Incorrect. The correct movie was <strong>${currentMovie.correct}</strong>.`;
        selectedButton.classList.add('incorrect');
        
        // Highlight the correct answer
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.getAttribute('data-value') === currentMovie.correct) {
                btn.classList.add('correct');
            }
        });
    }

    updateStats();
}

/** Reveals the answer if the user can't guess in time or chooses to reveal. */
function handleReveal() {
    if (questionAnswered) return;
    
    stopTimer(false);
    questionAnswered = true;
    attempts++;
    streak = 0;
    
    toggleControls(false, true);
    updateStats();
    
    feedbackArea.className = 'feedback incorrect';
    feedbackArea.innerHTML = `Time was remaining but you revealed. The answer was <strong>${currentMovie.correct}</strong>.`;
    
    // Highlight the correct answer
    optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.getAttribute('data-value') === currentMovie.correct) {
            btn.classList.add('correct');
        }
    });
}

/** Logic for when the timer runs out. */
function handleTimeout() {
    if (questionAnswered) return;

    stopTimer(false);
    questionAnswered = true;
    attempts++;
    streak = 0;
    updateStats();

    feedbackArea.className = 'feedback incorrect';
    feedbackArea.innerHTML = `Time up! The correct movie was <strong>${currentMovie.correct}</strong>.`;
    
    // Highlight the correct answer
    optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        if (btn.getAttribute('data-value') === currentMovie.correct) {
            btn.classList.add('correct');
        }
    });

    toggleControls(false, true);
}

/** Handles the end of the game (after the final round). */
function handleGameOver() {
    stopTimer(true);
    feedbackArea.className = 'feedback';
    feedbackArea.innerHTML = `<h2>Game Over!</h2>Your final score is <strong>${score}</strong> out of ${NUM_ROUNDS * 100}.`;
    
    // Hide controls and options
    optionsContainer.innerHTML = '';
    nextBtn.style.display = 'none';
    revealBtn.style.display = 'none';
    posterSubEl.textContent = 'Click "Start Quiz" to play again.';
    
    // Re-show the start button logic
    setTimeout(() => {
        startButton.textContent = 'Play Again';
        coverPage.classList.remove('hidden');
    }, 2000);
}

// --- 5. INITIALIZATION & EVENT LISTENERS ---

function initializeGame() {
    // Reset State
    availableMovies = [...MOVIE_POSTERS];
    score = 0;
    streak = 0;
    attempts = 0;
    round = 1;

    // Reset Round Circles
    roundCircles.forEach((circle, index) => {
        circle.classList.remove('current');
        if (index === 0) {
            circle.classList.add('current');
        }
    });
    
    updateStats();
    nextBtn.style.display = 'block';
    revealBtn.style.display = 'block';
    loadQuestion();
}

// Event listeners
startButton.addEventListener('click', () => {
    coverPage.classList.add('hidden');
    initializeGame();
});

nextBtn.addEventListener('click', finishRound);
revealBtn.addEventListener('click', handleReveal);

// Initial setup
window.onload = () => {
    populateMovieList();
    // Hide the quiz container initially, waiting for the start button click
    // Note: The cover page CSS handles hiding the quiz content
};