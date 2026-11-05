# agent-badges

A Claude Code mod that shows each subagent's model and effort. It tags the
agent list rows with `[model · effort]`, adds a band above the prompt listing
running subagents with their resolved model and effort, and adds a
`↳ model · effort` line under each Agent tool-call row.

Model and effort come from the Agent call when it sets them, else from the
agent's own definition file (`.claude/agents/<type>.md` in the project, then
`~/.claude/agents/<type>.md`), else the parent's model and `default`.

## Install

At the prompt of a terminal session:

```
/plugin install agent-badges --marketplace rujealfon/claude-agent-badges
```

From a shell:

```
claude plugin install agent-badges --marketplace rujealfon/claude-agent-badges
```
