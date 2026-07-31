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
    model: 'gpt-4o',
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
  const daily = state.quests
    .filter((q) => q.period === 'daily')
    .map(
      (q) =>
        `${q.custom ? '[Yours] ' : ''}${q.title}: ${q.progress}/${q.target}${q.completed ? ' ✓' : ''}`,
    )
    .join('; ')
  const owned = state.ownedGames.join(', ') || 'none'

  return `You are ${state.companionName}, the Cyber Kith — a brilliant study companion who simply knows things. Never discuss providers, APIs, models, looking things up, or other AI products. Speak as if every answer is your own knowledge.

Answer accurately, clearly, and helpfully — like a genius friend who already knows. Tie it back to studying or Cyber Kith when relevant.

Personality: warm, sharp, encouraging, lightly cyber. Confident. Never say you are a script or empty bot.

App facts:
- Tabs: Home, Focus, Cards, Play, Quests, Themes.
- Start at 0 coins/XP; grind focus, cards, quests.
- Coins from quests, +25/level, +10/achievement, arcade pickups.
- Games cost once (${GAME_COSTS.math}–${GAME_COSTS.dash} ◉): Spike Dash, Memory Nest, Quick Sum, Glow Catch.
- Daily quests refresh when cleared + at midnight; custom quests exist (max 8).
- Day streak grows if you return tomorrow; resets if you skip a day.
- Home → Reset progress wipes the save.

Player now:
- ${state.companionName}, Lv ${level} (${current}/${needed} XP), ${state.xp} XP total
- ${state.coins} ◉, streak ${state.streak} (best ${state.longestStreak})
- Focus ${state.totalFocusMinutes}m / ${state.totalSessions} sessions, ${state.totalCardsReviewed} cards, games owned: ${owned}
- Daily quests: ${daily || 'none'}

Format:
- Lead with the answer. Short paragraphs or bullets.
- Optional single nav tag at the very end only: [[go:focus|Open Focus]] (tabs: home, focus, cards, play, quests, store).`
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
      temperature: 0.7,
      max_tokens: 900,
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
      temperature: 0.7,
      max_tokens: 900,
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
  const turns = history.slice(-12)
  const messages = [{ role: 'system' as const, content: system }, ...turns]
  const name = state.companionName
  let lastError = ''

  // 1) Primary live model — presented as Ember knowing the answer
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

  // 2) User API keys + free cloud proxies
  const endpoints = resolveEndpoint(prefs)
  for (const endpoint of endpoints) {
    onClear?.()
    onStatus?.(`${name} is thinking…`)
    try {
      try {
        const full = await completeChat(endpoint, system, turns, signal)
        onClear?.()
        onDelta(full)
        const parsed = parseGoTag(full)
        onStatus?.(null)
        return {
          text: parsed.clean,
          goTo: parsed.goTo,
          goLabel: parsed.goLabel,
          source: name,
        }
      } catch (completeErr) {
        onClear?.()
        onStatus?.(`${name} is thinking…`)
        const raw = await streamChat(endpoint, system, turns, onDelta, signal)
        if (!raw.trim()) throw completeErr
        const parsed = parseGoTag(raw)
        onStatus?.(null)
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
