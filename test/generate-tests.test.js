const generate_tests = require('../src/generate-tests');

describe('generate-tests', () => {
    test('generateTests should be defined', () => {
        expect(generate_tests.generateTests).toBeDefined();
    });
    test.todo('generateTests should work correctly');
    test('getAllJSFiles should be defined', () => {
        expect(generate_tests.getAllJSFiles).toBeDefined();
    });
    test.todo('getAllJSFiles should work correctly');
    test('generateModuleTest should be defined', () => {
        expect(generate_tests.generateModuleTest).toBeDefined();
    });
    test.todo('generateModuleTest should work correctly');
    test('generateBrowserTest should be defined', () => {
        expect(generate_tests.generateBrowserTest).toBeDefined();
    });
    test.todo('generateBrowserTest should work correctly');
    test('getExportedNames should be defined', () => {
        expect(generate_tests.getExportedNames).toBeDefined();
    });
    test.todo('getExportedNames should work correctly');
    test('getRelativeRequire should be defined', () => {
        expect(generate_tests.getRelativeRequire).toBeDefined();
    });
    test.todo('getRelativeRequire should work correctly');
});
