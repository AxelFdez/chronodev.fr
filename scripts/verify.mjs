// Boucle de vérification d'une tranche (docs/PLAN.md § 5). S'arrête au premier échec.
// --sans-lighthouse : pour la CI, où un runner partagé fait varier la mesure plus que la marge.
import { spawnSync } from 'node:child_process';
import { withServer } from './lib.mjs';

const sansLighthouse = process.argv.includes('--sans-lighthouse');

// Lève une erreur plutôt que de quitter : withServer doit pouvoir arrêter son serveur.
function run(cmd, args) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`Échec : ${cmd} ${args.join(' ')}`);
}

try {
  run('npm', ['run', 'lint']);
  run('npm', ['run', 'build']);
  run('npm', ['run', 'typecheck']);
  run('npm', ['run', 'check:contrast']);
  run('npm', ['run', 'check:placeholders']);
  await withServer(async () => {
    run('npx', ['playwright', 'test']);
    if (sansLighthouse) return;
    // Lighthouse simule un CPU bridé à partir des temps mesurés : juste après la suite de
    // tests, la machine encore chargée fausse la mesure (constaté : 90 au lieu de 97).
    console.log('\n… 15 s de repos avant Lighthouse');
    await new Promise((r) => setTimeout(r, 15_000));
    run('node', ['scripts/lighthouse.mjs']);
  });
  console.log(
    '\n✓ Vérifications passées. Lire les captures (artifacts/screens/) avant de conclure.',
  );
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  process.exitCode = 1;
}
