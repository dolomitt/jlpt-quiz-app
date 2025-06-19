# JLPT Quiz App Automated Testing

This directory contains automated tests for the JLPT Quiz App using Selenium WebDriver.

## Setup

1. Make sure you have Node.js and npm installed
2. Install the required dependencies:
   ```
   npm install
   ```
3. Install a compatible Chrome WebDriver:
   - The tests use ChromeDriver which should be installed via npm dependencies
   - Make sure the version matches your Chrome browser version
   - If you encounter version issues, you may need to update the chromedriver package

## Test Structure

- `/e2e`: End-to-end tests that simulate user interactions with the application
- `/helpers`: Utility functions to assist with testing
- `/screenshots`: (Auto-generated) Contains screenshots taken during test failures

## Running Tests

### Prerequisites

1. Make sure the JLPT Quiz App server is running on port 3001:
   ```
   npm start
   ```

### Running All Tests

To run all tests:

```
npm test
```

### Running Only E2E Tests

To run only the end-to-end tests:

```
npm run test:e2e
```

### Running Specific Tests

To run a specific test file:

```
npx mocha tests/e2e/quiz.test.js --timeout 30000
```

## Test Configuration

You can modify the test configuration in the test files:

- `APP_URL`: The URL where your application is running (default: http://localhost:3001)
- `TIMEOUT`: Maximum wait time for elements (default: 10000ms)

## Headless Mode

By default, tests run with a visible Chrome browser. To run in headless mode (without a visible browser):

1. Open the test file (e.g., `tests/e2e/quiz.test.js`)
2. Uncomment the line: `options.addArguments('--headless');`

## Taking Screenshots

The test utilities include a `takeScreenshot` function that can be used to capture the browser state at any point:

```javascript
const { takeScreenshot } = require('../helpers/test-utils');
// In your test:
await takeScreenshot(driver, 'quiz-screen');
```

## Adding New Tests

When adding new tests:

1. Follow the existing patterns in the test files
2. Use the helper functions in `test-utils.js` where possible
3. Make sure to clean up resources in the `afterEach` block
4. Keep tests independent of each other

## Troubleshooting

- **Element not found errors**: Increase the timeout or check if the element selector is correct
- **Browser version mismatch**: Update the chromedriver package to match your Chrome version
- **Port conflicts**: Make sure the app is running on port 3001 or update the APP_URL in the test files
