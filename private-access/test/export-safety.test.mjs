import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const repository = path.resolve(import.meta.dirname,'../..');
const filename='got-evidence-revision-7.private.json';
test('private recovery export is ignored by Git, upload rules, and the actual current static builder',async()=>{
  const ignored=await exec('git',['check-ignore','--no-index',filename,`private-access/${filename}`],{cwd:repository});
  assert.deepEqual(ignored.stdout.trim().split('\n'),[filename,`private-access/${filename}`]);
  const vercel=await fs.readFile(path.join(repository,'.vercelignore'),'utf8');
  assert.ok(vercel.split(/\r?\n/).includes('**/*.private.json'));
  const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'got-export-safety-'));
  try {
    await fs.mkdir(path.join(scratch,'scripts'));
    await fs.copyFile(path.join(repository,'scripts/build.mjs'),path.join(scratch,'scripts/build.mjs'));
    await fs.writeFile(path.join(scratch,'index.html'),'<p>synthetic public fixture</p>');
    await fs.writeFile(path.join(scratch,filename),JSON.stringify({fixture:'synthetic private evidence'}));
    await exec(process.execPath,[path.join(scratch,'scripts/build.mjs')],{cwd:scratch});
    assert.match(await fs.readFile(path.join(scratch,'dist/index.html'),'utf8'),/public fixture/);
    await assert.rejects(fs.stat(path.join(scratch,'dist',filename)),error=>error.code==='ENOENT');
  } finally { await fs.rm(scratch,{recursive:true,force:true}); }
});
