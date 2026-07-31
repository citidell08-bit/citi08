import type { Deck } from '../types'

export const SAMPLE_DECK: Deck = {
  id: 'deck_sample_bio',
  name: 'Cell Biology Starter',
  createdAt: '2026-01-01T00:00:00.000Z',
  cards: [
    {
      id: 'c1',
      front: 'What is the powerhouse of the cell?',
      back: 'Mitochondria — they generate most of the cell\'s ATP.',
    },
    {
      id: 'c2',
      front: 'What does DNA stand for?',
      back: 'Deoxyribonucleic acid.',
    },
    {
      id: 'c3',
      front: 'Which organelle synthesizes proteins?',
      back: 'Ribosomes.',
    },
    {
      id: 'c4',
      front: 'What is osmosis?',
      back: 'Diffusion of water across a selectively permeable membrane.',
    },
    {
      id: 'c5',
      front: 'Name the three parts of the cell theory.',
      back: 'All living things are made of cells; the cell is the basic unit of life; all cells come from preexisting cells.',
    },
  ],
}
