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

// Global variables
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedLevel = 'all';
let selectedType = 'all';
let numQuestions = 10;
let quizHistory = [];
let currentQuizAnswers = [];
const MAX_HISTORY_ITEMS = 3; // Limit display to last 3 quizzes

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
    
    // Clear options container
    optionsContainer.innerHTML = '';
    
    // Remove any explanation that might be present
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) explanationDiv.remove();
    
    // Reset start button text
    startBtn.textContent = 'Start Quiz';
    startBtn.disabled = false;
    
    // Reset current quiz answers
    currentQuizAnswers = [];
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

// Fetch and display version information
function fetchVersionInfo() {
    fetch('/api/version')
        .then(response => response.json())
        .then(data => {

            const versionElement = document.getElementById('version-number');
            if (versionElement) {
                // Make sure we have valid data
                if (!data) {
                    versionElement.textContent = 'v1.0.0';
                    return;
                }
                
                // Ensure we have version property
                const version = data.version || '1.0.0';
                const gitCommit = data.gitCommit || '';
                
                // Display version and git commit hash separately for better visibility
                let displayVersion = `v${version}`;
                
                // Create or get commit element
                let commitElement = document.getElementById('commit-hash');
                if (!commitElement) {
                    commitElement = document.createElement('span');
                    commitElement.id = 'commit-hash';
                    commitElement.className = 'commit-hash';
                    versionElement.parentNode.appendChild(commitElement);
                }
                
                // Set version and commit separately
                versionElement.textContent = displayVersion;
                
                if (gitCommit && gitCommit !== 'unknown') {
                    commitElement.textContent = `#${gitCommit}`;
                    commitElement.style.display = 'inline';
                } else {
                    commitElement.style.display = 'none';
                }
                

                
                // Add build date as tooltip if available
                if (data.buildDate) {
                    versionElement.title = `Built on: ${data.buildDate}`;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching version info:', error);
            const versionElement = document.getElementById('version-number');
            if (versionElement) {
                versionElement.textContent = 'v1.0.0';
            }
        });
}

// Initialize the app
function init() {
    // Load quiz history from localStorage
    loadQuizHistory();
    
    // Fetch git commit version
    fetchVersionInfo();
    
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', showNextQuestion);
    restartBtn.addEventListener('click', resetQuiz);
    
    // Add event listener for home icon
    homeIcon.addEventListener('click', goHome);
    
    // Add event listener for clear history button
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearQuizHistory);
    }
    
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
    // Remove any existing error messages
    const errorElement = document.getElementById('quiz-error-message');
    if (errorElement) {
        errorElement.remove();
    }
    
    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;
    questions = [];
    currentQuizAnswers = [];
    currentScoreEl.textContent = '0';
    
    // Clear options container
    optionsContainer.innerHTML = '';
    
    // Remove any explanation that might be present
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) explanationDiv.remove();
    
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
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        return Promise.reject(new Error(err.error || 'Failed to load questions'));
                    });
                }
                return response.json();
            })
            .then(data => {
                questions = data;
                

                
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
            })
            .catch(error => {
                console.error('Error in fetch:', error);
                
                // Create or get error message element
                let errorElement = document.getElementById('quiz-error-message');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = 'quiz-error-message';
                    errorElement.style.color = '#0277bd';
                    errorElement.style.margin = '15px 0';
                    errorElement.style.padding = '10px';
                    errorElement.style.backgroundColor = '#e1f5fe';
                    errorElement.style.borderRadius = '4px';
                    errorElement.style.borderLeft = '4px solid #0277bd';
                    
                    // Insert the error message before the start button
                    const startButtonContainer = startBtn.parentElement;
                    startButtonContainer.insertBefore(errorElement, startBtn);
                }
                
                // Set error message with helpful guidance
                errorElement.innerHTML = `
                    <strong>Let's try something else!</strong><br>
                    ${error.message || 'We need a different combination.'}<br>
                    <small>Try selecting a different level or question type to find available questions.</small>
                `;
                
                // Scroll to error message
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Reset button state
                startBtn.disabled = false;
                startBtn.textContent = 'Try Again';
            });
    } catch (error) {
        console.error('Error starting quiz (outside fetch):', error);
        
        // Create or get error message element
        let errorElement = document.getElementById('quiz-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'quiz-error-message';
            errorElement.style.color = '#0277bd';
            errorElement.style.margin = '15px 0';
            errorElement.style.padding = '10px';
            errorElement.style.backgroundColor = '#e1f5fe';
            errorElement.style.borderRadius = '4px';
            errorElement.style.borderLeft = '4px solid #0277bd';
            
            // Insert the error message before the start button
            const startButtonContainer = startBtn.parentElement;
            startButtonContainer.insertBefore(errorElement, startBtn);
        }
        
        // Set error message with helpful guidance
        errorElement.innerHTML = `
            <strong>Let's try again</strong><br>
            ${error.message || 'Something unexpected happened.'}<br>
            <small>Please try again or refresh the page to continue.</small>
        `;
        
        // Scroll to error message
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Reset button state
        startBtn.disabled = false;
        startBtn.textContent = 'Try Again';
    }
}

