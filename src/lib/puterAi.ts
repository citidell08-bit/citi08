/** Puter.js — live companion brain (loaded once, reused for speed). */

const PUTER_SRC = 'https://js.puter.com/v2/'

export type PuterChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

type PuterStreamPart = { text?: string; reasoning?: string }

type PuterAi = {
  chat: (
    input: string | PuterChatMessage[],
    options?: {
      model?: string
      stream?: boolean
      temperature?: number
      max_tokens?: number
    },
  ) => Promise<string | AsyncIterable<PuterStreamPart> | { message?: { content?: string } }>
}

type PuterGlobal = { ai: PuterAi }

declare global {
  interface Window {
    puter?: PuterGlobal
  }
}

let loading: Promise<PuterGlobal> | null = null
let warmed = false

export function ensurePuter(): Promise<PuterGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Puter needs a browser'))
  }
  if (window.puter?.ai?.chat) return Promise.resolve(window.puter)

  if (!loading) {
    loading = new Promise<PuterGlobal>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-puter="v2"]')
      if (existing && window.puter?.ai?.chat) {
        resolve(window.puter)
        return
      }

      const script = existing ?? document.createElement('script')
      script.src = PUTER_SRC
      script.async = true
      script.dataset.puter = 'v2'

      const onReady = () => {
        if (window.puter?.ai?.chat) resolve(window.puter)
        else reject(new Error('Puter loaded but AI chat is unavailable'))
      }

      script.addEventListener('load', onReady, { once: true })
      script.addEventListener(
        'error',
        () => reject(new Error('Could not load companion brain')),
        { once: true },
      )

      if (!existing) document.head.appendChild(script)
      else if (window.puter?.ai?.chat) onReady()
    }).catch((err) => {
      loading = null
      throw err
    })
  }

  return loading
}

/** Kick off script load ASAP (call from App mount). */
export function preloadPuter(): void {
  void ensurePuter()
    .then(() => warmPuter())
    .catch(() => {
      /* ignore — ask path will retry */
    })
}

/** Tiny ping so the first real question isn't cold. */
export function warmPuter(): void {
  if (warmed) return
  warmed = true
  void ensurePuter()
    .then((puter) =>
      puter.ai.chat([{ role: 'user', content: 'hi' }], {
        model: 'gpt-4o-mini',
        stream: false,
        max_tokens: 1,
        temperature: 0,
      }),
    )
    .catch(() => {
      warmed = false
    })
}

function extractText(result: unknown): string {
  if (typeof result === 'string') return result.trim()
  if (result && typeof result === 'object') {
    const obj = result as {
      message?: { content?: string }
      text?: string
      content?: string
    }
    const text = obj.message?.content ?? obj.text ?? obj.content
    if (typeof text === 'string') return text.trim()
  }
  return ''
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    promise.then(
      (v) => {
        window.clearTimeout(id)
        resolve(v)
      },
      (err) => {
        window.clearTimeout(id)
        reject(err)
      },
    )
  })
}

async function streamOneModel(
  puter: PuterGlobal,
  messages: PuterChatMessage[],
  model: string,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
  timeoutMs = 8_000,
): Promise<string> {
  if (signal?.aborted) throw new Error('aborted')

  const streamed = await withTimeout(
    puter.ai.chat(messages, {
      model,
      stream: true,
      temperature: 0.55,
      max_tokens: 900,
    }),
    timeoutMs,
    model,
  )

  if (streamed && typeof streamed === 'object' && Symbol.asyncIterator in Object(streamed)) {
    let full = ''
    for await (const part of streamed as AsyncIterable<PuterStreamPart>) {
      if (signal?.aborted) throw new Error('aborted')
      const chunk = part?.text
      if (chunk) {
        full += chunk
        onDelta(chunk)
      }
    }
    if (full.trim()) return full.trim()
    throw new Error(`Empty stream (${model})`)
  }

  const text = extractText(streamed)
  if (text) {
    onDelta(text)
    return text
  }
  throw new Error(`Empty reply (${model})`)
}

/**
 * Race a strong model + a fast model; first stream that produces text wins.
 * Feels instant without sacrificing answer quality when gpt-4o is warm.
 */
export async function askPuterChatGpt(
  messages: PuterChatMessage[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new Error('aborted')

  const puter = await ensurePuter()
  // Quality first + speed backup, raced in parallel
  const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-5.4-nano']

  let claimedBy: string | null = null
  let lastError: unknown

  const run = (model: string) =>
    streamOneModel(
      puter,
      messages,
      model,
      (chunk) => {
        if (signal?.aborted) return
        if (claimedBy == null) claimedBy = model
        if (claimedBy === model) onDelta(chunk)
      },
      signal,
      model === 'gpt-4o' ? 9_000 : 6_000,
    ).then((full) => {
      if (claimedBy == null) claimedBy = model
      if (claimedBy !== model) throw new Error(`lost race (${model})`)
      return full
    })

  try {
    return await Promise.any(models.map((m) => run(m)))
  } catch (agg) {
    lastError = agg
  }

  // Non-stream hail-mary on the quality model
  try {
    const result = await withTimeout(
      puter.ai.chat(messages, {
        model: 'gpt-4o',
        stream: false,
        temperature: 0.55,
        max_tokens: 900,
      }),
      12_000,
      'gpt-4o',
    )
    const text = extractText(result)
    if (!text) throw new Error('Empty GPT reply')
    onDelta(text)
    return text
  } catch (err) {
    lastError = err
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'Companion brain failed'))
}
