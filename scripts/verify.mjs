// Boucle de vérification d'une tranche (docs/PLAN.md § 5). S'arrête au premier échec.
import { spawnSync } from 'node:child_process';
import { withServer } from './lib.mjs';

function run(cmd, args) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n✗ Échec : ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

run('npm', ['run', 'lint']);
run('npm', ['run', 'build']);
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'check:contrast']);
run('npm', ['run', 'check:placeholders']);
await withServer(async () => {
  run('npx', ['playwright', 'test']);
  run('node', ['scripts/lighthouse.mjs']);
});
console.log('\n✓ Vérifications passées. Lire les captures (artifacts/screens/) avant de conclure.');
