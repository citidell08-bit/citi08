import { GAME_COSTS } from './coins'
import { levelFromXp, progressToNextLevel } from './xp'
import { replyAsAssistant, type AssistantReply } from './assistant'
import { askPuterChatGpt } from './puterAi'
import type { GameState, Tab } from '../types'

const PREF_KEY = 'kith.assistant.llm.v1'

export type LlmProvider = 'auto' | 'openai' | 'groq' | 'chatgpt'

export interface LlmPrefs {
  provider: LlmProvider
  openaiKey: string
  groqKey: string
}

const DEFAULT_PREFS: LlmPrefs = {
  provider: 'chatgpt',
  openaiKey: '',
  groqKey: '',
}

export function loadLlmPrefs(): LlmPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const rawProvider = String(parsed.provider ?? 'chatgpt')
    const provider: LlmProvider =
      rawProvider === 'free' || rawProvider === 'chatgpt'
        ? 'chatgpt'
        : rawProvider === 'openai' || rawProvider === 'groq' || rawProvider === 'auto'
          ? rawProvider
          : 'chatgpt'
    return {
      provider,
      openaiKey: typeof parsed.openaiKey === 'string' ? parsed.openaiKey : '',
      groqKey: typeof parsed.groqKey === 'string' ? parsed.groqKey : '',
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveLlmPrefs(prefs: LlmPrefs): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
}

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface Endpoint {
  label: string
  url: string
  model: string
  headers: Record<string, string>
}

function resolveEndpoint(prefs: LlmPrefs): Endpoint[] {
  const chain: Endpoint[] = []
  const openaiKey = prefs.openaiKey.trim()
  const groqKey = prefs.groqKey.trim()

  const openai: Endpoint = {
    label: 'Ember cloud',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
  }
  const groq: Endpoint = {
    label: 'Ember cloud',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
  }
  /** Free cloud fallback — no key required. */
  const chatgptCloud: Endpoint = {
    label: 'Ember cloud',
    url: 'https://text.pollinations.ai/openai',
    model: 'openai',
    headers: { 'Content-Type': 'application/json' },
  }

  if (prefs.provider === 'openai' && openaiKey) return [openai, chatgptCloud]
  if (prefs.provider === 'groq' && groqKey) return [groq, chatgptCloud]
  if (prefs.provider === 'chatgpt') return [chatgptCloud, ...(openaiKey ? [openai] : [])]

  if (openaiKey) chain.push(openai)
  if (groqKey) chain.push(groq)
  chain.push(chatgptCloud)
  return chain
}

function buildSystemPrompt(state: GameState): string {
  const level = levelFromXp(state.xp)
  const { current, needed } = progressToNextLevel(state.xp)
  const openDaily = state.quests
    .filter((q) => q.period === 'daily' && !q.completed)
    .slice(0, 3)
    .map((q) => `${q.title} ${q.progress}/${q.target}`)
    .join('; ')

  return `You are ${state.companionName}, Cyber Kith. You know everything — never mention APIs/models/looking things up. Be warm, sharp, brief (short paragraphs or bullets).

App: Home/Focus/Cards/Play/Quests/Themes. Start 0 coins. Coins from quests, +25/level, arcade. Games (${GAME_COSTS.math}–${GAME_COSTS.dash}◉ once): Dash, Memory, Sum, Glow. Daily quests refresh when cleared + midnight. Streak needs daily play.

Player: Lv ${level} (${current}/${needed} XP), ${state.coins}◉, streak ${state.streak}, focus ${state.totalFocusMinutes}m, cards ${state.totalCardsReviewed}. Open dailies: ${openDaily || 'none'}.
Optional end tag only if useful: [[go:focus|Open Focus]] (home|focus|cards|play|quests|store).`
}

const GO_RE = /\[\[go:(home|focus|cards|play|quests|store)\|([^\]]+)\]\]\s*$/i

export function parseGoTag(text: string): {
  clean: string
  goTo?: Tab
  goLabel?: string
} {
  const m = text.trim().match(GO_RE)
  if (!m) return { clean: text.trim() }
  return {
    clean: text.replace(GO_RE, '').trim(),
    goTo: m[1].toLowerCase() as Tab,
    goLabel: m[2].trim(),
  }
}

