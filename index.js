const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Load questions from YAML file
function loadQuestions() {
  try {
    const fileContents = fs.readFileSync(path.join(__dirname, 'questions.yaml'), 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error(chalk.red('Error loading questions:'), e.message);
    process.exit(1);
  }
}

// Filter questions by level and type
function filterQuestions(questions, level, type) {
  return questions.filter(q => {
    const levelMatch = level === 'all' || q.level === level;
    const typeMatch = type === 'all' || q.type === type;
    return levelMatch && typeMatch;
  });
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Start the quiz
async function startQuiz(questions) {
  if (questions.length === 0) {
    console.log(chalk.yellow('No questions found for the selected criteria.'));
    return;
  }

  console.log(chalk.blue(`\nStarting quiz with ${questions.length} questions...\n`));
  
  let score = 0;
  const shuffledQuestions = shuffleArray(questions);
  
  for (let i = 0; i < shuffledQuestions.length; i++) {
    const q = shuffledQuestions[i];
    const choices = [...q.options];
    
    const { answer } = await inquirer.prompt([
      {
        type: 'list',
        name: 'answer',
        message: chalk.cyan(`[${i + 1}/${shuffledQuestions.length}] ${q.question}`),
        choices: choices.map((option, index) => ({
          name: option,
          value: index
        })),
      }
    ]);
    
    if (answer === q.answer) {
      console.log(chalk.green('✓ Correct!\n'));
      score++;
    } else {
      console.log(chalk.red(`✗ Incorrect! The correct answer was: ${choices[q.answer]}\n`));
    }
  }
  
  const percentage = Math.round((score / shuffledQuestions.length) * 100);
  console.log(chalk.blue('Quiz complete!'));
  console.log(chalk.blue(`Your score: ${score}/${shuffledQuestions.length} (${percentage}%)`));
}

// Main function
async function main() {
  console.log(chalk.yellow.bold('\n=== JLPT Practice Quiz ===\n'));
  
  const questions = loadQuestions();
  
  // Get unique levels and types
  const levels = ['all', ...new Set(questions.map(q => q.level))].sort();
  const types = ['all', ...new Set(questions.map(q => q.type))];
  
  const { level } = await inquirer.prompt([
    {
      type: 'list',
      name: 'level',
      message: 'Select JLPT level:',
      choices: levels,
    }
  ]);
  
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Select question type:',
      choices: types,
    }
  ]);
  
  const filteredQuestions = filterQuestions(questions, level, type);
  await startQuiz(filteredQuestions);
  
  // Ask if user wants to take another quiz
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: 'Would you like to take another quiz?',
      default: true
    }
  ]);
  
  if (again) {
    console.log('\n'.repeat(2));
    main();
  } else {
    console.log(chalk.yellow('\nThank you for using JLPT Quiz App! 頑張ってください！\n'));
  }
}

// Start the application
main().catch(console.error);
