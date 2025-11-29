/* ========== CONFIG ========== */
const PER_MOVIE_SECONDS = 15;

/* ========== MOVIES (Edit as you wish) ========== */
const MOVIES = [
    // Kannada
    { poster: "⛏👑💰", title: "KGF", alt: ["kgf", "kgf chapter 1", "kgf chapter 2"], lang: "Kannada" },
    { poster: "🐗🔥🌲", title: "Kantara", alt: ["kantara"], lang: "Kannada" },
    { poster: "🌧🗡🌲", title: "Vikrant Rona", alt: ["vikrant rona", "vikrant"], lang: "Kannada" },
    { poster: "🎓🎉🎸", title: "Kirik Party", alt: ["kirik party"], lang: "Kannada" },

    // Hindi
    { poster: "👨‍🎓📚🔧", title: "3 Idiots", alt: ["3 idiots", "three idiots"], lang: "Hindi" },
    { poster: "🤼‍♂🏆👩‍👧", title: "Dangal", alt: ["dangal"], lang: "Hindi" },
    { poster: "🕶👤🔫", title: "Pathaan", alt: ["pathaan", "pathan"], lang: "Hindi" },
    { poster: "🇮🇳🎖🕊", title: "Shershaah", alt: ["shershaah", "shershah"], lang: "Hindi" },

    // Telugu
    { poster: "🏰⚔👑", title: "Baahubali", alt: ["baahubali", "bahubali"], lang: "Telugu" },
    { poster: "🔥🌊🤜🤛", title: "RRR", alt: ["rrr"], lang: "Telugu" },
    { poster: "🪵🌾🔴", title: "Pushpa", alt: ["pushpa"], lang: "Telugu" },
    { poster: "🩺💔🔥", title: "Arjun Reddy", alt: ["arjun reddy", "arjunreddy"], lang: "Telugu" }
];

/* ========== STATE ========== */
let pool = [];
let currentIndex = 0;
let current = null;

let score = 0, streak = 0, attempts = 0;
let timer = null;
let timeRemaining = PER_MOVIE_SECONDS;
let answered = false;

/* ========== DOM ========== */
const posterEl      = document.getElementById('poster');
const posterSub     = document.getElementById('posterSub');
const guessInput    = document.getElementById('guessInput');
const guessBtn      = document.getElementById('guessBtn');
const revealBtn     = document.getElementById('revealBtn');
const nextBtn       = document.getElementById('nextBtn');
const shuffleBtn    = document.getElementById('shuffleBtn');

const feedbackArea  = document.getElementById('feedbackArea');
const scoreEl       = document.getElementById('score');
const streakEl      = document.getElementById('streak');
const attemptsEl    = document.getElementById('attempts');

const timeLeftEl    = document.getElementById('timeLeft');
const timeFillEl    = document.getElementById('timeFill');

const movieListEl   = document.getElementById('movieList');

