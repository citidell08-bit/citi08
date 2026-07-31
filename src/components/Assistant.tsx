import { useEffect, useRef, useState, type FormEvent } from 'react'
import { QUICK_PROMPTS, type ChatMessage } from '../lib/assistant'
import {
  askLiveAssistant,
  loadLlmPrefs,
  saveLlmPrefs,
  type LlmPrefs,
  type LlmProvider,
} from '../lib/llm'
import { ensurePuter } from '../lib/puterAi'
import { unlockAudio } from '../lib/sfx'
import { uid } from '../lib/dates'
import type { GameState, Tab } from '../types'
import './Assistant.css'

interface Props {
  state: GameState
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tab: Tab) => void
  hidden?: boolean
}

export function Assistant({ state, open, onOpenChange, onNavigate, hidden = false }: Props) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [prefs, setPrefs] = useState<LlmPrefs>(() => loadLlmPrefs())
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hey — I'm ${state.companionName}. Ask me anything and I'll get a real ChatGPT (GPT-4o) answer, then bring it back to you — homework, study tips, or how Cyber Kith works.`,
      source: 'ChatGPT (GPT-4o)',
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef(state.companionName)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (nameRef.current === state.companionName) return
    nameRef.current = state.companionName
    setMessages((m) =>
      m.map((msg) =>
        msg.id === 'welcome'
          ? {
              ...msg,
              text: `Hey — I'm ${state.companionName}. Ask me anything and I'll get the answer from ChatGPT, then bring it back to you.`,
            }
          : msg,
      ),
    )
  }, [state.companionName])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
    // Warm ChatGPT (GPT-4o) so the first ask is faster
    void ensurePuter().catch(() => {
      /* optional preload */
    })
    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open, busy])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function ask(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    unlockAudio()

    const userMsg: ChatMessage = { id: uid('ask'), role: 'user', text: trimmed }
    const ansId = uid('ans')
    const placeholder: ChatMessage = {
      id: ansId,
      role: 'assistant',
      text: '',
      status: 'Asking ChatGPT (GPT-4o)…',
    }

    setMessages((m) => [...m, userMsg, placeholder].slice(-40))
    setInput('')
    setBusy(true)

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.text }))
      .filter((m) => m.content.trim().length > 0)

    try {
      const reply = await askLiveAssistant(
        trimmed,
        state,
        history,
        (chunk) => {
          setMessages((m) =>
            m.map((msg) =>
              msg.id === ansId
                ? { ...msg, text: `${msg.text}${chunk}`, status: undefined }
                : msg,
            ),
          )
        },
        ac.signal,
        (status) => {
          setMessages((m) =>
            m.map((msg) => (msg.id === ansId ? { ...msg, status } : msg)),
          )
        },
        () => {
          setMessages((m) =>
            m.map((msg) => (msg.id === ansId ? { ...msg, text: '' } : msg)),
          )
        },
      )

      setMessages((m) =>
        m.map((msg) =>
          msg.id === ansId
            ? {
                ...msg,
                text: reply.text || msg.text,
                goTo: reply.goTo,
                goLabel: reply.goLabel,
                source: reply.source,
                status: undefined,
              }
            : msg,
        ),
      )
    } catch {
      if (!ac.signal.aborted) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === ansId
              ? {
                  ...msg,
                  status: undefined,
                  text:
                    msg.text ||
                    "Couldn't reach ChatGPT right now. Check your connection and try again.",
                }
              : msg,
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(input)
  }

  function savePrefs() {
    saveLlmPrefs(prefs)
    setShowSettings(false)
  }

  if (hidden && !open) return null

  return (
    <>
      {!open && !hidden && (
        <button
          type="button"
          className="assistant-fab"
          onClick={() => {
            unlockAudio()
            onOpenChange(true)
          }}
          aria-label={`Ask ${state.companionName} — answers from ChatGPT`}
        >
          <span className="assistant-fab-icon" aria-hidden="true">
            ✦
          </span>
          <span className="assistant-fab-label">Ask ChatGPT</span>
        </button>
      )}

      {open && (
        <div className="assistant-backdrop" role="presentation" onClick={() => onOpenChange(false)}>
          <section
            className="panel assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${state.companionName} ChatGPT assistant`}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="assistant-head">
              <div>
                <h2 className="assistant-title">Ask ChatGPT</h2>
                <p className="assistant-sub">
                  Real GPT-4o answers — {state.companionName} asks ChatGPT, then shows you the reply
                </p>
              </div>
              <div className="assistant-head-actions">
                <button
                  type="button"
                  className="btn btn-ghost assistant-close"
                  onClick={() => setShowSettings((v) => !v)}
                >
                  {showSettings ? 'Chat' : 'AI setup'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost assistant-close"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </button>
              </div>
            </header>

            {showSettings ? (
              <div className="assistant-settings">
                <p className="section-sub">
                  Default uses real <strong>ChatGPT GPT-4o</strong> (via Puter — you may be asked to
                  sign in once). Optional OpenAI/Groq keys are backups; keys stay on this device only.
                </p>
                <label className="quest-field">
                  <span>Provider</span>
                  <select
                    className="field"
                    value={prefs.provider}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, provider: e.target.value as LlmProvider }))
                    }
                  >
                    <option value="chatgpt">ChatGPT GPT-4o (recommended)</option>
                    <option value="openai">Official OpenAI key (GPT-4o)</option>
                    <option value="groq">Groq key</option>
                    <option value="auto">Auto (try everything)</option>
                  </select>
                </label>
                <label className="quest-field">
                  <span>OpenAI API key</span>
                  <input
                    className="field"
                    type="password"
                    autoComplete="off"
                    placeholder="sk-… (optional, for official ChatGPT)"
                    value={prefs.openaiKey}
                    onChange={(e) => setPrefs((p) => ({ ...p, openaiKey: e.target.value }))}
                  />
                </label>
                <label className="quest-field">
                  <span>Groq API key</span>
                  <input
                    className="field"
                    type="password"
                    autoComplete="off"
                    placeholder="gsk_… (optional)"
                    value={prefs.groqKey}
                    onChange={(e) => setPrefs((p) => ({ ...p, groqKey: e.target.value }))}
                  />
                </label>
                <button type="button" className="btn btn-ember" onClick={savePrefs}>
                  Save AI settings
                </button>
              </div>
            ) : (
              <>
                <div className="assistant-chips" aria-label="Quick questions">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="assistant-chip"
                      disabled={busy}
                      onClick={() => void ask(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="assistant-thread" ref={listRef} aria-live="polite">
                  {messages.map((m) => (
                    <div key={m.id} className={`assistant-bubble ${m.role}`}>
                      {m.role === 'assistant' && (m.status || m.source) && (
                        <span className="assistant-source">
                          {m.status ?? `Answer from ${m.source}`}
                        </span>
                      )}
                      <p className="assistant-text">
                        {m.text ||
                          (busy && m.role === 'assistant'
                            ? m.status || 'Asking ChatGPT…'
                            : '')}
                      </p>
                      {m.role === 'assistant' && m.goTo && !m.status && (
                        <button
                          type="button"
                          className="btn btn-ember assistant-go"
                          onClick={() => {
                            onNavigate(m.goTo!)
                            onOpenChange(false)
                          }}
                        >
                          {m.goLabel ?? 'Go'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form className="assistant-compose" onSubmit={onSubmit}>
                  <input
                    ref={inputRef}
                    className="field"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask ChatGPT anything…"
                    aria-label="Ask ChatGPT"
                    maxLength={500}
                    disabled={busy}
                  />
                  <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
                    {busy ? '…' : 'Ask'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
