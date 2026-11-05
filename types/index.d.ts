export type Badge = { type: string; model: string; effort: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-badges': {
      byAgent: Record<string, Badge>
      byCall: Record<string, Badge>
      tick: number
    }
  }
}
