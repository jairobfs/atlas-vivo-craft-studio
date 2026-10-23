import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const base=process.cwd();
const files=['index.html','style.css','clinical-lab.css','clinical-lab.js','knowledge-panels.js','app.js','model3d.js','webgl3d.js','craft-sync.js','maneuver-engine.js','unified-data.js','mechanism-workbench.js','favicon.svg','manifest.webmanifest','sw.js','apple-touch-icon.png'];
const assets=Object.fromEntries(await Promise.all(files.map(async file=>[`/${file}`,file.endsWith('.png')?{base64:(await readFile(join(base,'web',file))).toString('base64')}:await readFile(join(base,'web',file),'utf8')
])));
const core=await readFile(join(base,'worker/index.js'),'utf8');
const output=`/* Generated from web/ and worker/index.js: do not edit. */\nconst ASSETS=${JSON.stringify(assets)};\n${core}\n`;
await mkdir(join(base,'dist/server'),{recursive:true});
await writeFile(join(base,'dist/server/index.js'),output);
console.log(`Worker assembled: ${files.length} web assets, ${Math.round(output.length/1024)} KiB.`);