// Function to parse markdown if available
function parseMarkdown(text) {
    // Check if the marked library is available (it's loaded via script tag)
    if (typeof marked !== 'undefined') {
        try {
            return marked.parse(text);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return text; // Return original text if parsing fails
        }
    } else {
        return text; // Return original text if marked is not available
    }
}

// Show current question
function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        console.error('No question found at index', currentQuestionIndex);
        goHome(); // Return to home screen if there's an error
        return;
    }
    


    // Update progress
    updateProgressBar();

    // Set question title and text with markdown support
    let html = '';
    if (currentQuestion.title) {
        html += `<div class="question-title">${parseMarkdown(currentQuestion.title)}</div>`;
    }
    html += `<div>${parseMarkdown(currentQuestion.question)}</div>`;
    questionText.innerHTML = html;

    // Clear previous options and explanation
    optionsContainer.innerHTML = '';
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) explanationDiv.remove();

    // Create and append option buttons (letters are already added by the server)
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        
        // Extract the letter prefix (e.g., "A. ") and the rest of the option text
        const match = option.match(/^([A-Z])\. (.+)$/);
        if (match) {
            const letter = match[1];
            const optionText = match[2];
            
            // Create a span for the letter prefix
            const letterSpan = document.createElement('span');
            letterSpan.className = 'option-letter';
            letterSpan.textContent = letter;
            button.appendChild(letterSpan);
            
            // Create a span for the option text with markdown support
            const textSpan = document.createElement('span');
            textSpan.className = 'option-text';
            textSpan.innerHTML = parseMarkdown(optionText);
            button.appendChild(textSpan);
        } else {
            // Fallback if the option doesn't match the expected format
            button.textContent = option;
        }
        
        button.dataset.index = index;
        button.addEventListener('click', selectAnswer);
        optionsContainer.appendChild(button);
    });

    // Hide next button until an answer is selected
    nextBtn.classList.add('hidden');
}

// Handle answer selection
function selectAnswer(e) {
    // Find the button element (might be a child element that was clicked)
    const selectedButton = e.target.closest('.option-btn');
    if (!selectedButton) return; // Exit if we couldn't find the button
    
    const selectedAnswer = parseInt(selectedButton.dataset.index);
    const currentQuestion = questions[currentQuestionIndex];
    
    // Track this answer for history
    currentQuizAnswers.push({
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedAnswer: selectedAnswer,
        correctAnswer: currentQuestion.answer,
        isCorrect: selectedAnswer === currentQuestion.answer
    });

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
        // Force the incorrect class to be applied

        selectedButton.classList.add('incorrect');
        
        // Show correct answer - make sure we're highlighting the right one
        const correctButton = optionButtons[currentQuestion.answer];
        if (correctButton) {
            correctButton.classList.add('correct');

        } else {
            console.error('Could not find correct button at index:', currentQuestion.answer);
        }
        
        // Add explanation if available
        if (currentQuestion.explanation) {
            // Remove any existing explanation
            const existingExplanation = document.getElementById('explanation');
            if (existingExplanation) {
                existingExplanation.remove();
            }
            
            const explanationDiv = document.createElement('div');
            explanationDiv.id = 'explanation';
            explanationDiv.className = 'explanation-block';
            explanationDiv.innerHTML = `<strong>Explanation:</strong> ${parseMarkdown(currentQuestion.explanation)}`;
            
            // Insert the explanation at the end of the options container
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
    
    // Save quiz to history
    const quizDate = new Date();
    
    const quizRecord = {
        date: quizDate.toISOString(),
        level: selectedLevel,
        type: selectedType,
        numQuestions: questions.length,
        score: score,
        percentage: percentage,
        answers: currentQuizAnswers
    };
    
    // Add to history and save
    quizHistory.unshift(quizRecord);
    // Allow storing more items in localStorage than we display
    const MAX_STORED_HISTORY = 50;
    if (quizHistory.length > MAX_STORED_HISTORY) {
        quizHistory = quizHistory.slice(0, MAX_STORED_HISTORY);
    }
    saveQuizHistory();
    
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
    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;
    questions = [];
    
    // Reset UI
    resultScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // Reset button state
    startBtn.disabled = false;
    startBtn.textContent = 'Start Quiz';
    
    // Reset score display
    currentScoreEl.textContent = '0';
    
    // Reset current quiz answers
    currentQuizAnswers = [];
    
    // Clear any options container content
    optionsContainer.innerHTML = '';
    
    // Remove any explanation that might be present
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) explanationDiv.remove();
    
    // Update history display
    updateHistoryDisplay();
}

