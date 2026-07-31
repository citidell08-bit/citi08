import { GAME_COSTS } from './coins'
import { levelFromXp, progressToNextLevel } from './xp'
import { replyAsAssistant, type AssistantReply } from './assistant'
import type { GameState, Tab } from '../types'

const PREF_KEY = 'kith.assistant.llm.v1'

export type LlmProvider = 'auto' | 'openai' | 'groq' | 'free'

export interface LlmPrefs {
  provider: LlmProvider
  openaiKey: string
  groqKey: string
}

const DEFAULT_PREFS: LlmPrefs = {
  provider: 'auto',
  openaiKey: '',
  groqKey: '',
}

export function loadLlmPrefs(): LlmPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<LlmPrefs>
    return {
      provider: parsed.provider ?? 'auto',
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
    label: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
  }
  const groq: Endpoint = {
    label: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
  }
  const free: Endpoint = {
    label: 'Cyber cloud',
    url: 'https://text.pollinations.ai/openai',
    model: 'openai',
    headers: { 'Content-Type': 'application/json' },
  }

  if (prefs.provider === 'openai' && openaiKey) return [openai, free]
  if (prefs.provider === 'groq' && groqKey) return [groq, free]
  if (prefs.provider === 'free') return [free]

  // auto
  if (openaiKey) chain.push(openai)
  if (groqKey) chain.push(groq)
  chain.push(free)
  return chain
}

function buildSystemPrompt(state: GameState): string {
  const level = levelFromXp(state.xp)
  const { current, needed } = progressToNextLevel(state.xp)
  const daily = state.quests
    .filter((q) => q.period === 'daily')
    .map((q) => `${q.custom ? '[Yours] ' : ''}${q.title}: ${q.progress}/${q.target}${q.completed ? ' ✓' : ''}`)
    .join('; ')
  const owned = state.ownedGames.join(', ') || 'none'

  return `You are ${state.companionName}, the Cyber Kith — a warm, sharp, ChatGPT-level AI study companion inside a gamified study app.

Personality: helpful, concise but complete, encouraging, a little playful neon cyber vibe. Never say you are "just a script" or "offline rules". You are a real assistant.

App facts (always respect these):
- Tabs: Home, Focus (timer), Cards (flashcards), Play (arcade), Quests, Themes store.
- New players start at 0 coins and 0 XP — grind focus/cards/quests.
- Coins: quests, +25 per level-up, +10 per achievement, arcade bonuses/pickups.
- Arcade unlocks after first progress; games cost once (${GAME_COSTS.math}–${GAME_COSTS.dash} ◉) then free forever: Spike Dash, Memory Nest, Quick Sum (+3s per correct), Glow Catch (clear level → 5s pause → harder; miss resets to Lv1).
- Quests: daily board refreshes when fully cleared AND at midnight; weekly Mon; monthly 1st. Players can Add custom quests (max 8).
- Day streak: play/study today = 1; return tomorrow = 2; miss a day = reset.
- Home has Reset progress to wipe everything.
- Music toggle mutes BGM.

Player snapshot:
- Companion: ${state.companionName}
- Level ${level} (${current}/${needed} XP to next), total XP ${state.xp}
- Coins: ${state.coins} (lifetime earned ${state.totalCoinsEarned})
- Streak: ${state.streak} (best ${state.longestStreak})
- Focus minutes: ${state.totalFocusMinutes}, sessions: ${state.totalSessions}
- Cards reviewed: ${state.totalCardsReviewed}
- Games played: ${state.totalGamesPlayed}, owned: ${owned}
- Daily quests: ${daily || 'none'}

How to answer:
- Be ChatGPT-quality: clear structure, concrete steps, study tactics when asked, app guidance when asked.
- Use short paragraphs or tight bullets — not walls of text.
- If recommending an in-app destination, end your message with exactly one tag on its own line:
  [[go:focus|Open Focus]] or cards|play|quests|store|home with a short button label.
- Only use [[go:...]] when navigation helps. Valid tabs: home, focus, cards, play, quests, store.`
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
      max_tokens: 700,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`${endpoint.label} ${res.status}: ${errText.slice(0, 160)}`)
  }

  // Non-stream JSON fallback (some providers ignore stream:true)
  const ctype = res.headers.get('content-type') ?? ''
  if (ctype.includes('application/json') && !ctype.includes('event-stream')) {
    // Peek: if body starts with "data:" it's still SSE mislabeled
    const clone = res.clone()
    const peek = await clone.text()
    if (!peek.trimStart().startsWith('data:')) {
      const data = JSON.parse(peek) as {
        choices?: { message?: { content?: string } }[]
      }
      const text = data.choices?.[0]?.message?.content ?? ''
      if (text) onDelta(text)
      return text
    }
    // Fall through and parse peek as SSE below via synthetic stream
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

/** ChatGPT-style live reply with streaming; falls back to local helper if all endpoints fail. */
export async function askLiveAssistant(
  question: string,
  state: GameState,
  history: ChatTurn[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<LiveReply> {
  const prefs = loadLlmPrefs()
  const system = buildSystemPrompt(state)
  const turns = history.slice(-12)
  const endpoints = resolveEndpoint(prefs)
  let lastError = ''

  for (const endpoint of endpoints) {
    try {
      const raw = await streamChat(endpoint, system, turns, onDelta, signal)
      if (!raw.trim()) throw new Error('empty reply')
      const parsed = parseGoTag(raw)
      return {
        text: parsed.clean,
        goTo: parsed.goTo,
        goLabel: parsed.goLabel,
        source: endpoint.label,
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  // Local fallback so the assistant never fully dies offline
  const local = replyAsAssistant(question, state)
  onDelta(
    `${local.text}\n\n_(Live AI unreachable${lastError ? ` — ${lastError.slice(0, 80)}` : ''}. Using onboard help.)_`,
  )
  return {
    ...local,
    text: `${local.text}\n\n_(Live AI unreachable. Using onboard help.)_`,
    source: 'onboard',
  }
}
