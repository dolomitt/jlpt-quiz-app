const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const { execSync } = require('child_process');
const { marked } = require('marked');

// Configure marked for safe rendering
marked.setOptions({
  sanitize: true, // Sanitize HTML tags
  breaks: true,   // Convert line breaks to <br>
  gfm: true       // Enable GitHub Flavored Markdown
});

// Load version information from version.json if it exists, otherwise use defaults
let versionInfo = { version: '1.0.0', gitCommit: 'unknown', buildDate: new Date().toISOString() };
try {
  if (fs.existsSync(path.join(__dirname, 'version.json'))) {
    versionInfo = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
    console.log('Loaded version information:', versionInfo);
  } else {
    console.log('No version.json file found, using defaults');
  }
} catch (error) {
  console.error('Error loading version information:', error);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());


// Load questions from YAML file
function loadQuestions() {
  try {
    const fileContents = fs.readFileSync(path.join(__dirname, 'questions.yaml'), 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error('Error loading questions:', e.message);
    return [];
  }
}

// API endpoint to get questions
app.get('/api/questions', (req, res) => {
  const { level = 'all', type = 'all', limit } = req.query;
  let questions = loadQuestions();
  
  // Filter questions
  if (level !== 'all') {
    questions = questions.filter(q => q.level === level);
  }
  
  if (type !== 'all') {
    questions = questions.filter(q => q.type === type);
  }
  
  // Shuffle all matching questions first
  questions = questions.sort(() => Math.random() - 0.5);
  
  // Check if any questions match the filters
  if (questions.length === 0) {
    return res.status(404).json({ 
      error: 'We don\'t have questions for this combination yet. Please select a different level or question type.' 
    });
  }
  
  // Apply limit if specified
  if (limit) {
    questions = questions.slice(0, parseInt(limit));
  }
  
  // Shuffle options for each question and fix the answer index
  const shuffledQuestions = questions
    .map(q => {
      // Make a deep copy of the question to avoid modifying the original
      const questionCopy = JSON.parse(JSON.stringify(q));
      
      // Add a unique ID if not already present
      if (!questionCopy.id) {
        // Create an ID based on level, type, and first few characters of question
        const questionText = questionCopy.question.replace(/[^a-zA-Z0-9]/g, '');
        questionCopy.id = `${questionCopy.level}-${questionCopy.type}-${questionText.substring(0, 10)}`;
      }
      
      // Get the correct answer text before shuffling
      const correctAnswerText = questionCopy.options[questionCopy.answer];
      
      // Shuffle options
      const shuffledOptions = [...questionCopy.options].sort(() => Math.random() - 0.5);
      
      // Add letter identifiers (A, B, C, D) to the options
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Support up to 8 options
      const optionsWithLetters = shuffledOptions.map((option, idx) => {
        return `${letters[idx]}. ${option}`;
      });
      
      // Find the new index of the correct answer after shuffling
      const newAnswerIndex = shuffledOptions.findIndex(option => option === correctAnswerText);
      
      // Log for debugging
      console.log(`Question: ${questionCopy.question}`);
      console.log(`Original answer: ${questionCopy.answer} (${correctAnswerText})`);
      console.log(`New answer index: ${newAnswerIndex} (${shuffledOptions[newAnswerIndex]})`);
      
      return {
        ...questionCopy,
        options: optionsWithLetters,
        answer: newAnswerIndex
      };
    })
    .sort(() => Math.random() - 0.5);
  
  res.json(shuffledQuestions);
});

// API endpoint to check answers
app.post('/api/check-answer', (req, res) => {
  const { questionId, answerIndex } = req.body;
  const questions = loadQuestions();
  const question = questions.find(q => q.question === questionId);
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  const isCorrect = question.answer === answerIndex;
  res.json({ isCorrect, correctAnswer: question.answer });
});



// API endpoint to get version information
app.get('/api/version', (req, res) => {
  res.json(versionInfo);
});

// Serve the main HTML file (catch-all route must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
