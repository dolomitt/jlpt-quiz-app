const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const { execSync } = require('child_process');

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

// Path to history file
const historyFilePath = path.join(__dirname, 'history.json');

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

// API endpoint to get quiz history
app.get('/api/history', (req, res) => {
  try {
    // Check if history file exists, if not create it
    if (!fs.existsSync(historyFilePath)) {
      fs.writeFileSync(historyFilePath, JSON.stringify([]), 'utf8');
    }
    
    // Read history file
    const historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    res.json(historyData);
  } catch (error) {
    console.error('Error reading history:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz history' });
  }
});

// API endpoint to save quiz history
app.post('/api/history', (req, res) => {
  try {
    const newQuizRecord = req.body;
    
    // Validate the quiz record
    if (!newQuizRecord.date || !newQuizRecord.level || !newQuizRecord.type || 
        !newQuizRecord.numQuestions || newQuizRecord.score === undefined) {
      return res.status(400).json({ error: 'Invalid quiz record data' });
    }
    
    // Check if history file exists, if not create it
    if (!fs.existsSync(historyFilePath)) {
      fs.writeFileSync(historyFilePath, JSON.stringify([]), 'utf8');
    }
    
    // Read current history
    let historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    
    // Add new record to the beginning
    historyData.unshift(newQuizRecord);
    
    // Keep only the latest 50 records
    if (historyData.length > 50) {
      historyData = historyData.slice(0, 50);
    }
    
    // Write updated history back to file
    fs.writeFileSync(historyFilePath, JSON.stringify(historyData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Quiz history saved successfully' });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save quiz history' });
  }
});

// API endpoint to clear quiz history
app.delete('/api/history/clear', (req, res) => {
  try {
    // Write empty array to history file
    fs.writeFileSync(historyFilePath, JSON.stringify([]), 'utf8');
    
    console.log('Quiz history cleared');
    res.json({ success: true, message: 'Quiz history cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear quiz history' });
  }
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
