/**
 * generate-tests.js
 *
 * Генератор тестов для Jest.
 * Работает как CLI и как модуль.
 */

const fs = require('fs');
const path = require('path');

/* ====================== Утилиты ====================== */

const ignoreDirs = ['node_modules', '.git', 'coverage', 'dist', 'build', 'test'];
const ignoreFilesSuffix = ['.test.js', '.spec.js'];

/**
 * @param {string} fileName
 */
function isTestFile(fileName) {
  return ignoreFilesSuffix.some(suffix => fileName.endsWith(suffix));
}

/**
 * Рекурсивно собирает все .js файлы (кроме тестов)
 * @param {string} dir
 * @returns {string[]}
 */
function getAllJSFiles(dir) {
  /** @type {string[]} */
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        results = results.concat(getAllJSFiles(filePath));
      }
    } else if (file.endsWith('.js') && !isTestFile(file)) {
      results.push(filePath);
    }
  });

  return results;
}

/**
 * Определяет, что экспортирует модуль
 * @param {string} modulePath
 */
function getExportedNames(modulePath) {
  try {
    const moduleExports = require(modulePath);

    if (typeof moduleExports === 'function') {
      return { type: 'function', name: null };
    }

    if (typeof moduleExports === 'object' && moduleExports !== null) {
      const keys = Object.keys(moduleExports).filter(
        key => typeof moduleExports[key] === 'function'
      );
      if (keys.length === 0) return { type: 'other' };
      return { type: 'object', exports: keys };
    }

    return { type: 'other' };
  } catch (err) {
    return { type: 'browser' };
  }
}

/**
 * @param {string} name
 */
function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_{2,}/g, '_');
}

/**
 * @param {string} modulePath
 * @param {string} testFilePath
 */
function getRelativeRequire(modulePath, testFilePath) {
  const testDir = path.dirname(testFilePath);
  let relative = path.relative(testDir, modulePath).replace(/\\/g, '/');

  if (relative.endsWith('.js')) relative = relative.slice(0, -3);
  if (!relative.startsWith('.')) relative = './' + relative;

  return relative;
}

/* ====================== Генерация тестов ====================== */

/**
 * @param {string} modulePath
 * @param {string} testFilePath
 * @param {{ type: string; name: null; exports?: undefined; } | { type: string; name?: undefined; exports?: undefined; } | { type: string; exports: string[]; name?: undefined; }} info
 */
function generateModuleTest(modulePath, testFilePath, info) {
  const moduleName = path.basename(modulePath, '.js');
  const safeModuleName = sanitizeIdentifier(moduleName);
  const relativeRequire = getRelativeRequire(modulePath, testFilePath);

  let content = `const ${safeModuleName} = require('${relativeRequire}');\n\n`;

  if (info.type === 'function') {
    content += `describe('${moduleName}', () => {\n`;
    content += `    test('${safeModuleName} should be defined', () => {\n`;
    content += `        expect(${safeModuleName}).toBeDefined();\n`;
    content += `    });\n`;
    content += `    test.todo('${safeModuleName} should work correctly');\n`;
    content += `});\n`;
  } else if (info.type === 'object' && info.exports?.length) {
    content += `describe('${moduleName}', () => {\n`;
    info.exports.forEach(funcName => {
      const safeFuncName = sanitizeIdentifier(funcName);
      content += `    test('${safeFuncName} should be defined', () => {\n`;
      content += `        expect(${safeModuleName}.${funcName}).toBeDefined();\n`;
      content += `    });\n`;
      content += `    test.todo('${safeFuncName} should work correctly');\n`;
    });
    content += `});\n`;
  } else {
    content += `describe('${moduleName}', () => {\n`;
    content += `    test('module should be defined', () => {\n`;
    content += `        expect(${safeModuleName}).toBeDefined();\n`;
    content += `    });\n`;
    content += `    test.todo('add more tests for ${moduleName}');\n`;
    content += `});\n`;
  }

  return content;
}

/**
 * @param {string} modulePath
 * @param {string} testFilePath
 */
