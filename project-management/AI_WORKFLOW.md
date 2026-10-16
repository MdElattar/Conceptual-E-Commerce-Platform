# AI Development Workflow — DKTEC Equipment Marketplace

> **Last Updated**: 2026-07-05
> This workflow is **mandatory** for every future AI development session.
> It defines the exact sequence of operations for feature completion, session startup, and session shutdown.

---

## Core Rules

| Rule | Description |
|------|-------------|
| **Single Feature** | Never start multiple features simultaneously. One feature at a time, always. |
| **Finish What You Start** | Never leave partially implemented functionality. Complete every feature before moving on. |
| **No Duplication** | Never duplicate components. Reuse existing patterns. Never redesign working systems unnecessarily. |
| **Backward Compatibility** | Never break backward compatibility without documenting it in CHANGELOG.md and DECISIONS.md. |
| **Architecture Preservation** | Always preserve the project architecture. Follow existing patterns. |
| **Convention Consistency** | Always follow existing coding conventions. Do not introduce new styles without team consensus. |
| **Doc Synchronization** | Always keep documentation synchronized with source code. Every code change must have corresponding doc updates. |

---

## Session Startup Workflow

At the **beginning** of every AI session, perform these steps in order:

### Step 1: Read Every File in project-management/
Read ALL documentation files to fully understand the project before making any changes:
1. `AI_CONTEXT.md` — Project context, tech stack, conventions
2. `MASTER_SPEC.md` — Complete project specification (single source of truth)
3. `PROJECT_STATUS.md` — Current project state and module completion
4. `NEXT_TASK.md` — The single active task to work on
5. `ROADMAP.md` — Overall phase context and completed/future work
6. `BACKLOG.md` — Prioritized implementation backlog
7. `FEATURES.md` — Detailed feature inventory (completed + planned)
8. `DECISIONS.md` — Architectural decisions and rationale
9. `KNOWN_ISSUES.md` — Known bugs, issues, and technical debt
10. `ARCHITECTURE.md` — System architecture and data flows
11. `VISION.md` — Product vision and long-term strategy
12. `AI_WORKFLOW.md` — THIS FILE — the mandatory workflow
13. `CHANGELOG.md` — Recent changes
14. `PROJECT_INDEX.md` — File inventory

### Step 2: Understand the Current Architecture
- Understand what is implemented, what is in progress, and what is planned
- Identify the current phase from ROADMAP.md
- Understand the single active task from NEXT_TASK.md

### Step 3: Read NEXT_TASK.md
- This file defines the **exactly one** task to work on
- Never deviate from this task
- Never start work on any other task

### Step 4: Continue from the Highest-Priority Unfinished Task
- Work on the task specified in NEXT_TASK.md
- Never restart completed work
- Never repeat completed implementations

---

## Feature Implementation Flow

### Before Writing Code
1. Read all relevant documentation (Session Startup Workflow)
2. Understand the feature requirements from FEATURES.md / BACKLOG.md
3. Check for existing patterns and conventions in the codebase
4. Plan the implementation approach

### While Implementing
1. Work on **EXACTLY ONE** task at a time (from NEXT_TASK.md)
2. Never modify multiple features in parallel
3. Follow existing code conventions (see AI_CONTEXT.md > Coding Standards)
4. Handle ALL states for every UI component:
   - **Loading state**: Skeleton, spinner, or progressive loading
   - **Empty state**: Informative message with actionable CTA
   - **Error state**: Friendly error message with retry option
   - **Success state**: Confirmation feedback
   - **Edge cases**: Null, undefined, empty arrays, boundary values
5. Ensure responsive design works on mobile, tablet, and desktop
6. Never commit partial or broken work
7. Never leave console.log statements, TODO comments, or dead code
8. Never introduce security vulnerabilities (validate inputs, sanitize outputs, protect routes)

### After Completing a Feature
Execute this exact sequence — **do not skip any step**:

| Step | Action | Details |
|------|--------|---------|
| 1 | **Verify Implementation** | Test the feature works correctly. Check all states (loading, empty, error, success, edge cases). Test on mobile + desktop. |
| 2 | **Fix Bugs** | If any bugs are found, fix them immediately before proceeding. |
| 3 | **Run or Update Tests** | If tests exist, run them. Update tests to cover new code. If no tests exist yet, this step is skipped (until testing phase). |
| 4 | **Verify No Regressions** | Check that existing functionality still works. No breaking changes unless documented. |
| 5 | **Update Documentation** | Update all relevant documentation files (see below). |
| 6 | **Update PROJECT_STATUS.md** | Mark the feature/module status. Update completion percentage. |
| 7 | **Update FEATURES.md** | Update feature status and completion %. Move from Planned to Completed if fully done. |
| 8 | **Update ROADMAP.md** | Update phase progress. Mark deliverables as complete. |
| 9 | **Update BACKLOG.md** | Mark the task as completed. Reorder priorities if needed. Remove completed task or mark as done. |
| 10 | **Update NEXT_TASK.md** | Select the NEXT single task from BACKLOG.md. There must always be exactly one active task. |
| 11 | **Update CHANGELOG.md** | Record what was changed, added, or fixed. Use "Keep a Changelog" format. |
| 12 | **Update MASTER_SPEC.md** | Add new pages, APIs, models, business rules, or UI components. Keep it synchronized. |
| 13 | **Update KNOWN_ISSUES.md** | Add any new bugs or issues discovered during implementation. Remove if fixed. |
| 14 | **Suggest Git Commit Message** | Write a clear, concise commit message summarizing the change. |
| 15 | **Stop** | Do not start the next task. The next session will read NEXT_TASK.md and continue. |

