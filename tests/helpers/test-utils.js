/**
 * Test utilities for JLPT Quiz App Selenium tests
 */

const { until, By } = require('selenium-webdriver');

/**
 * Waits for an element to be visible and returns it
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {WebElement} The located element
 */
async function waitForElement(driver, selector, timeout = 10000) {
  await driver.wait(until.elementLocated(By.css(selector)), timeout);
  const element = await driver.findElement(By.css(selector));
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

/**
 * Starts a quiz with specified options
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {Object} options - Quiz options
 * @param {string} options.level - JLPT level (N1-N5 or 'all')
 * @param {string} options.type - Question type (grammar, vocabulary, reading, or 'all')
 * @param {number} options.limit - Number of questions (5, 10, 20, or 50)
 */
async function startQuiz(driver, { level = 'all', type = 'all', limit = 10 } = {}) {
  // Select level
  if (level !== 'all') {
    await driver.findElement(By.css(`input[value="${level}"]`)).click();
  }
  
  // Select type
  if (type !== 'all') {
    await driver.findElement(By.css(`input[value="${type}"]`)).click();
  }
  
  // Select limit
  await driver.findElement(By.css(`input[value="${limit}"]`)).click();
  
  // Click start button
  await driver.findElement(By.id('start-btn')).click();
  
  // Wait for quiz screen to be visible
  await waitForElement(driver, '#quiz-screen');
}

/**
 * Completes a quiz by answering all questions
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {number} numQuestions - Number of questions in the quiz
 * @param {Function} answerStrategy - Function that returns the index of the option to select
 */
async function completeQuiz(driver, numQuestions, answerStrategy = () => 0) {
  for (let i = 0; i < numQuestions; i++) {
    // Wait for options to be clickable
    await waitForElement(driver, '.option-btn');
    
    // Get all options
    const options = await driver.findElements(By.css('.option-btn'));
    
    // Select an option based on the strategy (default: first option)
    const optionIndex = answerStrategy(i, options.length);
    await options[optionIndex].click();
    
    // Wait for next button
    await waitForElement(driver, '#next-btn');
    
    // Click next
    await driver.findElement(By.id('next-btn')).click();
  }
  
  // Wait for results screen
  await waitForElement(driver, '#result-screen');
}

/**
 * Takes a screenshot and saves it to the specified path
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} filename - Name of the screenshot file
 */
async function takeScreenshot(driver, filename) {
  const fs = require('fs').promises;
  const path = require('path');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (err) {
    console.error('Error creating screenshots directory:', err);
  }
  
  // Take screenshot
  const screenshot = await driver.takeScreenshot();
  
  // Save screenshot
  const filepath = path.join(screenshotsDir, `${filename}.png`);
  await fs.writeFile(filepath, screenshot, 'base64');
  console.log(`Screenshot saved to ${filepath}`);
}

module.exports = {
  waitForElement,
  startQuiz,
  completeQuiz,
  takeScreenshot
};
