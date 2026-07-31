import { GAME_COSTS } from './coins'
import { levelFromXp, progressToNextLevel } from './xp'
import { matchLocalAssistant, replyAsAssistant, type AssistantReply } from './assistant'
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
  const openDaily = state.quests
    .filter((q) => q.period === 'daily' && !q.completed)
    .slice(0, 4)
    .map((q) => `${q.title} ${q.progress}/${q.target}`)
    .join('; ')
  const customOpen = state.quests
    .filter((q) => q.custom && !q.completed)
    .slice(0, 3)
    .map((q) => q.title)
    .join('; ')

  return `You are ${state.companionName}, the player's Cyber Kith companion.
You are brilliant, warm, and decisive — a world-class tutor who also knows Cyber Kith perfectly.
Never mention APIs, models, ChatGPT, OpenAI, Puter, or "looking things up." Speak as if the knowledge is yours.

## How to answer (quality bar)
- Lead with the direct answer in the first sentence.
- Then give clear steps, examples, or a tiny worked solution when useful.
- For homework / explanations: be accurate, structured, and easy to follow. Use short bullets or numbered steps.
- For quizzes: ask 1–3 sharp questions, wait for their reply (don't dump the answers unless they ask).
- For Cyber Kith help: be concrete with THIS player's numbers.
- Keep replies tight — usually 80–180 words unless they ask for depth. No filler, no apologies, no "as an AI".
- Match their energy. If they're stuck, unblock them. If they're curious, go deep cleanly.

## Cyber Kith facts
Tabs: Home, Focus, Cards, Play, Quests, Themes.
Players start at 0 coins / 0 XP. Coins from quests, +25 per level, arcade bonuses.
Games (buy once, ${GAME_COSTS.math}–${GAME_COSTS.dash}◉): Spike Dash, Memory Nest, Quick Sum, Glow Catch.
Daily quests refresh when the whole daily board is cleared, and at midnight. Weekly = Mondays, monthly = 1st.
Custom quests (up to 8) survive board refresh. Day streak needs study/play today; miss a day → reset.
Neon Void is the legendary space theme.

## This player
Lv ${level} (${current}/${needed} XP), ${state.coins}◉, streak ${state.streak} (best ${state.longestStreak}), focus ${state.totalFocusMinutes}m, cards reviewed ${state.totalCardsReviewed}, games owned ${state.ownedGames.length}/4.
Open dailies: ${openDaily || 'none'}.
Open custom quests: ${customOpen || 'none'}.

## Optional nav tag
If a button would help, end with exactly one tag:
[[go:focus|Open Focus]]
Allowed tabs: home|focus|cards|play|quests|store.`
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
      temperature: 0.55,
      max_tokens: 900,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    throw new Error(`${endpoint.label} ${res.status}: ${raw.slice(0, 160)}`)
  }

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
      temperature: 0.55,
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

/** Race several stream runners; first to finish with text wins. Deltas only from the winner. */
async function raceStreams(
  runners: Array<(relay: (chunk: string) => void, signal: AbortSignal) => Promise<string>>,
  onDelta: (chunk: string) => void,
  parentSignal?: AbortSignal,
): Promise<string> {
  if (runners.length === 0) throw new Error('No runners')
  const ac = new AbortController()
  const onAbort = () => ac.abort()
  parentSignal?.addEventListener('abort', onAbort)
  if (parentSignal?.aborted) ac.abort()

  let claimed: number | null = null

  try {
    return await Promise.any(
      runners.map((run, index) =>
        run((chunk) => {
          if (ac.signal.aborted && claimed !== index) return
          if (claimed == null) claimed = index
          if (claimed === index) onDelta(chunk)
        }, ac.signal).then((full) => {
          if (claimed == null) claimed = index
          if (claimed !== index) throw new Error('lost race')
          ac.abort()
          return full
        }),
      ),
    )
  } finally {
    parentSignal?.removeEventListener('abort', onAbort)
  }
}

export interface LiveReply extends AssistantReply {
  source: string
}

/**
 * Instant local answers for Cyber Kith, otherwise race live models for
 * high-quality streamed tutoring.
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
  const turns = history.slice(-8)
  const messages = [{ role: 'system' as const, content: system }, ...turns]
  const name = state.companionName
  let lastError = ''

  // Instant path — Cyber Kith intents answer with zero network wait
  const localHit = matchLocalAssistant(question, state)
  if (localHit) {
    onClear?.()
    onStatus?.(null)
    onDelta(localHit.text)
    return { ...localHit, source: name }
  }

  onClear?.()
  onStatus?.(`${name} is thinking…`)

  const runners: Array<(relay: (chunk: string) => void, signal: AbortSignal) => Promise<string>> =
    []

  if (prefs.provider === 'chatgpt' || prefs.provider === 'auto') {
    runners.push((relay, sig) => askPuterChatGpt(messages, relay, sig))
  }

  const endpoints = resolveEndpoint(prefs)
  for (const endpoint of endpoints) {
    runners.push(async (relay, sig) => {
      try {
        const raw = await streamChat(endpoint, system, turns, relay, sig)
        if (!raw.trim()) throw new Error('empty stream')
        return raw
      } catch {
        const full = await completeChat(endpoint, system, turns, sig)
        if (!full.trim()) throw new Error('empty complete')
        relay(full)
        return full
      }
    })
  }

  try {
    const raw = await raceStreams(runners, onDelta, signal)
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

  // Sequential safety net (if race failed oddly)
  if (prefs.provider === 'chatgpt' || prefs.provider === 'auto') {
    try {
      onClear?.()
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

  onClear?.()
  onStatus?.(null)
  const local = replyAsAssistant(question, state)
  void lastError
  onDelta(local.text)
  return { ...local, text: local.text, source: name }
}
