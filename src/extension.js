// src/extension.js

import { initNls } from '../nls_loader.js';

const { nls_ts, translate } = require('../nls_ts.js');
const vscode = require('vscode');
const generator = require('./generate-tests.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Основная команда — Запуск генерации
    const runCommand = vscode.commands.registerCommand('testweaver.generateTests.run', async () => {
        try {
            const config = vscode.workspace.getConfiguration('generateTests');

            const rootDir = config.get('defaultRootDir');
            const outputDir = config.get('defaultOutputDir');

            // Проверяем, есть ли уже настройки для текущего workspace
            const hasSavedSettings = !!rootDir && !!outputDir;

            let finalRootDir = rootDir;
            let finalOutputDir = outputDir;
            let overwrite = config.get('overwrite', false);
            let skipIndexJs = config.get('skipIndexJs', true);
            let iife = config.get('iife', false);

            if (!hasSavedSettings) {
                // Первый запуск на этом проекте — показываем все диалоги
                vscode.window.showInformationMessage(translate(nls_ts.extension.firsttime.run.message));

                finalRootDir = await selectFolder(translate(nls_ts.extension.firsttime.select.source.folder.title), rootDir);
                if (!finalRootDir) return;

                finalOutputDir = await selectFolder(translate(nls_ts.extension.firsttime.select.test.folder.title), outputDir);
                if (!finalOutputDir) return;

                // Выбор опций
                const selected = await showOptionsQuickPick(overwrite, !skipIndexJs, iife);
                if (!selected) return;

                overwrite = selected.overwrite;
                skipIndexJs = selected.skipIndexJs;
                iife = selected.iife;
            }

            // Сохраняем настройки в workspace
            await config.update('defaultRootDir', finalRootDir, vscode.ConfigurationTarget.Workspace);
            await config.update('defaultOutputDir', finalOutputDir, vscode.ConfigurationTarget.Workspace);
            await config.update('overwrite', overwrite, vscode.ConfigurationTarget.Workspace);
            await config.update('skipIndexJs', skipIndexJs, vscode.ConfigurationTarget.Workspace);
            await config.update('iife', iife, vscode.ConfigurationTarget.Workspace);

            // Запускаем генерацию
            await runGeneratorDirect(finalRootDir, finalOutputDir, overwrite, skipIndexJs, iife);

            vscode.window.showInformationMessage(translate(nls_ts.extension.completion.message, finalRootDir));
        } catch (error) {
            console.error(error);
            let msg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(translate(nls_ts.error.common.template, msg));
        }
    });

    // Команда "Настройки"
    const settingsCommand = vscode.commands.registerCommand('testweaver.generateTests.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'generateTests');
    });

    const forModuleCommand = vscode.commands.registerCommand(
        'testweaver.generateTests.forModule',
        async (uri) => {
            try {
                let modulePath;
                if (uri) {
                    modulePath = uri.fsPath;
                } else {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('No active editor');
                        return;
                    }
                    modulePath = editor.document.uri.fsPath;
                }
                if (!modulePath.endsWith('.js')) {
                    vscode.window.showErrorMessage('Selected file is not a JavaScript file');
                    return;
                }
                if (!fs.existsSync(modulePath)) {
                    vscode.window.showErrorMessage('File not found');
                    return;
                }

                const config = vscode.workspace.getConfiguration('generateTests');
                const rootDir = config.get('defaultRootDir', '');
                const outputDir = config.get('defaultOutputDir', '');

                // Определяем путь к тестовому файлу
                let testFilePath;
                if (outputDir) {
                    const relative = path.relative(rootDir, modulePath);
                    if (relative && !relative.startsWith('..')) {
                        const dir = path.dirname(relative);
                        const baseName = path.basename(modulePath, '.js');
                        testFilePath = path.join(outputDir, dir, baseName + '.test.js');
                    } else {
                        const baseName = path.basename(modulePath, '.js');
                        testFilePath = path.join(outputDir, baseName + '.test.js');
                    }
                } else {
                    testFilePath = modulePath.replace(/\.js$/, '.test.js');
                }

                const result = generator.generateTestsForModule(modulePath, testFilePath);
                if (result > 0) {
                    vscode.window.showInformationMessage(
                        `Added ${result} test(s) for ${path.basename(modulePath)}`
                    );
                } else if (result === 0) {
                    vscode.window.showInformationMessage(
                        `No new tests added for ${path.basename(modulePath)}`
                    );
                } else {
                    vscode.window.showErrorMessage('Failed to generate tests');
                }
            } catch (error) {
                console.error(error);
                let msg = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(msg);
            }
        }
    );

    // --- Новая команда: тест для функции ---
    const forFunctionCommand = vscode.commands.registerCommand(
        'testweaver.generateTests.forFunction',
        async (uri) => {
            try {
                let modulePath;
                if (uri) {
                    modulePath = uri.fsPath;
                } else {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('No active editor');
                        return;
                    }
                    modulePath = editor.document.uri.fsPath;
                }
                if (!modulePath.endsWith('.js')) {
                    vscode.window.showErrorMessage('Selected file is not a JavaScript file');
                    return;
                }
                if (!fs.existsSync(modulePath)) {
                    vscode.window.showErrorMessage('File not found');
                    return;
                }

                // Получаем список экспортируемых функций
                const info = generator.getExportedNames(modulePath);
                let funcNames = [];
                if (info.type === 'function') {
                    funcNames = [path.basename(modulePath, '.js')];
                } else if (info.type === 'object' && info.exports?.length) {
                    funcNames = info.exports;
                } else {
                    vscode.window.showErrorMessage('No exported functions found in this module');
                    return;
                }

                const selected = await vscode.window.showQuickPick(funcNames, {
                    placeHolder: 'Select a function to generate test for',
                });
                if (!selected) return;

                const config = vscode.workspace.getConfiguration('generateTests');
                const rootDir = config.get('defaultRootDir', '');
                const outputDir = config.get('defaultOutputDir', '');

                let testFilePath;
                if (outputDir) {
                    const relative = path.relative(rootDir, modulePath);
                    if (relative && !relative.startsWith('..')) {
                        const dir = path.dirname(relative);
                        const baseName = path.basename(modulePath, '.js');
                        testFilePath = path.join(outputDir, dir, baseName + '.test.js');
                    } else {
                        const baseName = path.basename(modulePath, '.js');
                        testFilePath = path.join(outputDir, baseName + '.test.js');
                    }
                } else {
                    testFilePath = modulePath.replace(/\.js$/, '.test.js');
                }

                const added = generator.generateTestForFunction(modulePath, selected, testFilePath);
                if (added) {
                    vscode.window.showInformationMessage(`Added test for function ${selected}`);
                } else {
                    vscode.window.showInformationMessage(`Test for ${selected} already exists`);
                }
            } catch (error) {
                console.error(error);
                let msg = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(msg);
            }
        }
    );

    const locale = vscode.env.language;
    const rootPath = context.extensionPath;
    initNls(locale, rootPath);

    context.subscriptions.push(runCommand, settingsCommand);
    context.subscriptions.push(forModuleCommand, forFunctionCommand);
}

