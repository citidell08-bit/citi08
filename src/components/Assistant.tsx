import { useEffect, useRef, useState, type FormEvent } from 'react'
import { QUICK_PROMPTS, replyAsAssistant, type ChatMessage } from '../lib/assistant'
import { unlockAudio } from '../lib/sfx'
import { uid } from '../lib/dates'
import type { GameState, Tab } from '../types'
import './Assistant.css'

interface Props {
  state: GameState
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tab: Tab) => void
  /** Hide the floating chip while a full-screen mini-game is active. */
  hidden?: boolean
}

export function Assistant({ state, open, onOpenChange, onNavigate, hidden = false }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hey — I'm ${state.companionName}. Ask me anything about Cyber Kith, or tap a quick tip. I work offline.`,
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef(state.companionName)

  useEffect(() => {
    if (nameRef.current === state.companionName) return
    nameRef.current = state.companionName
    setMessages((m) =>
      m.map((msg) =>
        msg.id === 'welcome'
          ? {
              ...msg,
              text: `Hey — I'm ${state.companionName}. Ask me anything about Cyber Kith, or tap a quick tip. I work offline.`,
            }
          : msg,
      ),
    )
  }, [state.companionName])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  function ask(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    unlockAudio()
    const userMsg: ChatMessage = { id: uid('ask'), role: 'user', text: trimmed }
    const reply = replyAsAssistant(trimmed, state)
    const botMsg: ChatMessage = {
      id: uid('ans'),
      role: 'assistant',
      text: reply.text,
      goTo: reply.goTo,
      goLabel: reply.goLabel,
    }
    setMessages((m) => [...m, userMsg, botMsg].slice(-40))
    setInput('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    ask(input)
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
          aria-label={`Ask ${state.companionName} for help`}
        >
          <span className="assistant-fab-icon" aria-hidden="true">
            ✦
          </span>
          <span className="assistant-fab-label">Ask {state.companionName}</span>
        </button>
      )}

      {open && (
        <div className="assistant-backdrop" role="presentation" onClick={() => onOpenChange(false)}>
          <section
            className="panel assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`${state.companionName} assistant`}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="assistant-head">
              <div>
                <h2 className="assistant-title">Ask {state.companionName}</h2>
                <p className="assistant-sub">Offline study buddy · tips & how-to</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost assistant-close"
                onClick={() => onOpenChange(false)}
              >
                Close
              </button>
            </header>

            <div className="assistant-chips" aria-label="Quick questions">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="assistant-chip"
                  onClick={() => ask(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="assistant-thread" ref={listRef} aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`assistant-bubble ${m.role}`}>
                  <p>{m.text}</p>
                  {m.role === 'assistant' && m.goTo && (
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
                placeholder="Ask about coins, quests, games…"
                aria-label="Message to assistant"
                maxLength={200}
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
                Send
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