---

## Session Shutdown Workflow

Before **ending** a session, verify these items are complete:

### Documentation Check
- [ ] PROJECT_STATUS.md reflects current codebase state
- [ ] FEATURES.md is synchronized with implemented features
- [ ] ROADMAP.md phase progress is updated
- [ ] BACKLOG.md is up to date (completed tasks marked, priorities reviewed)
- [ ] NEXT_TASK.md has exactly one active task selected
- [ ] CHANGELOG.md has an entry for this session's work
- [ ] MASTER_SPEC.md is synchronized (new APIs, pages, models documented)
- [ ] KNOWN_ISSUES.md reflects current known problems
- [ ] DECISIONS.md has any new architectural decisions recorded

### Quality Check
- [ ] Feature is fully implemented (not partial)
- [ ] No console errors or warnings
- [ ] Loading, empty, error, and edge case states handled
- [ ] Responsive design verified
- [ ] No regressions introduced
- [ ] No security vulnerabilities introduced

### Final Step
- [ ] Suggest a Git commit message with a clear summary of changes
- [ ] Stop — do not start new work

---

## Emergency Rules

### If You Discover a Critical Bug During Development
1. Stop current work
2. Assess severity (see KNOWN_ISSUES.md for severity definitions)
3. If CRITICAL (affects financial flows, data loss, or security):
   - Fix it immediately
   - Update KNOWN_ISSUES.md (mark as fixed)
   - Update CHANGELOG.md
   - Resume previous task
4. If not critical:
   - Add to KNOWN_ISSUES.md
   - Continue current task
   - Do not let bugs accumulate — they must be addressed before production

### If You Find Conflicting or Outdated Documentation
1. Do not ignore it — update it immediately
2. Check the codebase to determine the truth
3. Fix the documentation to match the code
4. Record the fix in CHANGELOG.md

### If a Task Exceeds Estimated Complexity
1. Complete the task — never leave partially completed work
2. After completion, update the complexity estimate in BACKLOG.md to reflect reality
3. Proceed to the next task normally

---

## Prohibited Actions

| Action | Why |
|--------|-----|
| Working on multiple features at once | Causes context switching, incomplete features, and merge conflicts |
| Leaving partially implemented code | Breaks functionality for other features and creates technical debt |
| Duplicating existing components | Violates DRY principle, increases maintenance burden |
| Redesigning working systems | Wastes time and introduces regressions without business value |
| Breaking backward compatibility | Breaks existing integrations and user workflows |
| Implementing features from IDEAS.md | IDEAS.md is brainstorming only — features must be promoted to BACKLOG.md first |
| Marking features complete without verification | Leads to untested, broken functionality in production |
| Modifying source code without reading project-management docs | Results in inconsistent code and violated conventions |
| Skipping documentation updates | Creates knowledge gaps for future sessions and developers |
| Committing secrets or API keys | Security risk — use environment variables only |

---

## Documentation File Ownership

| File | Owner | Update Frequency |
|------|-------|-----------------|
| `MASTER_SPEC.md` | Every session | Every feature completion |
| `PROJECT_STATUS.md` | Every session | Every feature completion |
| `FEATURES.md` | Every session | Every feature completion |
| `ROADMAP.md` | Every session | Every phase milestone |
| `BACKLOG.md` | Every session | Every task completion + priority review |
| `NEXT_TASK.md` | Every session | Every task completion |
| `CHANGELOG.md` | Every session | Every change |
| `KNOWN_ISSUES.md` | Every session | Every bug found or fixed |
| `DECISIONS.md` | Every session | Every architectural decision |
| `AI_CONTEXT.md` | As needed | When tech stack or conventions change |
| `ARCHITECTURE.md` | As needed | When architecture changes |
| `VISION.md` | Quarterly | When strategy evolves |
| `IDEAS.md` | As needed | When new ideas emerge |
| `AI_WORKFLOW.md` | As needed | THIS FILE — update when workflow changes |
| `PROJECT_INDEX.md` | As needed | When files are added or removed |

---

> **This workflow is mandatory.** Every AI session must follow this exactly.
> It ensures consistency, quality, and synchronization across all development work.
> The `project-management/` folder is the permanent knowledge base — protect it and keep it accurate.
