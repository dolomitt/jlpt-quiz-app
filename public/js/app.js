// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar');
const currentScoreEl = document.getElementById('current-score');
const totalQuestionsEl = document.getElementById('total-questions');
const finalScoreEl = document.getElementById('final-score');
const totalQuestionsFinalEl = document.getElementById('total-questions-final');
const percentageEl = document.getElementById('percentage');
const resultMessageEl = document.getElementById('result-message');
const homeIcon = document.getElementById('home-icon');

// Quiz state
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let selectedLevel = 'all';
let selectedType = 'all';

// Home button logic
function goHome() {
    // Hide quiz and result screens
    quizScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    // Show start screen
    startScreen.classList.remove('hidden');
    // Reset quiz state
    questions = [];
    currentQuestionIndex = 0;
    score = 0;
    currentScoreEl.textContent = '0';
    progressBar.style.width = '0%';
    // Reset start button text
    startBtn.textContent = 'Start Quiz';
    startBtn.disabled = false;
}

// Reset quiz
function resetQuiz() {
    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;
    questions = []; // Clear questions array to force a fresh fetch
    
    // Update UI
    currentScoreEl.textContent = '0';
    progressBar.style.width = '0%';
    
    // Hide result screen and show start screen
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// Initialize the app
function init() {
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', showNextQuestion);
    restartBtn.addEventListener('click', resetQuiz);
    
    // Add event listener for home icon
    homeIcon.addEventListener('click', goHome);
    
    // Add event listeners for radio buttons
    document.querySelectorAll('input[name="level"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedLevel = e.target.value;
                // Update selected class
                document.querySelectorAll('input[name="level"]').forEach(r => {
                    r.closest('.radio-label').classList.remove('selected');
                });
                e.target.closest('.radio-label').classList.add('selected');
            }
        });
    });
    
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedType = e.target.value;
                // Update selected class
                document.querySelectorAll('input[name="type"]').forEach(r => {
                    r.closest('.radio-label').classList.remove('selected');
                });
                e.target.closest('.radio-label').classList.add('selected');
            }
        });
    });
    
    document.querySelectorAll('input[name="limit"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                numQuestions = parseInt(e.target.value);
                // Update selected class
                document.querySelectorAll('input[name="limit"]').forEach(r => {
                    r.closest('.radio-label').classList.remove('selected');
                });
                e.target.closest('.radio-label').classList.add('selected');
            }
        });
    });
}

// Start the quiz
async function startQuiz() {
    // Get selected values from radio buttons
    const selectedLevelRadio = document.querySelector('input[name="level"]:checked');
    const selectedTypeRadio = document.querySelector('input[name="type"]:checked');
    const selectedLimitRadio = document.querySelector('input[name="limit"]:checked');
    
    // Set values from radio buttons
    selectedLevel = selectedLevelRadio ? selectedLevelRadio.value : 'all';
    selectedType = selectedTypeRadio ? selectedTypeRadio.value : 'all';
    numQuestions = selectedLimitRadio ? parseInt(selectedLimitRadio.value) : 10;
    
    try {
        // Show loading state
        startBtn.disabled = true;
        startBtn.textContent = 'Loading...';
        
        // Fetch questions from API
        fetch(`/api/questions?level=${selectedLevel}&type=${selectedType}&limit=${numQuestions}`)
            .then(response => response.json())
            .then(data => {
                questions = data;
                
                // Debug: Log all questions and their answers
                console.log('DEBUG: All questions loaded:', questions);
                questions.forEach((q, i) => {
                    console.log(`DEBUG: Question ${i+1}:`, q.question);
                    console.log(`DEBUG: Options:`, q.options);
                    console.log(`DEBUG: Correct answer index:`, q.answer);
                    console.log(`DEBUG: Correct answer:`, q.options[q.answer]);
                    console.log('---');
                });
                
                // Update total questions count
                totalQuestionsEl.textContent = questions.length;
                totalQuestionsFinalEl.textContent = questions.length;
                
                // Show first question
                showQuestion();
                
                // Update UI
                startScreen.classList.add('hidden');
                quizScreen.classList.remove('hidden');
                
                // Reset button
                startBtn.textContent = 'Start Quiz';
                startBtn.disabled = false;
            });
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Failed to load questions. Please try again.');
        startBtn.disabled = false;
        startBtn.textContent = 'Start Quiz';
    }
}

