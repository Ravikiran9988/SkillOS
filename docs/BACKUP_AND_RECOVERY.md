# SkillOS Production Database Backup & Recovery Runbook

## 1. Overview & Architecture

SkillOS uses a Neo4j / CognoDB Aura graph database instance as its primary source of truth for:
- Student career intelligence profiles and skill graphs (`:Person`, `:Skill`, `[:HAS_SKILL]`)
- Career taxonomy and prerequisite dependency DAGs (`:CareerRole`, `[:REQUIRES]`, `[:PREREQUISITE_OF]`, `[:LEADS_TO]`)
- Real-time job market matching graphs (`:JobOpening`, `:Company`, `[:AT_COMPANY]`, `[:REQUIRES]`)
- Project-technology skill inference graphs (`:Project`, `:Technology`, `[:USES_TECHNOLOGY]`, `[:INFERRED_SKILL]`)
- Student saved items and learning roadmap progress (`[:SAVED]`)

---

## 2. Recovery Objectives

| Metric | Target | Description |
|---|---|---|
| **RPO (Recovery Point Objective)** | < 1 hour | Maximum acceptable data loss window |
| **RTO (Recovery Time Objective)** | < 15 minutes | Maximum allowable downtime during restore |
| **Integrity Assurance** | 100% | Zero dangling edges or disconnected student subgraphs |

---

## 3. Automated Backup Strategies

### A. Neo4j Aura Managed Snapshots (Primary)
- **Hourly incremental snapshots** retained for 7 days.
- **Daily full snapshots** retained for 30 days.
- **On-demand snapshots** triggered before any schema migration or seed execution via the Neo4j Aura Console or Cloud API.

### B. Programmatic Graph Export (Secondary / Off-site)
Run the automated backup script:
```bash
node server/scripts/backupGraph.js
```
This exports:
- All graph nodes with their labels, unique identifiers, and property sets.
- All directional relationships with their types and metadata.
- JSON dump stored in `backups/skillos-graph-backup-<timestamp>.json` and synced to S3/Cloud Storage.

---

## 4. Disaster Recovery & Restoration Procedures

### Scenario 1: Restore Latest Automated Backup
```bash
node server/scripts/restoreGraph.js
```

### Scenario 2: Restore from a Specific Backup File
```bash
node server/scripts/restoreGraph.js backups/skillos-graph-backup-2026-08-16T12-00-00-000Z.json
```

### Scenario 3: Clean Slate Database Re-seeding
If restoring to a completely fresh instance or development environment:
```bash
npm --prefix server run seed
```

---

## 5. Post-Restore Verification Checklist

After any restore operation, run the verification test suites:

1. **Verify Graph Integrity & Idempotency**:
   ```bash
   npm --prefix server run test:idempotency
   ```

2. **Verify Security & Data Isolation**:
   ```bash
   npm --prefix server run test:security
   ```

3. **Verify Full API Endpoints & User Journey**:
   ```bash
   npm --prefix server run test
   ```

4. **Verify Health Endpoint**:
   ```bash
   curl -i http://localhost:3001/api/health
   ```
