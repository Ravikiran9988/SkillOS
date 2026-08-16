const fs = require('fs');
const path = require('path');
const { read } = require('../src/config/database');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = path.join(backupDir, `skillos-graph-backup-${timestamp}.json`);
  console.log(`📦 Starting SkillOS CognoDB/Neo4j graph backup to ${filename}...`);

  // 1. Export all nodes
  const nodesRes = await read(`
    MATCH (n)
    RETURN labels(n) AS labels, n.id AS id, properties(n) AS props
  `);

  const nodes = nodesRes.records.map((r) => ({
    labels: r.get('labels'),
    id: r.get('id'),
    properties: r.get('props'),
  }));

  // 2. Export all relationships
  const relsRes = await read(`
    MATCH (a)-[r]->(b)
    RETURN type(r) AS type,
           labels(a)[0] AS fromLabel, a.id AS fromId,
           labels(b)[0] AS toLabel, b.id AS toId,
           properties(r) AS props
  `);

  const relationships = relsRes.records.map((r) => ({
    type: r.get('type'),
    from: { label: r.get('fromLabel'), id: r.get('fromId') },
    to: { label: r.get('toLabel'), id: r.get('toId') },
    properties: r.get('props'),
  }));

  const backupData = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    nodeCount: nodes.length,
    relationshipCount: relationships.length,
    nodes,
    relationships,
  };

  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`✅ Backup complete! Exported ${nodes.length} nodes and ${relationships.length} relationships.`);
  console.log(`📁 File: ${filename}\n`);
}

backupDatabase().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
