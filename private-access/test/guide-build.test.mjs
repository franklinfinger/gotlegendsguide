import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),repository=path.resolve(import.meta.dirname,'../..');
test('clean root lockfile install supports default and private builds without subpackage dependencies or private assets',async()=>{
  const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'got-guide-build-'));
  try{
    await fs.mkdir(path.join(scratch,'scripts'));await fs.mkdir(path.join(scratch,'private-access'));
    await fs.copyFile(path.join(repository,'scripts/build.mjs'),path.join(scratch,'scripts/build.mjs'));
    for(const entry of await fs.readdir(repository,{withFileTypes:true}))if(entry.isFile()&&/\.(js|html|css)$/.test(entry.name))await fs.copyFile(path.join(repository,entry.name),path.join(scratch,entry.name));
    for(const file of ['package.json','package-lock.json','vercel.json'])await fs.copyFile(path.join(repository,file),path.join(scratch,file));
    await fs.cp(path.join(repository,'private-access/src'),path.join(scratch,'private-access/src'),{recursive:true});
    await fs.copyFile(path.join(repository,'private-access/build-guide.mjs'),path.join(scratch,'private-access/build-guide.mjs'));
    await fs.writeFile(path.join(scratch,'got-test.private.json'),JSON.stringify({privateFixture:'DO_NOT_SHIP_PRIVATE_FIXTURE'}));
    await fs.writeFile(path.join(scratch,'reviewed-handoff.json'),JSON.stringify({privateFixture:'DO_NOT_SHIP_HANDOFF_FIXTURE'}));
    const deployment=JSON.parse(await fs.readFile(path.join(scratch,'vercel.json'),'utf8'));
    assert.equal(deployment.installCommand,'npm ci --include=dev --ignore-scripts --no-audit --no-fund');
    const rootPackage=JSON.parse(await fs.readFile(path.join(scratch,'package.json'),'utf8'));
    const isolatedPackage=JSON.parse(await fs.readFile(path.join(repository,'private-access/package.json'),'utf8'));
    assert.equal(rootPackage.devDependencies['@supabase/supabase-js'],isolatedPackage.dependencies['@supabase/supabase-js']);
    assert.equal(rootPackage.devDependencies.esbuild,isolatedPackage.devDependencies.esbuild);
    assert.equal(rootPackage.devDependencies['@electric-sql/pglite'],undefined);
    assert.equal(rootPackage.devDependencies['playwright-core'],undefined);
    await assert.rejects(fs.stat(path.join(scratch,'node_modules')),error=>error.code==='ENOENT');
    await exec('npm',deployment.installCommand.split(' ').slice(1),{cwd:scratch,env:{...process.env,NODE_ENV:'production',npm_config_omit:'dev',npm_config_cache:path.join(os.tmpdir(),'got-npm-cache')},timeout:120000});
    for(const dependency of ['@supabase/supabase-js','esbuild']) {
      const installed=JSON.parse(await fs.readFile(path.join(scratch,'node_modules',dependency,'package.json'),'utf8'));
      assert.equal(installed.version,rootPackage.devDependencies[dependency]);
    }
    await assert.rejects(fs.stat(path.join(scratch,'private-access/node_modules')),error=>error.code==='ENOENT','no hidden subpackage install or symlink');
    await assert.rejects(fs.stat(path.join(scratch,'node_modules/@electric-sql/pglite')),error=>error.code==='ENOENT');
    await assert.rejects(fs.stat(path.join(scratch,'node_modules/playwright-core')),error=>error.code==='ENOENT');
    const env={...process.env,GOT_PRIVATE_ENABLED:'false',GOT_PRIVATE_SUPABASE_URL:'http://localhost:54321',GOT_PRIVATE_PUBLISHABLE_KEY:'sb_publishable_synthetic',GOT_PRIVATE_ALLOW_HOSTED:'false',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:''};
    const build=changes=>exec(process.execPath,['scripts/build.mjs'],{cwd:scratch,env:{...env,...changes}});
    await build();
    const configPath=path.join(scratch,'dist/supabase-config.js');
    assert.match(await fs.readFile(configPath,'utf8'),/GOT_PRIVATE_CONFIG = {"enabled":false}/);
    await assert.rejects(fs.stat(path.join(scratch,'dist/private-guide-runtime.js')),error=>error.code==='ENOENT');
    await build({GOT_PRIVATE_ENABLED:'true',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'never_emit_an_unrelated_key'});
    const enabled=await fs.readFile(configPath,'utf8');
    assert.match(enabled,/"enabled":true/);assert.match(enabled,/sb_publishable_synthetic/);assert.doesNotMatch(enabled,/never_emit/);assert.match(enabled,/GOT_SUPABASE_CONFIG = {"url":"","publishableKey":""}/);
    const files=await fs.readdir(path.join(scratch,'dist'));
    assert.deepEqual(files.filter(name=>name.endsWith('.js')).sort(),['guide.js','health.js','private-guide-runtime.js','supabase-config.js']);
    assert.equal(files.some(name=>name.endsWith('.json')),false,'no legacy catalog or arbitrary root JSON is copied');
    for(const excluded of ['private-access','node_modules','package.json','package-lock.json','got-test.private.json','reviewed-handoff.json'])assert.equal(files.includes(excluded),false,`${excluded} cannot enter private static output`);
    for(const file of files)if(/\.(html|js|css)$/.test(file))assert.doesNotMatch(await fs.readFile(path.join(scratch,'dist',file),'utf8'),/DO_NOT_SHIP_(PRIVATE|HANDOFF)_FIXTURE/);
    for(const file of files.filter(name=>name.endsWith('.html'))) {
      const html=await fs.readFile(path.join(scratch,'dist',file),'utf8');
      assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i,'no third-party scripts share private session origin');
      if(file.startsWith('legacy-')||file==='avatar-demo.html') {assert.match(html,/Open the private guide/);assert.doesNotMatch(html,/<script/i);}
    }
    const runtime=await fs.readFile(path.join(scratch,'dist/private-guide-runtime.js'),'utf8');
    assert.match(runtime,/mountPrivateGuide/);assert.doesNotMatch(runtime,/from ["']@supabase/,'SDK is self-contained, no runtime CDN dependency');
    await assert.rejects(build({GOT_PRIVATE_ENABLED:'true',GOT_PRIVATE_PUBLISHABLE_KEY:'sb_secret_forbidden'}),/publishable key/);
    assert.equal(await fs.readFile(configPath,'utf8'),enabled,'bad configuration leaves prior local output intact');
    await build();await assert.rejects(fs.stat(path.join(scratch,'dist/private-guide-runtime.js')),error=>error.code==='ENOENT');
    for(const file of ['index.html','recommendations.html','champions.html','items.html','builder.html','raids.html','war.html','dragons.html','factions.html','status-effects.html','strategy.html'])assert.match(await fs.readFile(path.join(scratch,'dist',file),'utf8'),/src="guide.js"/);
    assert.match(await fs.readFile(path.join(scratch,'dist/health.html'),'utf8'),/src="health.js"/);
  }finally{await fs.rm(scratch,{recursive:true,force:true});}
});
