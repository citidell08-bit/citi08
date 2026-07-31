/** Puter.js — free browser access to real OpenAI ChatGPT models (user-pays). */

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
        () => reject(new Error('Could not load ChatGPT (Puter.js)')),
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

/** Ask real ChatGPT-class models (GPT-4o) through Puter. */
export async function askPuterChatGpt(
  messages: PuterChatMessage[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new Error('aborted')

  const puter = await ensurePuter()
  const models = ['gpt-4o', 'openai/gpt-4o', 'gpt-4o-mini', 'gpt-5.4-mini']

  let lastError: unknown

  for (const model of models) {
    if (signal?.aborted) throw new Error('aborted')
    try {
      // Prefer streaming for ChatGPT feel
      try {
        const streamed = await puter.ai.chat(messages, {
          model,
          stream: true,
          temperature: 0.7,
          max_tokens: 900,
        })

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
        } else {
          const text = extractText(streamed)
          if (text) {
            onDelta(text)
            return text
          }
        }
      } catch {
        /* fall through to non-stream */
      }

      const result = await puter.ai.chat(messages, {
        model,
        stream: false,
        temperature: 0.7,
        max_tokens: 900,
      })
      const text = extractText(result)
      if (!text) throw new Error(`Empty GPT reply (${model})`)
      onDelta(text)
      return text
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'Puter ChatGPT failed'))
}