/* ========== UTIL ========== */
function normalize(s) {
    if (!s) return "";
    try {
        s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    } catch (e) { }
    return s.toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .replace(/\bthe\s+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isCorrectGuess(guess, movie) {
    const ng = normalize(guess);
    if (!ng) return false;

    if (normalize(movie.title) === ng) return true;

    for (const a of movie.alt || []) {
        if (normalize(a) === ng) return true;
    }

    const t = normalize(movie.title);
    if (ng.length >= 3 && (t.includes(ng) || ng.includes(t))) return true;

    return false;
}

/* ========== POOL HANDLING ========== */
function buildPool() {
    pool = MOVIES.slice();
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    currentIndex = 0;
    current = pool[currentIndex] || null;
}

function renderCurrent() {
    answered = false;

    if (!current) {
        posterEl.textContent = "✅";
        posterSub.textContent = "No more movies — Shuffle to play again";
        guessInput.disabled = true;
        guessInput.value = "";
        stopTimer();
        return;
    }

    posterEl.textContent = current.poster;
    posterSub.textContent = `${current.lang} — guess the movie`;
    guessInput.disabled = false;
    guessInput.value = "";
    feedbackArea.innerHTML = "";

    guessInput.focus();
    resetTimer();
}

/* ========== TIMER ========== */
function startTimer() {
    stopTimer();
    timeRemaining = PER_MOVIE_SECONDS;
    updateTimeUI();

    timer = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            stopTimer();
            handleTimeout();
        } else {
            updateTimeUI();
        }
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function resetTimer() {
    stopTimer();
    timeRemaining = PER_MOVIE_SECONDS;
    updateTimeUI();
    setTimeout(() => startTimer(), 200);
}

function updateTimeUI() {
    timeLeftEl.textContent = timeRemaining + "s";
    const pct = Math.max(0, (timeRemaining / PER_MOVIE_SECONDS) * 100);
    timeFillEl.style.width = pct + "%";
}

/* ========== GAME LOGIC ========== */
function givePoints(correct) {
    attempts++;
    if (correct) {
        score += 10;
        streak++;
    } else {
        streak = 0;
    }
    updateStats();
}

function updateStats() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    attemptsEl.textContent = attempts;
}

function showMessage(msg, type = "ok") {
    feedbackArea.innerHTML =
        `<div class="message ${type === "ok" ? "ok" : "bad"}">${escapeHtml(msg)}</div>`;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

function revealCorrect(reason = "") {
    if (!current) return;
    answered = true;

    stopTimer();
    givePoints(false);

    showMessage(`Answer: "${current.title}" ${reason}`, "bad");

    guessInput.disabled = true;
}

function handleCorrect() {
    stopTimer();
    givePoints(true);
    showMessage(`Correct! 🎉 It was "${current.title}". +10 points.`, "ok");
    answered = true;
    guessInput.disabled = true;
}

function handleTimeout() {
    revealCorrect("— Time's up!");
    setTimeout(() => nextMovie(), 1400);
}

function onGuess() {
    if (!current || answered) return;

    const guess = guessInput.value.trim();
    if (!guess) {
        showMessage("Please type a guess.", "bad");
        return;
    }

    if (isCorrectGuess(guess, current)) {
        handleCorrect();
        setTimeout(() => nextMovie(), 900);
    } else {
        revealCorrect("— Incorrect submission");
        setTimeout(() => nextMovie(), 1200);
    }
}

/* ========== NAVIGATION ========== */
function nextMovie() {
    currentIndex++;
    if (currentIndex >= pool.length) current = null;
    else current = pool[currentIndex];

    renderCurrent();
}

function shuffleAndStart() {
    buildPool();
    renderCurrent();
    showMessage("Shuffled — good luck!", "ok");
    updateMovieList();
}

/* ========== MOVIE LIST UI ========== */
function updateMovieList() {
    movieListEl.innerHTML = "";
    MOVIES.forEach(m => {
        const row = document.createElement("div");
        row.style.padding = "6px 4px";
        row.style.borderBottom = "1px dashed rgba(255,255,255,0.05)";
        row.innerHTML =
            `<strong style="color:#e6eef6">${m.poster}</strong> &nbsp;
             <span style="color:var(--muted)">${m.title}</span> &nbsp;
             <em style="color:var(--muted)">(${m.lang})</em>`;
        movieListEl.appendChild(row);
    });
}

/* ========== EVENTS ========== */
guessBtn.addEventListener("click", onGuess);
guessInput.addEventListener("keydown", e => {
    if (e.key === "Enter") onGuess();
});
revealBtn.addEventListener("click", () => {
    if (!answered) revealCorrect("— Revealed by user");
});
nextBtn.addEventListener("click", () => {
    stopTimer();
    nextMovie();
});
shuffleBtn.addEventListener("click", () => shuffleAndStart());

/* ========== INIT ========== */
function init() {
    score = 0;
    streak = 0;
    attempts = 0;
    updateStats();

    updateMovieList();
    buildPool();
    renderCurrent();
}

init();
