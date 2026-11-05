// The existing Render build runs npm test. Install the lockfile only on a fresh build.
try{require.resolve('pg');}catch{const cli=process.env.npm_execpath;if(!cli)throw Error('Run npm install first.');require('node:child_process').execFileSync(process.execPath,[cli,'ci','--ignore-scripts','--no-audit','--no-fund'],{stdio:'inherit'});}
