var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/generate-tests.js
var require_generate_tests = __commonJS({
  "src/generate-tests.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var ignoreDirs = ["node_modules", ".git", "coverage", "dist", "build", "test"];
    var ignoreFilesSuffix = [".test.js", ".spec.js"];
    function isTestFile(fileName) {
      return ignoreFilesSuffix.some((suffix) => fileName.endsWith(suffix));
    }
    function getAllJSFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          if (!ignoreDirs.includes(file)) {
            results = results.concat(getAllJSFiles(filePath));
          }
        } else if (file.endsWith(".js") && !isTestFile(file)) {
          results.push(filePath);
        }
      });
      return results;
    }
    function getExportedNames(modulePath) {
      try {
        const moduleExports = require(modulePath);
        if (typeof moduleExports === "function") {
          return { type: "function", name: null };
        }
        if (typeof moduleExports === "object" && moduleExports !== null) {
          const keys = Object.keys(moduleExports).filter(
            (key) => typeof moduleExports[key] === "function"
          );
          if (keys.length === 0) return { type: "other" };
          return { type: "object", exports: keys };
        }
        return { type: "other" };
      } catch (err) {
        return { type: "browser" };
      }
    }
    function sanitizeIdentifier(name) {
      return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_{2,}/g, "_");
    }
    function getRelativeRequire(modulePath, testFilePath) {
      const testDir = path.dirname(testFilePath);
      let relative = path.relative(testDir, modulePath).replace(/\\/g, "/");
      if (relative.endsWith(".js")) relative = relative.slice(0, -3);
      if (!relative.startsWith(".")) relative = "./" + relative;
      return relative;
    }
    function generateModuleTest(modulePath, testFilePath, info) {
      var _a;
      const moduleName = path.basename(modulePath, ".js");
      const safeModuleName = sanitizeIdentifier(moduleName);
      const relativeRequire = getRelativeRequire(modulePath, testFilePath);
      let content = `const ${safeModuleName} = require('${relativeRequire}');

`;
      if (info.type === "function") {
        content += `describe('${moduleName}', () => {
`;
        content += `    test('${safeModuleName} should be defined', () => {
`;
        content += `        expect(${safeModuleName}).toBeDefined();
`;
        content += `    });
`;
        content += `    test.todo('${safeModuleName} should work correctly');
`;
        content += `});
`;
      } else if (info.type === "object" && ((_a = info.exports) == null ? void 0 : _a.length)) {
        content += `describe('${moduleName}', () => {
`;
        info.exports.forEach((funcName) => {
          const safeFuncName = sanitizeIdentifier(funcName);
          content += `    test('${safeFuncName} should be defined', () => {
`;
          content += `        expect(${safeModuleName}.${funcName}).toBeDefined();
`;
          content += `    });
`;
          content += `    test.todo('${safeFuncName} should work correctly');
`;
        });
        content += `});
`;
      } else {
        content += `describe('${moduleName}', () => {
`;
        content += `    test('module should be defined', () => {
`;
        content += `        expect(${safeModuleName}).toBeDefined();
`;
        content += `    });
`;
        content += `    test.todo('add more tests for ${moduleName}');
`;
        content += `});
`;
      }
      return content;
    }
    function generateBrowserTest(modulePath, testFilePath) {
      const moduleName = path.basename(modulePath, ".js");
      const relativeRequire = getRelativeRequire(modulePath, testFilePath);
      return `
// \u0422\u0435\u0441\u0442 \u0434\u043B\u044F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043D\u043E\u0433\u043E \u0441\u043A\u0440\u0438\u043F\u0442\u0430 (IIFE)
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
    function generateTests(options = {}) {
      const {
        rootDir = ".",
        outputDir = null,
        overwrite = false,
        generateIIFE = false,
        skipIndexJs = true
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
      console.log(`\u041D\u0430\u0439\u0434\u0435\u043D\u043E ${files.length} JS-\u0444\u0430\u0439\u043B\u043E\u0432.`);
      files.forEach((filePath) => {
        const fileName = path.basename(filePath);
        if (fileName === "index.js" && skipIndexJs) {
          console.log(`\u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C ${filePath} (index.js)`);
          return;
        }
        const info = getExportedNames(filePath);
        const isModule = info.type === "function" || info.type === "object";
        const isBrowser = info.type === "browser" || info.type === "other";
        if (!isModule && !(isBrowser && generateIIFE)) {
          console.log(`\u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C ${filePath} (\u043D\u0435 \u043C\u043E\u0434\u0443\u043B\u044C \u0438 --iife \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D)`);
          return;
        }
        const relativePath = path.relative(absoluteRoot, filePath);
        let testFilePath;
        if (absoluteOutput) {
          const targetDir = path.join(absoluteOutput, path.dirname(relativePath));
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          testFilePath = path.join(targetDir, path.basename(filePath, ".js") + ".test.js");
        } else {
          testFilePath = filePath.replace(/\.js$/, ".test.js");
        }
        if (fs.existsSync(testFilePath) && !overwrite) {
          console.log(`\u0424\u0430\u0439\u043B \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442: ${testFilePath}`);
          return;
        }
        console.log(`\u0413\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u043C: ${filePath} \u2192 ${testFilePath}`);
        const content = isModule ? generateModuleTest(filePath, testFilePath, info) : generateBrowserTest(filePath, testFilePath);
        fs.writeFileSync(testFilePath, content, "utf8");
        console.log(`\u2713 \u0421\u043E\u0437\u0434\u0430\u043D ${testFilePath}`);
      });
      console.log("\u0413\u043E\u0442\u043E\u0432\u043E!");
    }
    if (require.main === module2) {
      const args = process.argv.slice(2);
      let rootDir = ".";
      let outputDir = null;
      let overwrite = false;
      let generateIIFE = false;
      let skipIndexJs = true;
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--help" || arg === "-h") {
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
        if (arg === "--overwrite" || arg === "-f") overwrite = true;
        else if (arg === "--iife") generateIIFE = true;
        else if (arg === "--no-skip-index-js") skipIndexJs = false;
        else if (arg === "--skip-index-js") skipIndexJs = true;
        else if (arg === "--output" || arg === "-o") {
          outputDir = args[++i];
        } else if (!arg.startsWith("-")) {
          rootDir = arg;
        }
      }
      generateTests({ rootDir, outputDir, overwrite, generateIIFE, skipIndexJs });
    }
    module2.exports = {
      generateTests,
      getAllJSFiles,
      generateModuleTest,
      generateBrowserTest,
      getExportedNames,
      getRelativeRequire
    };
  }
});

// src/extension.js
var vscode = require("vscode");
var generator = require_generate_tests();
function activate(context) {
  const runCommand = vscode.commands.registerCommand("jsgeneratetests.generateTests.run", async () => {
    try {
      const config = vscode.workspace.getConfiguration("generateTests");
      const rootDir = config.get("defaultRootDir");
      const outputDir = config.get("defaultOutputDir");
      const hasSavedSettings = !!rootDir && !!outputDir;
      let finalRootDir = rootDir;
      let finalOutputDir = outputDir;
      let overwrite = config.get("overwrite", false);
      let skipIndexJs = config.get("skipIndexJs", true);
      let iife = config.get("iife", false);
      if (!hasSavedSettings) {
        vscode.window.showInformationMessage("\u041F\u0435\u0440\u0432\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A \u043D\u0430 \u044D\u0442\u043E\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0435. \u041D\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u043C \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B...");
        finalRootDir = await selectFolder("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u0440\u043D\u0435\u0432\u0443\u044E \u043F\u0430\u043F\u043A\u0443 \u0441 JS-\u0444\u0430\u0439\u043B\u0430\u043C\u0438 (rootDir)", rootDir);
        if (!finalRootDir) return;
        finalOutputDir = await selectFolder("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u043F\u043A\u0443 \u0434\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432", outputDir);
        if (!finalOutputDir) return;
        const selected = await showOptionsQuickPick(overwrite, !skipIndexJs, iife);
        if (!selected) return;
        overwrite = selected.overwrite;
        skipIndexJs = selected.skipIndexJs;
        iife = selected.iife;
      }
      await config.update("defaultRootDir", finalRootDir, vscode.ConfigurationTarget.Workspace);
      await config.update("defaultOutputDir", finalOutputDir, vscode.ConfigurationTarget.Workspace);
      await config.update("overwrite", overwrite, vscode.ConfigurationTarget.Workspace);
      await config.update("skipIndexJs", skipIndexJs, vscode.ConfigurationTarget.Workspace);
      await config.update("iife", iife, vscode.ConfigurationTarget.Workspace);
      await runGeneratorDirect(finalRootDir, finalOutputDir, overwrite, skipIndexJs, iife);
      vscode.window.showInformationMessage(`\u2705 \u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430 \u0434\u043B\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:
${finalRootDir}`);
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage(`\u274C \u041E\u0448\u0438\u0431\u043A\u0430: ${error.message}`);
    }
  });
  const settingsCommand = vscode.commands.registerCommand("jsgeneratetests.generateTests.settings", () => {
    vscode.commands.executeCommand("workbench.action.openSettings", "generateTests");
  });
  context.subscriptions.push(runCommand, settingsCommand);
}
async function showOptionsQuickPick(currentOverwrite, currentNoSkipIndex, currentIife) {
  const options = [
    { label: "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0442\u044C \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 .test.js \u0444\u0430\u0439\u043B\u044B", picked: currentOverwrite, id: "overwrite" },
    { label: "\u0413\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0435\u0441\u0442\u044B \u0434\u043B\u044F index.js", picked: currentNoSkipIndex, id: "noSkipIndexJs" },
    { label: "\u0413\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u043B\u044F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043D\u044B\u0445 IIFE-\u0441\u043A\u0440\u0438\u043F\u0442\u043E\u0432", picked: currentIife, id: "iife" }
  ];
  const selected = await vscode.window.showQuickPick(options, {
    canPickMany: true,
    placeHolder: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438"
  });
  if (!selected) return null;
  return {
    overwrite: selected.some((opt) => opt.id === "overwrite"),
    skipIndexJs: !selected.some((opt) => opt.id === "noSkipIndexJs"),
    iife: selected.some((opt) => opt.id === "iife")
  };
}
async function runGeneratorDirect(rootDir, outputDir, overwrite, skipIndexJs, iife) {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F Jest-\u0442\u0435\u0441\u0442\u043E\u0432...",
    cancellable: false
  }, async () => {
    await generator.generateTests({
      rootDir,
      outputDir,
      overwrite,
      generateIIFE: iife,
      skipIndexJs
    });
  });
}
async function selectFolder(title, defaultValue = "") {
  const uris = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    title,
    defaultUri: defaultValue ? vscode.Uri.file(defaultValue) : void 0
  });
  if (uris == null ? void 0 : uris.length) {
    return uris[0].fsPath;
  }
  return await vscode.window.showInputBox({
    title,
    value: defaultValue,
    placeHolder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0443\u0442\u044C \u043A \u043F\u0430\u043F\u043A\u0435 \u0432\u0440\u0443\u0447\u043D\u0443\u044E"
  });
}
function deactivate() {
}
module.exports = {
  activate,
  deactivate
};
//# sourceMappingURL=extension.js.map