// Save quiz history to localStorage
function saveQuizHistory() {
    // Save to localStorage
    localStorage.setItem('jlptQuizHistory', JSON.stringify(quizHistory));

}

// Load quiz history from localStorage
function loadQuizHistory() {
    const savedHistory = localStorage.getItem('jlptQuizHistory');
    if (savedHistory) {
        try {
            quizHistory = JSON.parse(savedHistory);

        } catch (error) {
            console.error('Error parsing quiz history from localStorage:', error);
            quizHistory = [];
        }
    } else {
        quizHistory = [];
    }
    updateHistoryDisplay();
}

// Clear quiz history
function clearQuizHistory() {
    if (confirm('Are you sure you want to clear your entire quiz history?')) {
        // Clear local history array
        quizHistory = [];
        
        // Clear localStorage
        localStorage.removeItem('jlptQuizHistory');

        
        // Update the display
        updateHistoryDisplay();
    }
}

// Update the history display on the home page
function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    
    // Clear current content
    historyList.innerHTML = '';
    
    if (quizHistory.length === 0) {
        const noHistory = document.createElement('p');
        noHistory.className = 'no-history';
        noHistory.textContent = 'No quiz history yet. Take a quiz to see your results here!';
        historyList.appendChild(noHistory);
        return;
    }
    
    // Add only the last 3 history items
    quizHistory.slice(0, MAX_HISTORY_ITEMS).forEach((quiz, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Format date
        const quizDate = new Date(quiz.date);
        const formattedDate = quizDate.toLocaleDateString() + ' ' + quizDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Create header with date and score
        const header = document.createElement('div');
        header.className = 'history-item-header';
        header.innerHTML = `
            <span>${formattedDate}</span>
            <span class="history-item-score">${quiz.score}/${quiz.numQuestions} (${quiz.percentage}%)</span>
        `;
        
        // Create details section
        const details = document.createElement('div');
        details.className = 'history-item-details';
        details.innerHTML = `
            <div>Level: ${quiz.level.toUpperCase()}</div>
            <div>Type: ${quiz.type.charAt(0).toUpperCase() + quiz.type.slice(1)}</div>
        `;
        
        // Add to history item
        historyItem.appendChild(header);
        historyItem.appendChild(details);
        
        // Add questions summary if available
        if (quiz.answers && quiz.answers.length > 0) {
            const questionsDiv = document.createElement('div');
            questionsDiv.className = 'history-item-questions';
            questionsDiv.textContent = `Questions: ${quiz.answers.filter(a => a.isCorrect).length} correct, ${quiz.answers.filter(a => !a.isCorrect).length} incorrect`;
            historyItem.appendChild(questionsDiv);
        }
        
        historyList.appendChild(historyItem);
    });
}

// Theme toggle functionality
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply the saved theme or device preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    
    // Handle theme toggle click
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme;
        
        if (currentTheme === 'dark') {
            newTheme = null; // Use default (light) theme
            document.documentElement.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            newTheme = 'dark';
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
        
        localStorage.setItem('theme', newTheme);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    init();
    fetchVersionInfo();
    initThemeToggle();
});
