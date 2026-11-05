import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Badge } from '../types'

const byAgent = atom({ plugin: 'agent-badges', key: 'byAgent' } as const, {} as Record<string, Badge>)
const byCall = atom({ plugin: 'agent-badges', key: 'byCall' } as const, {} as Record<string, Badge>)
const tick = atom({ plugin: 'agent-badges', key: 'tick' } as const, 0)

const short = (model: string): string => model.replace(/^claude-/, '')

const label = (b: { model: string; effort: string }): string =>
  `${short(b.model)} · ${b.effort}`

// model/effort from an agent file's frontmatter, project first, then user.
const agentDefaults = async (
  $: {
    fs: { read: (p: string) => Promise<string | { text?: string }> }
    env: { get: (name: string) => Promise<string | undefined> }
  },
  type: string,
): Promise<{ model?: string; effort?: string }> => {
  if (!/^[\w.-]+$/.test(type)) return {}

  const home = await $.env.get('HOME')

  for (const path of [
    `.claude/agents/${type}.md`,
    ...(home ? [`${home}/.claude/agents/${type}.md`] : []),
  ]) {
    try {
      const r = await $.fs.read(path)
      const text = typeof r === 'string' ? r : (r.text ?? '')
      const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? ''

      return {
        model: /^model:\s*(\S+)/m.exec(front)?.[1],
        effort: /^effort:\s*(\S+)/m.exec(front)?.[1],
      }
    } catch {
      // not there, try the next
    }
  }

  return {}
}

export const register: Register = on => {
  // Effort only exists on the Agent call's input, so keep it until the spawn.
  const efforts = new Map<string, string>()

  on('tool.call', { tool: 'Agent' }, ($, e, next) => {
    if (e.effort) efforts.set(e.tool_use_id, e.effort)

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    // The band already shows model and effort, so leave the description alone.
    const def = await agentDefaults($, e.subagentType)
    const effort = efforts.get(e.tool_use_id) ?? def.effort ?? 'default'
    const tagged = e.description
    const r = await next(e)

    if (r.deny === undefined) {
      const badge: Badge = { type: e.subagentType, model: r.model, effort }
      efforts.delete(e.tool_use_id)
      const key = r.agentId ?? `desc:${tagged}`
      await update($, byCall, m => ({ ...m, [e.tool_use_id]: badge }))
      await update($, byAgent, m => ({
        ...m,
        [key]: badge,
        [`desc:${tagged}`]: badge,
      }))
    }

    return r
  })

  // A finished agent leaves the band: bump a value the band reads.
  on('turn.complete', async ($, e, next) => {
    await update($, tick, n => n + 1)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    await read($, tick)
    const badges = await read($, byAgent)
    const live = (await $.agent.list()).filter(
      a => a.status === 'running' || a.status === 'pending',
    )

    if (e.props.hasSurvey || live.length === 0) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {live.map(a => {
          const b = badges[a.id] ?? badges[`desc:${a.description}`]

          return (
            <Text key={a.id} dimColor>
              {a.type}
              {b ? ` · ${label(b)}` : ''} — {a.description.replace(/^\[[^\]]*\] /, '')}
            </Text>
          )
        })}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== 'Agent') {
      return next(e)
    }

    const calls = await read($, byCall)
    const input = (e.props.input ?? {}) as { model?: string; effort?: string }
    const done = calls[e.props.tool_use_id]
    const text = done
      ? label(done)
      : `${input.model ?? 'inherit'} · ${input.effort ?? 'default'}`
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {await next(e)}
        <Text dimColor>  ↳ {text}</Text>
      </Box>
    )
  })
}