async function completeChat(
  endpoint: Endpoint,
  system: string,
  history: ChatTurn[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: endpoint.headers,
    signal,
    body: JSON.stringify({
      model: endpoint.model,
      stream: false,
      temperature: 0.45,
      max_tokens: 420,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`${endpoint.label} ${res.status}: ${raw.slice(0, 160)}`)
  }

  // Some proxies return plain text
  const trimmed = raw.trim()
  if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('data:')) {
    return trimmed
  }

  const data = JSON.parse(trimmed) as {
    choices?: { message?: { content?: string | null } }[]
    content?: string
    text?: string
  }
  const text =
    data.choices?.[0]?.message?.content?.trim() ||
    data.content?.trim() ||
    data.text?.trim() ||
    ''
  if (!text) throw new Error(`${endpoint.label}: empty reply`)
  return text
}

async function streamChat(
  endpoint: Endpoint,
  system: string,
  history: ChatTurn[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: endpoint.headers,
    signal,
    body: JSON.stringify({
      model: endpoint.model,
      stream: true,
      temperature: 0.45,
      max_tokens: 420,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`${endpoint.label} ${res.status}: ${errText.slice(0, 160)}`)
  }

  const ctype = res.headers.get('content-type') ?? ''
  if (ctype.includes('application/json') && !ctype.includes('event-stream')) {
    const peek = await res.text()
    if (!peek.trimStart().startsWith('data:')) {
      const data = JSON.parse(peek) as {
        choices?: { message?: { content?: string } }[]
      }
      const text = data.choices?.[0]?.message?.content ?? ''
      if (text) onDelta(text)
      return text
    }
    const encoder = new TextEncoder()
    const synthetic = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(peek))
        controller.close()
      },
    })
    return readSse(synthetic, onDelta)
  }

  if (!res.body) throw new Error(`${endpoint.label}: empty body`)
  return readSse(res.body, onDelta)
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''

    for (const line of parts) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        /* ignore partial SSE */
      }
    }
  }

  return full
}

export interface LiveReply extends AssistantReply {
  source: string
}

/**
 * Ask the live model for an answer, then return it as Ember's knowledge.
 * Never surface provider names to the player.
 */
export async function askLiveAssistant(
  question: string,
  state: GameState,
  history: ChatTurn[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
  onStatus?: (status: string | null) => void,
  onClear?: () => void,
): Promise<LiveReply> {
  const prefs = loadLlmPrefs()
  const system = buildSystemPrompt(state)
  const turns = history.slice(-6)
  const messages = [{ role: 'system' as const, content: system }, ...turns]
  const name = state.companionName
  let lastError = ''

  // 1) Primary live model — stream first for instant feel
  if (prefs.provider === 'chatgpt' || prefs.provider === 'auto') {
    onClear?.()
    onStatus?.(`${name} is thinking…`)
    try {
      const raw = await askPuterChatGpt(messages, onDelta, signal)
      const parsed = parseGoTag(raw)
      onStatus?.(null)
      return {
        text: parsed.clean,
        goTo: parsed.goTo,
        goLabel: parsed.goLabel,
        source: name,
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  // 2) Backup endpoints — stream first (faster first token)
  const endpoints = resolveEndpoint(prefs)
  for (const endpoint of endpoints) {
    onClear?.()
    onStatus?.(`${name} is thinking…`)
    try {
      try {
        const raw = await streamChat(endpoint, system, turns, onDelta, signal)
        if (!raw.trim()) throw new Error('empty stream')
        const parsed = parseGoTag(raw)
        onStatus?.(null)
        return {
          text: parsed.clean,
          goTo: parsed.goTo,
          goLabel: parsed.goLabel,
          source: name,
        }
      } catch (streamErr) {
        onClear?.()
        const full = await completeChat(endpoint, system, turns, signal)
        onDelta(full)
        const parsed = parseGoTag(full)
        onStatus?.(null)
        void streamErr
        return {
          text: parsed.clean,
          goTo: parsed.goTo,
          goLabel: parsed.goLabel,
          source: name,
        }
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  onClear?.()
  onStatus?.(null)
  const local = replyAsAssistant(question, state)
  void lastError
  onDelta(local.text)
  return { ...local, text: local.text, source: name }
}