// Show current question
function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Check if currentQuestion is defined
    if (!currentQuestion) {
        console.error('Error: No question found at index', currentQuestionIndex);
        alert('Error loading question. Please try again.');
        goHome(); // Return to home screen if there's an error
        return;
    }
    
    // Debug: log current question and answer index
    console.log('DEBUG: Question:', currentQuestion.question);
    console.log('DEBUG: Options:', currentQuestion.options);
    console.log('DEBUG: Correct answer index:', currentQuestion.answer, 'Correct answer value:', currentQuestion.options[currentQuestion.answer]);

    // Update progress
    updateProgressBar();

    // Set question title and text
    let html = '';
    if (currentQuestion.title) {
        html += `<div class="question-title">${currentQuestion.title}</div>`;
    }
    html += `<div>${currentQuestion.question}</div>`;
    questionText.innerHTML = html;

    // Clear previous options and explanation
    optionsContainer.innerHTML = '';
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) explanationDiv.remove();

    // Create and append option buttons
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.dataset.index = index;
        button.addEventListener('click', selectAnswer);
        optionsContainer.appendChild(button);
    });

    // Hide next button until an answer is selected
    nextBtn.classList.add('hidden');
}

// Handle answer selection
function selectAnswer(e) {
    const selectedButton = e.target;
    const selectedAnswer = parseInt(selectedButton.dataset.index);
    const currentQuestion = questions[currentQuestionIndex];

    // Debug logging
    console.log('DEBUG: Selected answer index:', selectedAnswer);
    console.log('DEBUG: Selected answer text:', selectedButton.textContent);
    console.log('DEBUG: Correct answer index from backend:', currentQuestion.answer);
    console.log('DEBUG: Correct answer text:', currentQuestion.options[currentQuestion.answer]);
    
    // Disable all options
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
        button.disabled = true;
        button.removeEventListener('click', selectAnswer);
    });

    // Check if answer is correct - ensure we're using the backend's answer index
    const isCorrect = selectedAnswer === currentQuestion.answer;
    console.log('DEBUG: Is answer correct?', isCorrect);

    // Update UI based on answer
    if (isCorrect) {
        selectedButton.classList.add('correct');
        score++;
        currentScoreEl.textContent = score;
    } else {
        selectedButton.classList.add('incorrect');
        // Show correct answer - make sure we're highlighting the right one
        const correctButton = optionButtons[currentQuestion.answer];
        correctButton.classList.add('correct');
        console.log('DEBUG: Highlighting as correct:', correctButton.textContent);
        
        // Show explanation if available
        if (currentQuestion.explanation) {
            let explanationDiv = document.createElement('div');
            explanationDiv.id = 'explanation';
            explanationDiv.className = 'explanation-block';
            explanationDiv.innerHTML = `<strong>Explanation:</strong> ${currentQuestion.explanation}`;
            optionsContainer.appendChild(explanationDiv);
        }
    }

    // Show next button
    nextBtn.classList.remove('hidden');
}

// Show next question or results
function showNextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

// Show quiz results
function showResults() {
    const percentage = Math.round((score / questions.length) * 100);
    
    // Update result elements
    finalScoreEl.textContent = score;
    totalQuestionsFinalEl.textContent = questions.length;
    percentageEl.textContent = percentage;
    
    // Set result message
    let message = '';
    if (percentage >= 80) {
        message = '素晴らしいです！ (Excellent!)';
    } else if (percentage >= 60) {
        message = 'よくできました！ (Good job!)';
    } else if (percentage >= 40) {
        message = 'もう少し頑張りましょう！ (Keep practicing!)';
    } else {
        message = '頑張ってください！ (Keep trying!)';
    }
    resultMessageEl.textContent = message;
    
    // Show result screen
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Update progress bar
function updateProgressBar() {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Reset quiz
function resetQuiz() {
    // Reset UI
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // Reset button state
    startBtn.disabled = false;
    startBtn.textContent = 'Start Quiz';
    
    // Reset score display
    currentScoreEl.textContent = '0';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
