# SkillOS Graph Data Model

## Node Labels

| Label | Properties |
|-------|-----------|
| `Person` | id, name, email, educationLevel |
| `Skill` | id, name, category, difficulty |
| `Technology` | id, name, category |
| `Project` | id, name, description, difficulty |
| `Job` | id, title, experienceLevel, location, salaryRange |
| `Company` | id, name, industry |
| `Course` | id, title, platform, difficulty, duration |
| `CareerRole` | id, title, description |

## Relationships

```
Person -[:HAS_SKILL {proficiency}]-> Skill
Person -[:WORKED_ON]-> Project
Person -[:TARGETS]-> CareerRole

Skill -[:PREREQUISITE_OF]-> Skill
Project -[:USES_TECHNOLOGY]-> Technology
Project -[:DEMONSTRATES]-> Skill

CareerRole -[:REQUIRES {importance}]-> Skill
CareerRole -[:LEADS_TO]-> CareerRole

Job -[:FOR_ROLE]-> CareerRole
Job -[:OFFERED_BY]-> Company
Job -[:REQUIRES]-> Skill

Course -[:TEACHES]-> Skill
```

## ASCII Diagram

```
  [Person]
      |
      |-- HAS_SKILL {proficiency} --> [Skill] <-- TEACHES -- [Course]
      |                                  |
      |                           PREREQUISITE_OF
      |                                  |
      |                              [Skill]...
      |
      |-- WORKED_ON --> [Project]
      |                     |
      |                     |-- USES_TECHNOLOGY --> [Technology]
      |                     |-- DEMONSTRATES   --> [Skill]
      |
      |-- TARGETS --> [CareerRole]
                          |
                          |-- REQUIRES {importance} --> [Skill]
                          |-- LEADS_TO --> [CareerRole]
                          |
                        (has)
                          |
                       [Job] -- FOR_ROLE --> [CareerRole]
                       [Job] -- OFFERED_BY --> [Company]
                       [Job] -- REQUIRES --> [Skill]
```

## Graph Queries Implemented

| Query | Hops | Description |
|-------|------|-------------|
| A | 1 | Student → HAS_SKILL → Skill |
| B | 2 | Person → HAS_SKILL → Skill ← REQUIRES ← CareerRole |
| C | 2 | CareerRole → REQUIRES → Skill (not in student skills) |
| D | 3+ | Person → Skill ← CareerRole → LEADS_TO → CareerRole |
| E | 3 | CareerRole ← FOR_ROLE ← Job → OFFERED_BY → Company |
| F | n | Skill ← PREREQUISITE_OF* ← root Skill (chain) |
| G | 2 | Course → TEACHES → Skill |
| H | 2 | Project → USES_TECHNOLOGY → Technology + DEMONSTRATES → Skill |
