# SkillOS — Student Skill & Career Intelligence Graph

> A production-ready full-stack web application that maps the complex relationships between students, skills, technologies, projects, career roles, jobs, and companies in a graph database — powered by **CognoDB**.

---

## 📑 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Why a Graph Database?](#-why-a-graph-database)
3. [Graph Data Model & Schema](#-graph-data-model--schema)
4. [Key Graph Queries (openCypher)](#-key-graph-queries-opencypher)
5. [Architecture & Technology Stack](#-architecture--technology-stack)
6. [Getting Started & Local Setup](#-getting-started--local-setup)
7. [CognoDB Configuration](#-cognodb-configuration)
8. [Automated Test Suites](#-automated-test-suites)
9. [API Reference](#-api-reference)
10. [Frontend Features & Screenshots](#-frontend-features--screenshots)
11. [Hosted Demo & Screen Recording](#-hosted-demo--screen-recording)

---

## 🎯 Problem Statement

Students and career changers often know what career they want to pursue, but they face three painful blind spots:

1. **Hidden Skill Transferability**: Which skills they already possess that satisfy their target role.
2. **Missing Competency Gaps**: What specific skills they are missing, weighted by industry importance (Critical, High, Medium).
3. **Prerequisite Sequencing**: What they should learn next — and in what exact dependency order, respecting multi-level prerequisite chains (e.g., Python → Pandas → Scikit-learn → Machine Learning → Deep Learning → PyTorch → LLM Fine-tuning).

Traditional relational databases store skills as flat rows in join tables. They can answer *"Does student X have skill Y?"* but struggle with recursive, variable-depth traversals across dependency chains, career progression routes, and multi-hop entity matching.

---

## 🕸️ Why a Graph Database?

### The Relational Limitation
In SQL, finding missing skills and computing prerequisite chains requires recursive Common Table Expressions (CTEs) or multiple application-side query loops:

```sql
-- Relational Recursive CTE for prerequisite chains:
WITH RECURSIVE PrereqChain AS (
    SELECT prerequisite_id, target_id, 1 AS depth
    FROM skill_prerequisites
    WHERE target_id = 'skill-llm'
    UNION ALL
    SELECT sp.prerequisite_id, sp.target_id, pc.depth + 1
    FROM skill_prerequisites sp
    JOIN PrereqChain pc ON sp.target_id = pc.prerequisite_id
)
SELECT * FROM PrereqChain ORDER BY depth DESC;
```

As dependency graphs grow, this SQL pattern suffers from severe query complexity, join table explosion (`student_skills`, `career_skills`, `job_skills`, `project_skills`, `project_technologies`), and maintenance overhead.

### The Graph-Native Advantage
In **CognoDB** (openCypher over Bolt), graph traversals are concise, declarative, and intuitive:

```cypher
// Variable-length prerequisite DAG traversal:
MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
RETURN [node IN nodes(path) | node.name] AS prerequisiteChain,
       length(path) AS depth
ORDER BY depth DESC LIMIT 1
```

Graph databases also enable seamless 2-hop, 3-hop, and multi-hop traversals:
- **Student → Career Matching** (2 hops): `(Person)-[:HAS_SKILL]->(Skill)<-[:REQUIRES]-(CareerRole)`
- **Job Matching with Companies** (3 hops): `(Person)-[:HAS_SKILL]->(Skill)<-[:REQUIRES]-(Job)-[:OFFERED_BY]->(Company)`
- **Career Path Progression** (3+ hops): `(Person)-[:HAS_SKILL]->(Skill)<-[:REQUIRES]-(CareerRole)-[:LEADS_TO*1..3]->(CareerRole)`
- **Project Skill Inference** (Shared tech graph): `(Project)-[:USES_TECHNOLOGY]->(Technology)<-[:USES_TECHNOLOGY]-(OtherProject)-[:DEMONSTRATES]->(Skill)`

---

## 📐 Graph Data Model & Schema

```
[Person] (Students)
   │
   ├─[:HAS_SKILL {proficiency}]──────> [Skill] <──────[:TEACHES]────── [Course]
   │                                      │
   │                               [:PREREQUISITE_OF]
   │                                      ↓
   │                                   [Skill] ... (DAG)
   │
   ├─[:WORKED_ON]────────────────────> [Project]
   │                                      ├─[:USES_TECHNOLOGY]──> [Technology]
   │                                      └─[:DEMONSTRATES]─────> [Skill]
   │
   └─[:TARGETS]──────────────────────> [CareerRole]
                                          ├─[:REQUIRES {importance}]─> [Skill]
                                          ├─[:LEADS_TO]──────────────> [CareerRole]
                                          │
                                       [Job] ──[:FOR_ROLE]───────────> [CareerRole]
                                          ├────[:OFFERED_BY]─────────> [Company]
                                          └────[:REQUIRES]───────────> [Skill]
```

### Labeled Nodes
- **`Person`**: `id`, `name`, `email`, `educationLevel`
- **`Skill`**: `id`, `name`, `category`, `difficulty`
- **`CareerRole`**: `id`, `title`, `description`
- **`Job`**: `id`, `title`, `experienceLevel`, `location`, `salaryRange`
- **`Company`**: `id`, `name`, `industry`
- **`Course`**: `id`, `title`, `platform`, `difficulty`, `duration`
- **`Project`**: `id`, `name`, `description`, `difficulty`
- **`Technology`**: `id`, `name`, `category`

### Typed Relationships & Properties
- `(:Person)-[:HAS_SKILL {proficiency: 'Beginner'|'Intermediate'|'Advanced'}]->(:Skill)`
- `(:Person)-[:TARGETS]->(:CareerRole)`
- `(:Person)-[:WORKED_ON]->(:Project)`
- `(:Skill)-[:PREREQUISITE_OF]->(:Skill)`
- `(:CareerRole)-[:REQUIRES {importance: 'critical'|'high'|'medium'}]->(:Skill)`
- `(:CareerRole)-[:LEADS_TO]->(:CareerRole)`
- `(:Job)-[:FOR_ROLE]->(:CareerRole)`
- `(:Job)-[:OFFERED_BY]->(:Company)`
- `(:Job)-[:REQUIRES]->(:Skill)`
- `(:Course)-[:TEACHES]->(:Skill)`
- `(:Project)-[:USES_TECHNOLOGY]->(:Technology)`
- `(:Project)-[:DEMONSTRATES]->(:Skill)`

---

## ⚡ Key Graph Queries (openCypher)

All Cypher queries in SkillOS are **100% parameterized** with parameter maps (`{ personId: '...' }`) to prevent Cypher injection and maximize query plan caching.

### Query A: Student Skills (1-Hop)
```cypher
MATCH (p:Person {id: $personId})-[r:HAS_SKILL]->(s:Skill)
RETURN s, r.proficiency AS proficiency
ORDER BY s.name ASC
```

### Query B: Career Role Matching (2-Hop)
```cypher
MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)
WITH collect(s.id) AS studentSkillIds
MATCH (cr:CareerRole)-[:REQUIRES]->(rs:Skill)
WITH cr, collect(rs.id) AS requiredSkillIds, studentSkillIds
WITH cr, requiredSkillIds,
     [id IN requiredSkillIds WHERE id IN studentSkillIds] AS matchedSkillIds
RETURN cr,
       size(matchedSkillIds) AS matchedCount,
       size(requiredSkillIds) AS totalRequired,
       toFloat(size(matchedSkillIds)) / toFloat(size(requiredSkillIds)) * 100.0 AS matchPct
ORDER BY matchPct DESC
```

### Query C: Missing Skills Gap Analysis
```cypher
MATCH (cr:CareerRole {id: $careerRoleId})-[r:REQUIRES]->(s:Skill)
WHERE NOT EXISTS {
  MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s)
}
RETURN s, r.importance AS importance
ORDER BY CASE r.importance WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
```

### Query D: Multi-Hop Career Progression (3+ Hops)
```cypher
MATCH path = (start:CareerRole {id: $startId})-[:LEADS_TO*1..3]->(target:CareerRole)
RETURN [n IN nodes(path) | n.title] AS careerPath,
       length(path) AS hops
ORDER BY hops DESC
```

### Query E: 3-Hop Job Recommendation Traversal
```cypher
MATCH (p:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job)-[:OFFERED_BY]->(c:Company)
WITH j, c, collect(DISTINCT s) AS matchedSkills
MATCH (j)-[:REQUIRES]->(req:Skill)
WITH j, c, matchedSkills, collect(DISTINCT req) AS allRequired
RETURN j, c,
       matchedSkills,
       size(matchedSkills) AS matchCount,
       size(allRequired) AS totalRequired,
       toFloat(size(matchedSkills)) / toFloat(size(allRequired)) * 100.0 AS matchPct
ORDER BY matchPct DESC, j.title ASC
```

### Query F: Variable-Length Prerequisite Traversal (Arbitrary Depth)
```cypher
MATCH path = (root:Skill)-[:PREREQUISITE_OF*]->(target:Skill {id: $skillId})
WHERE NOT EXISTS { MATCH (x:Skill)-[:PREREQUISITE_OF]->(root) }
RETURN [node IN nodes(path) | node.id] AS chain,
       [node IN nodes(path) | node.name] AS names,
       length(path) AS depth
ORDER BY depth DESC
LIMIT 1
```

### Query H: Project Skill Inference via Shared Tech Stack
```cypher
MATCH (proj:Project {id: $projectId})-[:USES_TECHNOLOGY]->(t:Technology)
MATCH (proj)-[:DEMONSTRATES]->(directSkill:Skill)
WITH proj, collect(DISTINCT directSkill) AS directSkills, collect(DISTINCT t) AS technologies
OPTIONAL MATCH (t)<-[:USES_TECHNOLOGY]-(otherProj:Project)-[:DEMONSTRATES]->(inferredSkill:Skill)
WHERE otherProj.id <> proj.id
RETURN proj,
       directSkills,
       [s IN collect(DISTINCT inferredSkill) WHERE NOT s IN directSkills] AS inferredSkills
```

---

## 🏗️ Architecture & Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│                   Vite React Frontend                    │
│   • React 18 • Tailwind CSS • Lucide Icons • React Flow   │
└────────────────────────────┬─────────────────────────────┘
                             │ REST / JSON (Axios)
┌────────────────────────────▼─────────────────────────────┐
│                   Express API Server                     │
│   • Node.js 18+ • Centralized Error Handler (503/404/400) │
└────────────────────────────┬─────────────────────────────┘
                             │ Service & Repository Layers
┌────────────────────────────▼─────────────────────────────┐
│                 Official Neo4j Driver                    │
│   • neo4j-driver v5 (Parameterized openCypher)           │
└────────────────────────────┬─────────────────────────────┘
                             │ Bolt Protocol (bolt+s://)
┌────────────────────────────▼─────────────────────────────┐
│                   CognoDB Cloud Graph                    │
│   • 205 Nodes • 370+ Relationships • Labeled Indices      │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- A free **CognoDB** instance from [cognodb.com](https://cognodb.com)

### 2. Clone and Configure
```bash
git clone https://github.com/your-username/skillos.git
cd skillos

# Copy environment template
cp .env.example .env
```

### 3. Add CognoDB Credentials to `.env`
```env
COGNODB_URI=bolt+s://db-xxxxxxxx.databases.cognodb.com
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your_actual_password_here
PORT=3001
NODE_ENV=development
```

### 4. Install Dependencies
```bash
# Install root/server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### 5. Seed the Graph Database (High Performance & Idempotent)
```bash
cd server
npm run seed
```

This populates CognoDB with:
- **20** Students (`Person`)
- **50** Skills across 15 categories
- **37** Prerequisite relationships (`PREREQUISITE_OF`)
- **20** Technologies (`Technology`)
- **20** Real-world Projects (`Project`)
- **15** Career Roles (`CareerRole`) with 13 `LEADS_TO` progression routes
- **30** Live Jobs (`Job`) with salaries & requirements
- **10** Tier-1 Tech Companies (`Company`)
- **30** Curated Courses (`Course`)

### 6. Start the Application
In terminal 1 (Backend):
```bash
cd server && npm run dev
# API running on http://localhost:3001
```

In terminal 2 (Frontend):
```bash
cd client && npm run dev
# Web app running on http://localhost:5173
```

---

## 🧪 Automated Test Suites

SkillOS includes a comprehensive suite of automated verification scripts:

```bash
cd server

# 1. Complete REST API & Traversal Test Suite (19 tests)
npm run test:api

# 2. Deep Graph-Native Queries Verification (6 tests)
npm run test:graph

# 3. Edge Cases & Error Handling Suite (11 tests)
npm run test:edge

# 4. Seed Script Idempotency Verification
npm run test:idempotency

# 5. End-to-End User Journey Simulation (10 tests)
npm run test:journey
```

---

## 📡 API Reference

| Method | Endpoint | Description | Query Used |
|---|---|---|---|
| `GET` | `/api/health` | CognoDB connectivity health check | `RETURN 1` |
| `GET` | `/api/students` | List all 20 students with target careers | `MATCH (p:Person)` |
| `GET` | `/api/students/:id` | Student profile with current skills & projects | Query A |
| `POST` | `/api/students/:id/skills` | Add skill with proficiency (Beginner/Inter/Adv) | `MERGE (p)-[:HAS_SKILL]->(s)` |
| `DELETE` | `/api/students/:id/skills/:skillId` | Remove skill from student | `MATCH (p)-[r:HAS_SKILL]->(s) DELETE r` |
| `POST` | `/api/students/:id/target-career` | Update target career role | `MERGE (p)-[:TARGETS]->(cr)` |
| `GET` | `/api/students/:id/career-match` | 2-hop career match ranking (%) | Query B |
| `GET` | `/api/students/:id/career-match?careerId=` | Career gap analysis (matched vs missing) | Query C |
| `GET` | `/api/students/:id/learning-path?careerId=` | Ordered prerequisite learning path + courses | Queries F & G |
| `GET` | `/api/students/:id/recommended-jobs` | 3-hop job matching traversal | Query E |
| `GET` | `/api/students/:id/graph` | Subgraph node-link payload for React Flow | Multi-label extraction |
| `GET` | `/api/careers` | All 15 career roles | `MATCH (cr:CareerRole)` |
| `GET` | `/api/careers/explore` | `LEADS_TO` career progression graph | Query D |
| `GET` | `/api/careers/:id` | Career detail with required skills & weights | `MATCH (cr)-[:REQUIRES]->(s)` |
| `GET` | `/api/careers/:id/jobs` | Job openings for a specific career | `MATCH (j)-[:FOR_ROLE]->(cr)` |
| `GET` | `/api/jobs` | All 30 job postings with company links | `MATCH (j)-[:OFFERED_BY]->(c)` |
| `GET` | `/api/jobs/companies` | All 10 hiring companies | `MATCH (c:Company)` |
| `GET` | `/api/projects` | All 20 projects with technologies & skills | `MATCH (p:Project)` |
| `GET` | `/api/projects/:id/skills` | Project direct & inferred skills | Query H |

---

## 🎨 Frontend Features & Screenshots

- **Live Student Switcher**: Switch between students (e.g. Master's researcher, Junior dev, Self-taught) to observe real-time recalculation of career matches and learning paths.
- **Career Gap Analysis Card**: Visual progress bar showing match percentage, matched skills in green chips, and missing skills in priority order.
- **Prerequisite Learning Path**: Interactive stepper diagram guiding the student through prerequisite-ordered competencies with direct links to courses.
- **Interactive Graph Visualizer**: Powered by **React Flow**, displaying an interactive node-link graph of the student's personal knowledge ecosystem (Students, Skills, Careers, Jobs, Projects).
- **Graceful Error Handling & Degraded State**: `<ErrorState>` component with retry buttons that appears if CognoDB becomes unreachable without crashing the UI.

---

## 📸 Screenshots

### Dashboard
![SkillOS Dashboard](docs/screenshots/dashboard.png)

### Student Profile
![SkillOS Student Profile](docs/screenshots/profile.png)

### Career Skill Gap
![SkillOS Career Skill Gap](docs/screenshots/career-match.png)

### Prerequisite Learning Path
![SkillOS Learning Path](docs/screenshots/learning-path.png)

### Job Recommendations
![SkillOS Job Recommendations](docs/screenshots/jobs.png)

### Project Skill Inference
![SkillOS Project Skill Inference](docs/screenshots/projects.png)

### Graph Explorer
![SkillOS Graph Explorer](docs/screenshots/graph.png)

---

## 🔗 Hosted Demo & Screen Recording

- **Live Hosted Application**: `[Add Hosted Demo URL Here]`
- **Screen Recording Walkthrough**: `[Add Loom / YouTube Demo URL Here]`

---

## 🛡️ Security & Cypher Safety Audit

- ✅ `.env` is included in `.gitignore` and never committed.
- ✅ Zero database credentials exist in source code, documentation, or frontend bundles.
- ✅ 100% of Cypher queries use parameterized maps; zero string-interpolated or concatenated Cypher.
- ✅ All driver connections use encrypted Bolt (`bolt+s://`).

---

## 👥 Author & Assignment

Built for the **Wexa AI CognoDB Assignment 2** — Student Skill & Career Intelligence Graph.
