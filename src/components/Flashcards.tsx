import { useEffect, useMemo, useRef, useState } from 'react'
import type { Deck } from '../types'
import './Flashcards.css'

interface Props {
  decks: Deck[]
  onReview: (knewIt: boolean) => void
  onCreateDeck: (name: string, cards: { front: string; back: string }[]) => void
}

export function Flashcards({ decks, onReview, onCreateDeck }: Props) {
  const [deckId, setDeckId] = useState(decks[0]?.id ?? '')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState<'study' | 'create'>('study')
  const [name, setName] = useState('')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [draftCards, setDraftCards] = useState<{ front: string; back: string }[]>([])
  const prevDeckCount = useRef(decks.length)

  const deck = useMemo(
    () => decks.find((d) => d.id === deckId) ?? decks[0],
    [decks, deckId],
  )
  const card = deck?.cards[index]

  useEffect(() => {
    if (decks.length > prevDeckCount.current && decks[0]) {
      setDeckId(decks[0].id)
      setIndex(0)
      setFlipped(false)
    }
    prevDeckCount.current = decks.length
  }, [decks])

  useEffect(() => {
    if (!deck && decks[0]) {
      setDeckId(decks[0].id)
      setIndex(0)
      setFlipped(false)
    }
  }, [deck, decks])

  useEffect(() => {
    if (!deck) return
    if (index >= deck.cards.length) {
      setIndex(0)
      setFlipped(false)
    }
  }, [deck, index])

  function nextCard(knewIt: boolean) {
    if (!deck || !card || deck.cards.length === 0) return
    onReview(knewIt)
    setFlipped(false)
    setIndex((i) => (i + 1) % deck.cards.length)
  }

  function addDraftCard() {
    if (!front.trim() || !back.trim()) return
    setDraftCards((c) => [...c, { front: front.trim(), back: back.trim() }])
    setFront('')
    setBack('')
  }

  function submitDeck() {
    if (draftCards.length === 0) return
    onCreateDeck(name.trim() || 'Untitled Deck', draftCards)
    setName('')
    setDraftCards([])
    setMode('study')
  }

  return (
    <div className="cards">
      <header className="cards-header">
        <div>
          <h2 className="section-title">Flashcards</h2>
          <p className="section-sub">Flip, recall, earn XP — build decks for any subject.</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMode((m) => (m === 'study' ? 'create' : 'study'))}
        >
          {mode === 'study' ? 'New deck' : 'Back to study'}
        </button>
      </header>

      {mode === 'create' ? (
        <section className="panel create-panel">
          <label>
            Deck name
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spanish verbs"
            />
          </label>
          <div className="card-inputs">
            <label>
              Front
              <textarea
                className="field"
                rows={2}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Prompt or question"
              />
            </label>
            <label>
              Back
              <textarea
                className="field"
                rows={2}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Answer"
              />
            </label>
          </div>
          <div className="create-actions">
            <button type="button" className="btn btn-ghost" onClick={addDraftCard}>
              Add card ({draftCards.length})
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitDeck}
              disabled={draftCards.length === 0}
            >
              Create deck
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="deck-select">
            {decks.map((d) => (
              <button
                key={d.id}
                type="button"
                className={d.id === deck?.id ? 'active' : ''}
                onClick={() => {
                  setDeckId(d.id)
                  setIndex(0)
                  setFlipped(false)
                }}
              >
                {d.name}
                <em>{d.cards.length}</em>
              </button>
            ))}
          </div>

          {card ? (
            <div className="panel study-panel">
              <button
                type="button"
                className={`flip-card ${flipped ? 'flipped' : ''}`}
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? 'Show front' : 'Show back'}
              >
                <div className="flip-inner">
                  <div className="face front">
                    <span>Front</span>
                    <p>{card.front}</p>
                  </div>
                  <div className="face back">
                    <span>Back</span>
                    <p>{card.back}</p>
                  </div>
                </div>
              </button>
              <p className="card-progress">
                Card {index + 1} of {deck.cards.length} · tap card to flip
              </p>
              <div className="grade-actions">
                <button type="button" className="btn btn-ghost" onClick={() => nextCard(false)}>
                  Still learning
                </button>
                <button type="button" className="btn btn-primary" onClick={() => nextCard(true)}>
                  Got it
                </button>
              </div>
            </div>
          ) : (
            <div className="panel empty-panel">
              <p>This deck has no cards yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
