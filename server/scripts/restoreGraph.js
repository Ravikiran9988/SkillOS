const fs = require('fs');
const path = require('path');
const { write } = require('../src/config/database');

async function restoreDatabase(backupFilePath) {
  if (!backupFilePath) {
    // Find latest backup in backups directory
    const backupDir = path.resolve(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory ${backupDir} does not exist.`);
    }
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json')).sort().reverse();
    if (files.length === 0) {
      throw new Error('No backup files found in backups directory.');
    }
    backupFilePath = path.join(backupDir, files[0]);
  }

  console.log(`🔄 Restoring SkillOS Graph Database from ${backupFilePath}...`);
  const raw = fs.readFileSync(backupFilePath, 'utf8');
  const backup = JSON.parse(raw);

  console.log(`📊 Found ${backup.nodes.length} nodes and ${backup.relationships.length} relationships in backup.`);

  // 1. Restore nodes
  for (const node of backup.nodes) {
    const label = node.labels[0] || 'Node';
    await write(
      `MERGE (n:\`${label}\` {id: $id})
       SET n += $props`,
      { id: node.id, props: node.properties }
    );
  }
  console.log(`✅ Nodes restored (${backup.nodes.length})`);

  // 2. Restore relationships
  for (const rel of backup.relationships) {
    await write(
      `MATCH (a:\`${rel.from.label}\` {id: $fromId})
       MATCH (b:\`${rel.to.label}\` {id: $toId})
       MERGE (a)-[r:\`${rel.type}\`]->(b)
       SET r += $props`,
      {
        fromId: rel.from.id,
        toId: rel.to.id,
        props: rel.properties,
      }
    );
  }
  console.log(`✅ Relationships restored (${backup.relationships.length})`);
  console.log(`\n🎉 Graph restoration complete!`);
}

const targetFile = process.argv[2];
restoreDatabase(targetFile).catch((err) => {
  console.error('❌ Restore failed:', err);
  process.exit(1);
});
