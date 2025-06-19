const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());

// Load questions from YAML files
const questionsDir = path.join(__dirname, '../data');
let allQuestions = [];

try {
  // In Netlify functions, we need to use a different path resolution
  const dataFiles = fs.readdirSync(path.join(__dirname, '../data')).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
  
  dataFiles.forEach(file => {
    const fileContent = fs.readFileSync(path.join(__dirname, '../data', file), 'utf8');
    const questions = yaml.load(fileContent);
    allQuestions = allQuestions.concat(questions);
  });
} catch (error) {
  console.error('Error loading questions:', error);
  // Provide some sample questions if files can't be loaded
  allQuestions = [
    {
      id: 'sample1',
      level: 'N5',
      type: 'grammar',
      question: 'Sample question 1',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 0
    },
    {
      id: 'sample2',
      level: 'N5',
      type: 'vocabulary',
      question: 'Sample question 2',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 1
    }
  ];
}

// Get version info
let versionInfo = { version: '1.0.0', commit: 'development' };
try {
  // Try to get git commit hash
  versionInfo.commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.log('Not in a git repository or git not installed');
}

// API endpoint for questions
app.get('/api/questions', (req, res) => {
  const { level, type, limit } = req.query;
  
  let filteredQuestions = [...allQuestions];
  
  if (level && level !== 'all') {
    filteredQuestions = filteredQuestions.filter(q => q.level === level);
  }
  
  if (type && type !== 'all') {
    filteredQuestions = filteredQuestions.filter(q => q.type === type);
  }
  
  // Shuffle questions
  filteredQuestions.sort(() => Math.random() - 0.5);
  
  // Limit number of questions
  if (limit) {
    filteredQuestions = filteredQuestions.slice(0, parseInt(limit));
  }
  
  res.json(filteredQuestions);
});

// API endpoint for version info
app.get('/api/version', (req, res) => {
  res.json(versionInfo);
});

// API endpoint for checking answers
app.post('/api/check-answer', (req, res) => {
  const { questionId, selectedAnswer } = req.body;
  
  const question = allQuestions.find(q => q.id === questionId);
  
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  const isCorrect = question.answer === selectedAnswer;
  
  res.json({
    correct: isCorrect,
    correctAnswer: question.answer
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
