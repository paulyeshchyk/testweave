var U=Object.create;var $=Object.defineProperty;var z=Object.getOwnPropertyDescriptor;var H=Object.getOwnPropertyNames;var Q=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var b=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(n){throw e=0,n}};var P=(t,e,n,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of H(e))!G.call(t,i)&&i!==n&&$(t,i,{get:()=>e[i],enumerable:!(s=z(e,i))||s.enumerable});return t};var Z=(t,e,n)=>(n=t!=null?U(Q(t)):{},P(e||!t||!t.__esModule?$(n,"default",{value:t,enumerable:!0}):n,t));var I=b((ce,O)=>{var v=require("fs"),q=require("path"),F={};function K(t,e){let n=q.join(e,`package.nls.${t}.json`);v.existsSync(n)||(n=q.join(e,"package.nls.json"));try{v.existsSync(n)&&(F=JSON.parse(v.readFileSync(n,"utf8")))}catch(s){console.error("Failed to load NLS file:",s)}}function X(t,...e){let n=F[t]||t;return e.length>0&&(n=n.replace(/{(\d+)}/g,(s,i)=>{let r=parseInt(i,10);return typeof e[r]<"u"?String(e[r]):s})),n}O.exports={initNls:K,translate:X}});var N=b((ue,E)=>{var{translate:Y}=I(),V={app:{description:"app.description"},configuration:{title:"configuration.title",generateTests:{defaultRootDir:"configuration.generateTests.defaultRootDir",defaultOutputDir:"configuration.generateTests.defaultOutputDir",overwrite:"configuration.generateTests.overwrite",skipIndexJs:"configuration.generateTests.skipIndexJs",iife:"configuration.generateTests.iife"}},extension:{firsttime:{run:{message:"extension.firsttime.run.message"},select:{source:{folder:{title:"extension.firsttime.select.source.folder.title"}},test:{folder:{title:"extension.firsttime.select.test.folder.title"}}}},completion:{message:"extension.completion.message"}},jsgeneratetests:{generateTests:{run:{title:"jsgeneratetests.generateTests.run.title"},settings:{title:"jsgeneratetests.generateTests.settings.title"}}},jsgenerateTests:{submenu:{title:"jsgenerateTests.submenu.title"}},error:{common:{template:"error.common.template"}},currentOverwrite:{text:"currentOverwrite.text"},currentNoSkipIndex:{text:"currentNoSkipIndex.text"},currentIife:{text:"currentIife.text"},generation:{extra:{options:{placeholder:"generation.extra.options.placeholder"}}},run:{generator:{title:"run.generator.title"}},select:{folder:{placeholder:"select.folder.placeholder"}}};E.exports={nls_ts:V,translate:Y}});var B=b((de,D)=>{var m=require("fs"),u=require("path"),ee=["node_modules",".git","coverage","dist","build","test"],te=[".test.js",".spec.js"];function ne(t){return te.some(e=>t.endsWith(e))}function S(t){let e=[];return m.readdirSync(t).forEach(s=>{let i=u.join(t,s);m.statSync(i).isDirectory()?ee.includes(s)||(e=e.concat(S(i))):s.endsWith(".js")&&!ne(s)&&e.push(i)}),e}function C(t){try{let e=require(t);if(typeof e=="function")return{type:"function",name:null};if(typeof e=="object"&&e!==null){let n=Object.keys(e).filter(s=>typeof e[s]=="function");return n.length===0?{type:"other"}:{type:"object",exports:n}}return{type:"other"}}catch(e){return console.error("getExportedNames",e),{type:"browser"}}}function J(t){return t.replace(/[^a-zA-Z0-9]/g,"_").replace(/_{2,}/g,"_")}function T(t,e){let n=u.dirname(e),s=u.relative(n,t).replace(/\\/g,"/");return s.endsWith(".js")&&(s=s.slice(0,-3)),s.startsWith(".")||(s="./"+s),s}function M(t,e,n){var a;let s=u.basename(t,".js"),i=J(s),r=T(t,e),o=`const ${i} = require('${r}');

`;return n.type==="function"?(o+=`describe('${s}', () => {
`,o+=`    test('${i} should be defined', () => {
`,o+=`        expect(${i}).toBeDefined();
`,o+=`    });
`,o+=`    test.todo('${i} should work correctly');
`,o+=`});
`):n.type==="object"&&((a=n.exports)!=null&&a.length)?(o+=`describe('${s}', () => {
`,n.exports.forEach(w=>{let l=J(w);o+=`    test('${l} should be defined', () => {
`,o+=`        expect(${i}.${w}).toBeDefined();
`,o+=`    });
`,o+=`    test.todo('${l} should work correctly');
`}),o+=`});
`):(o+=`describe('${s}', () => {
`,o+=`    test('module should be defined', () => {
`,o+=`        expect(${i}).toBeDefined();
`,o+=`    });
`,o+=`    test.todo('add more tests for ${s}');
`,o+=`});
`),o}function R(t,e){let n=u.basename(t,".js"),s=T(t,e);return`
// \u0422\u0435\u0441\u0442 \u0434\u043B\u044F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043D\u043E\u0433\u043E \u0441\u043A\u0440\u0438\u043F\u0442\u0430 (IIFE)
describe('${n} (browser script)', () => {
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
        expect(() => require('${s}')).not.toThrow();
    });

    test.todo('add integration tests using jsdom or Puppeteer');
});
`}function W(t={}){let{rootDir:e=".",outputDir:n=null,overwrite:s=!1,generateIIFE:i=!1,skipIndexJs:r=!0}=t,o=u.resolve(e),a=null;n&&(a=u.resolve(n),m.existsSync(a)||m.mkdirSync(a,{recursive:!0}));let w=S(o);console.log(`\u041D\u0430\u0439\u0434\u0435\u043D\u043E ${w.length} JS-\u0444\u0430\u0439\u043B\u043E\u0432.`),w.forEach(l=>{if(u.basename(l)==="index.js"&&r){console.log(`\u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C ${l} (index.js)`);return}let p=C(l),x=p.type==="function"||p.type==="object",h=p.type==="browser"||p.type==="other";if(!x&&!(h&&i)){console.log(`\u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C ${l} (\u043D\u0435 \u043C\u043E\u0434\u0443\u043B\u044C \u0438 --iife \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D)`);return}let y=u.relative(o,l),g;if(a){let k=u.join(a,u.dirname(y));m.existsSync(k)||m.mkdirSync(k,{recursive:!0}),g=u.join(k,u.basename(l,".js")+".test.js")}else g=l.replace(/\.js$/,".test.js");if(m.existsSync(g)&&!s){console.log(`\u0424\u0430\u0439\u043B \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442: ${g}`);return}console.log(`\u0413\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u043C: ${l} \u2192 ${g}`);let L=x?M(l,g,p):R(l,g);m.writeFileSync(g,L,"utf8"),console.log(`\u2713 \u0421\u043E\u0437\u0434\u0430\u043D ${g}`)}),console.log("\u0413\u043E\u0442\u043E\u0432\u043E!")}if(require.main===D){let t=process.argv.slice(2),e=".",n=null,s=!1,i=!1,r=!0;for(let o=0;o<t.length;o++){let a=t[o];(a==="--help"||a==="-h")&&(console.log(`
Usage: node generate-tests.js [rootDir] [options]

Options:
  --output, -o <dir>     - output directory
  --overwrite, -f        - overwrite existing test files
  --iife                 - generate tests for browser scripts (IIFE)
  --no-skip-index-js     - do not skip index.js
  --skip-index-js        - skip index.js (default)
  --help, -h             - show help
      `),process.exit(0)),a==="--overwrite"||a==="-f"?s=!0:a==="--iife"?i=!0:a==="--no-skip-index-js"?r=!1:a==="--skip-index-js"?r=!0:a==="--output"||a==="-o"?n=t[++o]:a.startsWith("-")||(e=a)}W({rootDir:e,outputDir:n,overwrite:s,generateIIFE:i,skipIndexJs:r})}D.exports={generateTests:W,getAllJSFiles:S,generateModuleTest:M,generateBrowserTest:R,getExportedNames:C,getRelativeRequire:T}});var A=Z(I()),{nls_ts:d,translate:f}=N(),c=require("vscode"),se=B();function re(t){let e=c.commands.registerCommand("jsgeneratetests.generateTests.run",async()=>{try{let r=c.workspace.getConfiguration("generateTests"),o=r.get("defaultRootDir"),a=r.get("defaultOutputDir"),w=!!o&&!!a,l=o,j=a,p=r.get("overwrite",!1),x=r.get("skipIndexJs",!0),h=r.get("iife",!1);if(!w){if(c.window.showInformationMessage(f(d.extension.firsttime.run.message)),l=await _(f(d.extension.firsttime.select.source.folder.title),o),!l||(j=await _(f(d.extension.firsttime.select.test.folder.title),a),!j))return;let y=await oe(p,!x,h);if(!y)return;p=y.overwrite,x=y.skipIndexJs,h=y.iife}await r.update("defaultRootDir",l,c.ConfigurationTarget.Workspace),await r.update("defaultOutputDir",j,c.ConfigurationTarget.Workspace),await r.update("overwrite",p,c.ConfigurationTarget.Workspace),await r.update("skipIndexJs",x,c.ConfigurationTarget.Workspace),await r.update("iife",h,c.ConfigurationTarget.Workspace),await ie(l,j,p,x,h),c.window.showInformationMessage(f(d.extension.completion.message,l))}catch(r){console.error(r);let o=r instanceof Error?r.message:String(r);c.window.showErrorMessage(f(d.error.common.template,o))}}),n=c.commands.registerCommand("jsgeneratetests.generateTests.settings",()=>{c.commands.executeCommand("workbench.action.openSettings","generateTests")}),s=c.env.language,i=t.extensionPath;(0,A.initNls)(s,i),t.subscriptions.push(e,n)}async function oe(t,e,n){let s=[{label:f(d.currentOverwrite.text),picked:t,id:"overwrite"},{label:f(d.currentNoSkipIndex.text),picked:e,id:"noSkipIndexJs"},{label:f(d.currentIife.text),picked:n,id:"iife"}],i=await c.window.showQuickPick(s,{canPickMany:!0,placeHolder:f(d.generation.extra.options.placeholder)});return i?{overwrite:i.some(r=>r.id==="overwrite"),skipIndexJs:!i.some(r=>r.id==="noSkipIndexJs"),iife:i.some(r=>r.id==="iife")}:null}async function ie(t,e,n,s,i){await c.window.withProgress({location:c.ProgressLocation.Notification,title:f(d.run.generator.title),cancellable:!1},async()=>{await se.generateTests({rootDir:t,outputDir:e,overwrite:n,generateIIFE:i,skipIndexJs:s})})}async function _(t,e=""){let n=await c.window.showOpenDialog({canSelectFolders:!0,canSelectFiles:!1,canSelectMany:!1,title:t,defaultUri:e?c.Uri.file(e):void 0});return n!=null&&n.length?n[0].fsPath:await c.window.showInputBox({title:t,value:e,placeHolder:f(d.select.folder.placeholder)})}function ae(){}module.exports={activate:re,deactivate:ae};
