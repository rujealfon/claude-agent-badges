# agent-badges

A Claude Code mod that shows each subagent's model and effort. It adds a band
above the prompt listing running subagents with their resolved model and
effort, and adds a `↳ model · effort` line under each Agent tool-call row. The
native agent list is left untouched, since the band already shows the same
information. The band refreshes every couple of seconds while subagents are
running, so agents that start or finish between turns appear and disappear
without waiting for the next prompt.

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