function generateBrowserTest(modulePath, testFilePath) {
  const moduleName = path.basename(modulePath, '.js');
  const relativeRequire = getRelativeRequire(modulePath, testFilePath);

  return `
// Тест для браузерного скрипта (IIFE)
describe('${moduleName} (browser script)', () => {
    beforeAll(() => {
        global.window = { location: { pathname: '/test' }, addEventListener: jest.fn() };
        global.document = {
            readyState: 'complete',
            addEventListener: jest.fn(),
            querySelectorAll: jest.fn(() => []),
        };
        global.MutationObserver = class { observe() {} };
    });

    afterAll(() => {
        delete global.window;
        delete global.document;
        delete global.MutationObserver;
    });

    test('script should load without errors', () => {
        expect(() => require('${relativeRequire}')).not.toThrow();
    });

    test.todo('add integration tests using jsdom or Puppeteer');
});
`;
}

/**
 * Основная функция генерации тестов
 * @param {Object} options
 * @param {string} [options.rootDir='.'] 
 * @param {string?} [options.outputDir] 
 * @param {boolean} [options.overwrite=false] 
 * @param {boolean} [options.generateIIFE=false] 
 * @param {boolean} [options.skipIndexJs=true] 
 */
function generateTests(options = {}) {
  const {
    rootDir = '.',
    outputDir = null,
    overwrite = false,
    generateIIFE = false,
    skipIndexJs = true,
  } = options;

  const absoluteRoot = path.resolve(rootDir);
  let absoluteOutput = null;

  if (outputDir) {
    absoluteOutput = path.resolve(outputDir);
    if (!fs.existsSync(absoluteOutput)) {
      fs.mkdirSync(absoluteOutput, { recursive: true });
    }
  }

  const files = getAllJSFiles(absoluteRoot);
  console.log(`Найдено ${files.length} JS-файлов.`);

  files.forEach(filePath => {
    const fileName = path.basename(filePath);

    if (fileName === 'index.js' && skipIndexJs) {
      console.log(`Пропускаем ${filePath} (index.js)`);
      return;
    }

    const info = getExportedNames(filePath);
    const isModule = info.type === 'function' || info.type === 'object';
    const isBrowser = info.type === 'browser' || info.type === 'other';

    if (!isModule && !(isBrowser && generateIIFE)) {
      console.log(`Пропускаем ${filePath} (не модуль и --iife не указан)`);
      return;
    }

    // Путь к тестовому файлу
    const relativePath = path.relative(absoluteRoot, filePath);
    let testFilePath;

    if (absoluteOutput) {
      const targetDir = path.join(absoluteOutput, path.dirname(relativePath));
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      testFilePath = path.join(targetDir, path.basename(filePath, '.js') + '.test.js');
    } else {
      testFilePath = filePath.replace(/\.js$/, '.test.js');
    }

    if (fs.existsSync(testFilePath) && !overwrite) {
      console.log(`Файл уже существует: ${testFilePath}`);
      return;
    }

    console.log(`Генерируем: ${filePath} → ${testFilePath}`);

    const content = isModule
      ? generateModuleTest(filePath, testFilePath, info)
      : generateBrowserTest(filePath, testFilePath);

    fs.writeFileSync(testFilePath, content, 'utf8');
    console.log(`✓ Создан ${testFilePath}`);
  });

  console.log('Готово!');
}

/* ====================== CLI ====================== */

if (require.main === module) {
  const args = process.argv.slice(2);
  let rootDir = '.';
  let outputDir = null;
  let overwrite = false;
  let generateIIFE = false;
  let skipIndexJs = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node generate-tests.js [rootDir] [options]

Options:
  --output, -o <dir>     - output directory
  --overwrite, -f        - overwrite existing test files
  --iife                 - generate tests for browser scripts (IIFE)
  --no-skip-index-js     - do not skip index.js
  --skip-index-js        - skip index.js (default)
  --help, -h             - show help
      `);
      process.exit(0);
    }

    if (arg === '--overwrite' || arg === '-f') overwrite = true;
    else if (arg === '--iife') generateIIFE = true;
    else if (arg === '--no-skip-index-js') skipIndexJs = false;
    else if (arg === '--skip-index-js') skipIndexJs = true;
    else if (arg === '--output' || arg === '-o') {
      outputDir = args[++i];
    }
    else if (!arg.startsWith('-')) {
      rootDir = arg;
    }
  }

  generateTests({ rootDir, outputDir, overwrite, generateIIFE, skipIndexJs });
}

/* ====================== Экспорт ====================== */

module.exports = {
  generateTests,
  getAllJSFiles,
  generateModuleTest,
  generateBrowserTest,
  getExportedNames,
  getRelativeRequire,
};