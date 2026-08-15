const { read } = require('../src/config/database');
const { execSync } = require('child_process');
const path = require('path');

async function getGraphCounts() {
  const nodeQuery = `MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label`;
  const relQuery = `MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY type`;

  const nodeRes = await read(nodeQuery);
  const relRes = await read(relQuery);

  const nodes = {};
  nodeRes.records.forEach(r => {
    nodes[r.get('label')] = r.get('count').toNumber();
  });

  const rels = {};
  relRes.records.forEach(r => {
    rels[r.get('type')] = r.get('count').toNumber();
  });

  return { nodes, rels };
}

async function runIdempotencyTest() {
  console.log('🔄 Starting Seed Idempotency Verification...\n');

  console.log('1. Measuring baseline graph counts in CognoDB...');
  const before = await getGraphCounts();
  console.log('   Baseline Nodes:', before.nodes);
  console.log('   Baseline Relationships:', before.rels);

  console.log('\n2. Executing seed script a second time (npm run seed)...');
  const seedScript = path.resolve(__dirname, 'seed.js');
  execSync(`node "${seedScript}"`, { stdio: 'inherit' });

  console.log('\n3. Measuring post-seed graph counts in CognoDB...');
  const after = await getGraphCounts();
  console.log('   Post-seed Nodes:', after.nodes);
  console.log('   Post-seed Relationships:', after.rels);

  console.log('\n4. Verifying exact match (zero duplicates)...');
  let match = true;

  for (const [label, count] of Object.entries(before.nodes)) {
    if (after.nodes[label] !== count) {
      console.error(`   ❌ Node count mismatch for label ${label}: before=${count}, after=${after.nodes[label]}`);
      match = false;
    }
  }

  for (const [type, count] of Object.entries(before.rels)) {
    if (after.rels[type] !== count) {
      console.error(`   ❌ Relationship count mismatch for type ${type}: before=${count}, after=${after.rels[type]}`);
      match = false;
    }
  }

  if (match) {
    console.log('\n✅ [PASS] Seed script is 100% IDEMPOTENT. No duplicate nodes or relationships created.');
    process.exit(0);
  } else {
    console.error('\n❌ [FAIL] Seed script is NOT idempotent.');
    process.exit(1);
  }
}

runIdempotencyTest().catch(e => {
  console.error('Fatal error during idempotency test:', e);
  process.exit(1);
});
