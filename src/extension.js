const { nls_ts, translate } = require('../nls_ts.js');
const vscode = require('vscode');
const generator = require('./generate-tests.js');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Основная команда — Запуск генерации
    const runCommand = vscode.commands.registerCommand('jsgeneratetests.generateTests.run', async () => {
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
            vscode.window.showErrorMessage(`❌ Ошибка: ${error.message}`);
        }
    });

    // Команда "Настройки"
    const settingsCommand = vscode.commands.registerCommand('jsgeneratetests.generateTests.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'generateTests');
    });

    context.subscriptions.push(runCommand, settingsCommand);
}

/**
 * Показывает QuickPick с опциями
 * @param {boolean} currentOverwrite
 * @param {boolean} currentNoSkipIndex
 * @param {boolean} currentIife
 */
async function showOptionsQuickPick(currentOverwrite, currentNoSkipIndex, currentIife) {
    const options = [
        { label: 'Перезаписывать существующие .test.js файлы', picked: currentOverwrite, id: 'overwrite' },
        { label: 'Генерировать тесты для index.js', picked: currentNoSkipIndex, id: 'noSkipIndexJs' },
        { label: 'Генерировать для браузерных IIFE-скриптов', picked: currentIife, id: 'iife' }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        canPickMany: true,
        placeHolder: 'Дополнительные параметры генерации'
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
 */
async function runGeneratorDirect(rootDir, outputDir, overwrite, skipIndexJs, iife) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Генерация Jest-тестов...",
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
        placeHolder: 'Введите путь к папке вручную'
    });
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};