const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');

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
  
  // Apply limit if specified
  if (limit) {
    questions = questions.slice(0, parseInt(limit));
  }
  
  // Shuffle options for each question and fix the answer index
  const shuffledQuestions = questions
    .map(q => {
      // Make a deep copy of the question to avoid modifying the original
      const questionCopy = JSON.parse(JSON.stringify(q));
      
      // Get the correct answer text before shuffling
      const correctAnswerText = questionCopy.options[questionCopy.answer];
      
      // Shuffle the options
      const shuffledOptions = [...questionCopy.options].sort(() => Math.random() - 0.5);
      
      // Find the new index of the correct answer by matching the text
      const newAnswerIndex = shuffledOptions.findIndex(option => option === correctAnswerText);
      
      // Log for debugging
      console.log(`Question: ${questionCopy.question}`);
      console.log(`Original answer: ${questionCopy.answer} (${correctAnswerText})`);
      console.log(`New answer index: ${newAnswerIndex} (${shuffledOptions[newAnswerIndex]})`);
      
      return {
        ...questionCopy,
        options: shuffledOptions,
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

// Serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
