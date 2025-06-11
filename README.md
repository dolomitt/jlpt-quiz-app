# JLPT Quiz App

A command-line quiz application to help you practice for the Japanese Language Proficiency Test (JLPT).

## Features

- Multiple JLPT levels (N5-N1)
- Different question types (grammar, vocabulary, reading)
- Randomized questions and answer choices
- Score tracking
- Easy to add new questions

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed (v14 or higher)
2. Clone this repository or download the files
3. Install dependencies:
   ```
   npm install
   ```

## Adding Questions

Edit the `questions.yaml` file to add more questions. Follow this format:

```yaml
- level: N5  # JLPT level (N5-N1)
  type: vocabulary  # grammar, vocabulary, or reading
  question: "What is the meaning of '本'?"
  options:
    - "Pen"
    - "Book"
    - "Desk"
    - "Chair"
  answer: 1  # Index of the correct answer (0-based)
```

## Running the Quiz

Start the quiz with:

```
node index.js
```

Follow the on-screen prompts to select your JLPT level and question type.

## License

MIT
