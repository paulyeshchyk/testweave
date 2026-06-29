# TestWeave

**Smart Jest Test Generator for JavaScript**

TestWeave helps you create test files for your JS code quickly and easily.

## How to Use

### 1. From VS Code (Recommended)

- Right-click on a folder in Explorer
- Go to **Генерация js-тестов** - **Запуск** (Run)
- On first use in a project, it will ask you to choose folders
- Next times — it runs instantly using saved settings

### 2. From Terminal (CLI)

```bash
node generate-tests.js ./src --output ./tests
```

## What TestWeave Can Do

### Automatic Test Creation

#### Without TestWeave you had to:

- Create something.test.js file manually
- Write describe, test, and require for every module
- Do this again and again for many files

#### TestWeave does it for you:

- Finds all .js files in your folder
- Understands what functions you export
- Creates test files with basic checks (toBeDefined) and test.todo()
- Keeps your folder structure

### Supports Different Module Types

Normal Node.js modules Modules with many exported functions Browser scripts (IIFE) — when you use --iife flag

### Smart Settings

Remembers settings for each project Can overwrite existing test files Can include or skip index.js

## How to Install

Install TestWeave from VS Code Extensions Open your project folder Right-click on a folder - Генерация js-тестов - Запуск

That's it! Your tests will be ready in seconds.