/**
 * Показывает QuickPick с опциями
 * @param {boolean} currentOverwrite
 * @param {boolean} currentNoSkipIndex
 * @param {boolean} currentIife
 */
async function showOptionsQuickPick(currentOverwrite, currentNoSkipIndex, currentIife) {
    const options = [
        { label: translate(nls_ts.currentOverwrite.text), picked: currentOverwrite, id: 'overwrite' },
        { label: translate(nls_ts.currentNoSkipIndex.text), picked: currentNoSkipIndex, id: 'noSkipIndexJs' },
        { label: translate(nls_ts.currentIife.text), picked: currentIife, id: 'iife' }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        canPickMany: true,
        placeHolder: translate(nls_ts.generation.extra.options.placeholder)
    });

    if (!selected) return null;

    return {
        overwrite: selected.some(opt => opt.id === 'overwrite'),
        skipIndexJs: !selected.some(opt => opt.id === 'noSkipIndexJs'),
        iife: selected.some(opt => opt.id === 'iife')
    };
}

/**
 * Прямой запуск генерации
 * @param {any} rootDir
 * @param {any} outputDir
 * @param {boolean} overwrite
 * @param {boolean} skipIndexJs
 * @param {boolean} iife
 */
async function runGeneratorDirect(rootDir, outputDir, overwrite, skipIndexJs, iife) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: translate(nls_ts.run.generator.title),
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

/**
 * Выбор папки
 * @param {string} title
 */
async function selectFolder(title, defaultValue = '') {
    const uris = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        title,
        defaultUri: defaultValue ? vscode.Uri.file(defaultValue) : undefined
    });

    if (uris?.length) {
        return uris[0].fsPath;
    }

    return await vscode.window.showInputBox({
        title,
        value: defaultValue,
        placeHolder: translate(nls_ts.select.folder.placeholder)
    });
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};