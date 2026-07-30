/**
 * Ruin Scholar — Gamified Study Companion
 * Infinite 2D pixel ruin adventure with study quests & dungeon bosses.
 */

(() => {
  "use strict";

  // ——— Constants ———
  const TILE = 16;
  const CHUNK = 16;
  const WORLD_SEED = (Date.now() ^ 0x9e3779b9) >>> 0;

  const TILES = {
    GRASS: 0,
    DIRT: 1,
    STONE: 2,
    RUIN: 3,
    WATER: 4,
    SAND: 5,
    PATH: 6,
    WALL: 7,
    FLOOR: 8,
    VILLAGE: 9,
    DUNGEON: 10,
    QUEST: 11,
    BOSS: 12,
    TREE: 13,
    FLOWER: 14,
  };

  const BIOME_NAMES = {
    plains: "Grassland Ruins",
    forest: "Mosswood Expanse",
    desert: "Sunken Sands",
    mountain: "Crag of Echoes",
    swamp: "Mire of Whispers",
  };

  const DIFFICULTY = {
    easy: { label: "Easy", questTier: 0, bossOffset: 0, lootMult: 1, spawnRate: 0.9 },
    medium: { label: "Medium", questTier: 1, bossOffset: 1, lootMult: 1.4, spawnRate: 1 },
    hard: { label: "Hard", questTier: 2, bossOffset: 2, lootMult: 1.8, spawnRate: 1.15 },
    raid: { label: "Raid", questTier: 3, bossOffset: 3, lootMult: 2.5, spawnRate: 1.35 },
  };

  const LOOT_TABLE = [
    { id: "scroll", name: "Ruined Scroll", rarity: "common" },
    { id: "ink", name: "Scholar's Ink", rarity: "common" },
    { id: "amulet", name: "Moss Amulet", rarity: "uncommon" },
    { id: "blade", name: "Stoneblade Shard", rarity: "uncommon" },
    { id: "tome", name: "Forgotten Tome", rarity: "rare" },
    { id: "crown", name: "Ruin Crown Fragment", rarity: "rare" },
    { id: "relic", name: "Ancient Relic", rarity: "epic" },
    { id: "scepter", name: "Guardian's Scepter", rarity: "epic" },
    { id: "codex", name: "Codex of Eternity", rarity: "legendary" },
  ];

  // ——— Question bank (subject × difficulty tiers 0–3+) ———
  const QUESTIONS = {
    math: [
      { q: "What is 7 × 8?", a: ["54", "56", "64", "48"], c: 1, tier: 0 },
      { q: "What is 15% of 200?", a: ["20", "25", "30", "35"], c: 2, tier: 0 },
      { q: "Solve: 12 + 9 ÷ 3", a: ["7", "15", "13", "21"], c: 1, tier: 0 },
      { q: "What is the square root of 81?", a: ["8", "9", "10", "7"], c: 1, tier: 0 },
      { q: "How many degrees in a right angle?", a: ["45°", "90°", "180°", "360°"], c: 1, tier: 0 },
      { q: "What is the perimeter of a square with side 6?", a: ["12", "24", "36", "18"], c: 1, tier: 1 },
      { q: "If x + 5 = 12, what is x?", a: ["5", "6", "7", "17"], c: 2, tier: 1 },
      { q: "What is the area of a rectangle 4×9?", a: ["13", "26", "36", "40"], c: 2, tier: 1 },
      { q: "Convert 3/4 to a decimal.", a: ["0.25", "0.5", "0.75", "0.34"], c: 2, tier: 1 },
      { q: "What is 2³?", a: ["6", "8", "9", "4"], c: 1, tier: 1 },
      { q: "What is the mean of 4, 6, 10, 12?", a: ["7", "8", "9", "10"], c: 1, tier: 2 },
      { q: "Solve: 3(x − 2) = 15", a: ["5", "7", "9", "3"], c: 1, tier: 2 },
      { q: "What is the hypotenuse of a 3-4-? triangle?", a: ["5", "6", "7", "4"], c: 0, tier: 2 },
      { q: "Factorize: x² − 9", a: ["(x−3)²", "(x−9)(x+1)", "(x−3)(x+3)", "x(x−9)"], c: 2, tier: 2 },
      { q: "What is sin(90°)?", a: ["0", "0.5", "1", "√2/2"], c: 2, tier: 2 },
      { q: "Derivative of x²?", a: ["x", "2x", "x²", "2"], c: 1, tier: 3 },
      { q: "Integral of 2x dx?", a: ["x² + C", "2x² + C", "x + C", "2 + C"], c: 0, tier: 3 },
      { q: "Solve: log₁₀(1000)", a: ["2", "3", "4", "10"], c: 1, tier: 3 },
      { q: "What is the quadratic formula discriminant?", a: ["b²−4ac", "b²+4ac", "2b−4ac", "a²−4bc"], c: 0, tier: 3 },
      { q: "Limit of (sin x)/x as x→0?", a: ["0", "∞", "1", "undefined"], c: 2, tier: 3 },
      { q: "Eigenvalues solve det(A − λI) = ?", a: ["1", "A", "0", "λ"], c: 2, tier: 4 },
      { q: "Sum of infinite geometric series |r|<1: a/(1−r). If a=3, r=1/2?", a: ["3", "4", "6", "1.5"], c: 2, tier: 4 },
      { q: "What is Γ(n) for positive integer n?", a: ["n!", "(n−1)!", "nⁿ", "n+1"], c: 1, tier: 4 },
    ],
    science: [
      { q: "What planet is known as the Red Planet?", a: ["Venus", "Mars", "Jupiter", "Mercury"], c: 1, tier: 0 },
      { q: "Water freezes at what Celsius temperature?", a: ["0°C", "32°C", "100°C", "−10°C"], c: 0, tier: 0 },
      { q: "What gas do plants absorb for photosynthesis?", a: ["Oxygen", "Nitrogen", "CO₂", "Helium"], c: 2, tier: 0 },
      { q: "How many bones in an adult human body (approx)?", a: ["106", "206", "306", "156"], c: 1, tier: 0 },
      { q: "What is H₂O?", a: ["Salt", "Water", "Hydrogen", "Ozone"], c: 1, tier: 0 },
      { q: "Force equals mass times…?", a: ["velocity", "acceleration", "distance", "time"], c: 1, tier: 1 },
      { q: "What organelle produces energy in cells?", a: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], c: 2, tier: 1 },
      { q: "Atomic number of Carbon?", a: ["4", "6", "8", "12"], c: 1, tier: 1 },
      { q: "Speed of light (approx) in vacuum?", a: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁵ km/h", "340 m/s"], c: 0, tier: 1 },
      { q: "DNA stands for…?", a: ["Deoxyribonucleic acid", "Dinucleic acid", "Dual nucleic acid", "Deoxynitric acid"], c: 0, tier: 1 },
      { q: "pH of a neutral solution?", a: ["0", "7", "14", "1"], c: 1, tier: 2 },
      { q: "Newton's third law says for every action there is…?", a: ["inertia", "equal opposite reaction", "gravity", "friction"], c: 1, tier: 2 },
      { q: "Which particle has a negative charge?", a: ["Proton", "Neutron", "Electron", "Photon"], c: 2, tier: 2 },
      { q: "What type of rock forms from cooled magma?", a: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], c: 2, tier: 2 },
      { q: "Chlorophyll primarily absorbs which light colors?", a: ["Green", "Red & blue", "Yellow", "White"], c: 1, tier: 2 },
      { q: "Avogadro's number is approximately?", a: ["6.02×10²³", "3.14×10⁸", "9.8×10¹", "1.6×10⁻¹⁹"], c: 0, tier: 3 },
      { q: "E = mc² relates energy to…?", a: ["momentum", "mass & light speed", "charge", "frequency"], c: 1, tier: 3 },
      { q: "CRISPR is used for…?", a: ["Weather forecasting", "Gene editing", "Fusion power", "Optics"], c: 1, tier: 3 },
      { q: "Half-life describes…?", a: ["Cell division", "Radioactive decay rate", "Orbital period", "Boiling point"], c: 1, tier: 3 },
      { q: "Entropy in a closed system tends to…?", a: ["Decrease", "Stay fixed", "Increase", "Oscillate"], c: 2, tier: 3 },
      { q: "Heisenberg uncertainty relates…?", a: ["Position & momentum", "Mass & energy", "Charge & spin", "Time & distance"], c: 0, tier: 4 },
      { q: "Standard model boson that gives mass?", a: ["Photon", "Gluon", "Higgs", "Graviton"], c: 2, tier: 4 },
      { q: "NADH is primarily involved in…?", a: ["Photosynthesis only", "Cellular respiration", "DNA repair", "Osmosis"], c: 1, tier: 4 },
    ],
    history: [
      { q: "Who was the first President of the United States?", a: ["Jefferson", "Washington", "Lincoln", "Adams"], c: 1, tier: 0 },
      { q: "In which year did WWII end in Europe?", a: ["1943", "1944", "1945", "1946"], c: 2, tier: 0 },
      { q: "Ancient Egypt's writing system is called…?", a: ["Cuneiform", "Hieroglyphics", "Latin", "Runes"], c: 1, tier: 0 },
      { q: "The Great Wall is in which country?", a: ["Japan", "India", "China", "Mongolia"], c: 2, tier: 0 },
      { q: "Who painted the Mona Lisa?", a: ["Michelangelo", "Da Vinci", "Raphael", "Rembrandt"], c: 1, tier: 0 },
      { q: "The Renaissance began in which country?", a: ["France", "England", "Italy", "Spain"], c: 2, tier: 1 },
      { q: "Magna Carta was signed in…?", a: ["1066", "1215", "1492", "1776"], c: 1, tier: 1 },
      { q: "Who led the Mongol Empire's early expansion?", a: ["Kublai Khan", "Genghis Khan", "Attila", "Tamerlane"], c: 1, tier: 1 },
      { q: "Fall of the Western Roman Empire is often dated…?", a: ["476 CE", "410 CE", "330 CE", "1453 CE"], c: 0, tier: 1 },
      { q: "Industrial Revolution began in…?", a: ["USA", "Germany", "Britain", "France"], c: 2, tier: 1 },
      { q: "The Cold War was mainly between…?", a: ["UK & France", "USA & USSR", "China & Japan", "Germany & Italy"], c: 1, tier: 2 },
      { q: "Who wrote the Declaration of Independence (primary draft)?", a: ["Franklin", "Jefferson", "Madison", "Hamilton"], c: 1, tier: 2 },
      { q: "The Silk Road connected China mainly with…?", a: ["Australia", "Europe & Middle East", "Antarctica", "Scandinavia only"], c: 1, tier: 2 },
      { q: "Meiji Restoration modernized which nation?", a: ["Korea", "China", "Japan", "Vietnam"], c: 2, tier: 2 },
      { q: "Berlin Wall fell in…?", a: ["1985", "1989", "1991", "1979"], c: 1, tier: 2 },
      { q: "Treaty of Westphalia (1648) ended which war?", a: ["Hundred Years'", "Thirty Years'", "Seven Years'", "Napoleonic"], c: 1, tier: 3 },
      { q: "Who was Akbar the Great associated with?", a: ["Ottoman Empire", "Mughal Empire", "Aztec Empire", "Byzantine"], c: 1, tier: 3 },
      { q: "Congress of Vienna (1815) reshaped Europe after…?", a: ["WWI", "Napoleonic Wars", "Crimean War", "Franco-Prussian"], c: 1, tier: 3 },
      { q: "The Rosetta Stone unlocked which language?", a: ["Sumerian", "Ancient Egyptian", "Mayan", "Sanskrit"], c: 1, tier: 3 },
      { q: "Who founded the Achaemenid Persian Empire?", a: ["Darius I", "Cyrus the Great", "Xerxes", "Alexander"], c: 1, tier: 3 },
      { q: "Treaty of Tordesillas divided the New World between…?", a: ["England & France", "Spain & Portugal", "Netherlands & Spain", "Italy & Spain"], c: 1, tier: 4 },
      { q: "Justinian's Code influenced which legal tradition?", a: ["Common law only", "Civil law", "Sharia only", "Canon only"], c: 1, tier: 4 },
      { q: "The Delian League was led by…?", a: ["Sparta", "Athens", "Corinth", "Thebes"], c: 1, tier: 4 },
    ],
    english: [
      { q: "A noun is a…?", a: ["Action word", "Person, place, or thing", "Describing word", "Connecting word"], c: 1, tier: 0 },
      { q: "Which is a synonym of 'happy'?", a: ["Sad", "Joyful", "Angry", "Tired"], c: 1, tier: 0 },
      { q: "Who wrote Romeo and Juliet?", a: ["Dickens", "Shakespeare", "Austen", "Twain"], c: 1, tier: 0 },
      { q: "Past tense of 'run'?", a: ["Runned", "Ran", "Running", "Runs"], c: 1, tier: 0 },
      { q: "An adjective describes a…?", a: ["Verb only", "Noun", "Preposition", "Conjunction"], c: 1, tier: 0 },
      { q: "What is a metaphor?", a: ["Exact comparison with like/as", "Direct comparison without like/as", "Exaggeration", "Sound word"], c: 1, tier: 1 },
      { q: "Who wrote Pride and Prejudice?", a: ["Brontë", "Austen", "Woolf", "Eliot"], c: 1, tier: 1 },
      { q: "Plural of 'child'?", a: ["Childs", "Children", "Childrens", "Childer"], c: 1, tier: 1 },
      { q: "Alliteration repeats…?", a: ["Vowels only", "Initial consonant sounds", "Syllables", "Rhymes"], c: 1, tier: 1 },
      { q: "A protagonist is the…?", a: ["Villain", "Main character", "Narrator always", "Setting"], c: 1, tier: 1 },
      { q: "Iambic pentameter has how many feet per line?", a: ["3", "4", "5", "6"], c: 2, tier: 2 },
      { q: "Who wrote 1984?", a: ["Huxley", "Orwell", "Bradbury", "Atwood"], c: 1, tier: 2 },
      { q: "Dramatic irony means…?", a: ["Audience knows more than characters", "Opposite of expected happens", "Harsh sarcasm", "Pun"], c: 0, tier: 2 },
      { q: "A sonnet traditionally has how many lines?", a: ["10", "12", "14", "16"], c: 2, tier: 2 },
      { q: "Oxymoron pairs…?", a: ["Synonyms", "Contradictory terms", "Rhymes", "Homophones"], c: 1, tier: 2 },
      { q: "Who wrote The Canterbury Tales?", a: ["Milton", "Chaucer", "Spenser", "Marlowe"], c: 1, tier: 3 },
      { q: "Stream of consciousness is associated with…?", a: ["Hemingway only", "Modernist writers like Woolf", "Epic poets", "Satirists only"], c: 1, tier: 3 },
      { q: "A bildungsroman focuses on…?", a: ["War", "Coming of age", "Detective work", "Travel only"], c: 1, tier: 3 },
      { q: "Synecdoche uses a part to represent…?", a: ["Nothing", "The whole", "A rhyme", "A metaphor only"], c: 1, tier: 3 },
      { q: "Who wrote Beloved?", a: ["Walker", "Morrison", "Hurston", "Angelou"], c: 1, tier: 3 },
      { q: "Hamartia in tragedy refers to…?", a: ["Comic relief", "Tragic flaw", "Chorus", "Deus ex machina"], c: 1, tier: 4 },
      { q: "Anaphora is repetition at the…?", a: ["End of clauses", "Beginning of successive clauses", "Middle of words", "Rhyme scheme"], c: 1, tier: 4 },
      { q: "Intertextuality means texts…?", a: ["Have no meaning", "Reference or relate to other texts", "Must rhyme", "Are anonymous"], c: 1, tier: 4 },
    ],
    geography: [
      { q: "What is the largest ocean?", a: ["Atlantic", "Indian", "Pacific", "Arctic"], c: 2, tier: 0 },
      { q: "Capital of France?", a: ["Lyon", "Paris", "Marseille", "Nice"], c: 1, tier: 0 },
      { q: "Which continent is Egypt mostly on?", a: ["Asia", "Europe", "Africa", "Australia"], c: 2, tier: 0 },
      { q: "Mount Everest lies on the border of Nepal and…?", a: ["India", "China", "Bhutan", "Pakistan"], c: 1, tier: 0 },
      { q: "The Amazon River is mainly in…?", a: ["Africa", "South America", "Asia", "Australia"], c: 1, tier: 0 },
      { q: "What line divides Earth into Northern & Southern Hemispheres?", a: ["Prime Meridian", "Equator", "Tropic of Cancer", "International Date Line"], c: 1, tier: 1 },
      { q: "Capital of Japan?", a: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], c: 2, tier: 1 },
      { q: "The Sahara is primarily in…?", a: ["South America", "Africa", "Australia", "Asia"], c: 1, tier: 1 },
      { q: "Which country has the most time zones?", a: ["USA", "Russia", "China", "Canada"], c: 1, tier: 1 },
      { q: "Ring of Fire is associated with…?", a: ["Tornadoes", "Earthquakes & volcanoes", "Hurricanes only", "Deserts"], c: 1, tier: 1 },
      { q: "Longitude measures…?", a: ["North-South position", "East-West position", "Altitude", "Depth"], c: 1, tier: 2 },
      { q: "Largest desert by area (incl. cold)?", a: ["Sahara", "Gobi", "Antarctic", "Arabian"], c: 2, tier: 2 },
      { q: "The Strait of Gibraltar separates Europe from…?", a: ["Asia", "Africa", "America", "Australia"], c: 1, tier: 2 },
      { q: "Which river is the longest?", a: ["Amazon", "Nile (traditionally)", "Yangtze", "Mississippi"], c: 1, tier: 2 },
      { q: "Plate tectonics explains…?", a: ["Ocean tides only", "Continental drift & earthquakes", "Seasons", "Magnetism only"], c: 1, tier: 2 },
      { q: "Köppen classification describes…?", a: ["Soil types", "Climate zones", "Ocean currents", "Languages"], c: 1, tier: 3 },
      { q: "Orographic rainfall is caused by…?", a: ["Mountains forcing air upward", "Ocean tides", "Solar flares", "City heat only"], c: 0, tier: 3 },
      { q: "The Wallace Line separates fauna of…?", a: ["Africa & Europe", "Asia & Australasia", "N & S America", "Arctic & Antarctic"], c: 1, tier: 3 },
      { q: "Atacama Desert is in…?", a: ["Africa", "Chile/Peru region", "Australia", "Mongolia"], c: 1, tier: 3 },
      { q: "Isostasy relates to…?", a: ["Ocean salinity", "Crustal balance/ buoyancy", "Wind patterns", "Trade routes"], c: 1, tier: 3 },
      { q: "Hadley cells are part of…?", a: ["Ocean trenches", "Atmospheric circulation", "Plate boundaries", "Glacial cycles"], c: 1, tier: 4 },
      { q: "A thalweg is typically the…?", a: ["Mountain peak", "Deepest channel of a river", "Desert dune crest", "Fault line"], c: 1, tier: 4 },
      { q: "Milankovitch cycles relate to…?", a: ["Tides", "Long-term climate via orbital changes", "Volcanoes only", "Magnetosphere"], c: 1, tier: 4 },
    ],
  };

  // ——— State ———
  const state = {
    running: false,
    paused: false,
    seed: WORLD_SEED,
    subject: "math",
    difficulty: "easy",
    playerName: "Scholar",
    level: 1,
    kp: 0,
    questsDone: 0,
    bossesDefeated: 0,
    inventory: [],
    spawn: { x: 0, y: 0 },
    checkpoint: { x: 0, y: 0 },
    player: { x: 0.5, y: 0.5, vx: 0, vy: 0, facing: 0 },
    keys: Object.create(null),
    settings: {
      fov: 11,
      renderDist: 6,
      speed: 1,
      minimap: true,
      particles: true,
      forceMobile: false,
    },
    chunks: new Map(),
    structures: new Map(), // key -> { type, wx, wy, done, name }
    interactTarget: null,
    particles: [],
    usedQuestions: new Set(),
    bossFight: null,
    animT: 0,
  };

  // ——— DOM ———
  const $ = (id) => document.getElementById(id);
  const canvas = $("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const miniCanvas = $("minimap-canvas");
  const miniCtx = miniCanvas.getContext("2d", { alpha: false });

  ctx.imageSmoothingEnabled = false;
  miniCtx.imageSmoothingEnabled = false;

  // ——— RNG / Noise ———
  function hash2(x, y, seed = state.seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function smoothNoise(x, y, scale = 1) {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const fx = sx - x0;
    const fy = sy - y0;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = hash2(x0, y0);
    const b = hash2(x0 + 1, y0);
    const c = hash2(x0, y0 + 1);
    const d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y) {
    return (
      smoothNoise(x, y, 48) * 0.5 +
      smoothNoise(x, y, 24) * 0.28 +
      smoothNoise(x, y, 12) * 0.14 +
      smoothNoise(x, y, 6) * 0.08
    );
  }

  function chunkKey(cx, cy) {
    return `${cx},${cy}`;
  }

  function worldToChunk(wx, wy) {
    return { cx: Math.floor(wx / CHUNK), cy: Math.floor(wy / CHUNK) };
  }

  function biomeAt(wx, wy) {
    const t = fbm(wx, wy);
    const m = smoothNoise(wx + 2000, wy - 900, 64);
    if (t < 0.32) return "swamp";
    if (t > 0.72) return "mountain";
    if (m > 0.68) return "desert";
    if (m < 0.35) return "forest";
    return "plains";
  }

  function baseTile(wx, wy) {
    const biome = biomeAt(wx, wy);
    const n = fbm(wx, wy);
    const detail = hash2(wx, wy);

    if (biome === "swamp") {
      if (n < 0.38) return TILES.WATER;
      if (detail < 0.08) return TILES.TREE;
      return TILES.DIRT;
    }
    if (biome === "desert") {
      if (n < 0.28) return TILES.STONE;
      return TILES.SAND;
    }
    if (biome === "mountain") {
      if (n > 0.78) return TILES.WALL;
      if (n > 0.62) return TILES.STONE;
      return TILES.RUIN;
    }
    if (biome === "forest") {
      if (detail < 0.14) return TILES.TREE;
      if (detail < 0.2) return TILES.FLOWER;
      return TILES.GRASS;
    }
    // plains
    if (detail < 0.04) return TILES.RUIN;
    if (detail < 0.07) return TILES.FLOWER;
    if (n < 0.3) return TILES.DIRT;
    return TILES.GRASS;
  }

  function isSolid(tile) {
    return tile === TILES.WATER || tile === TILES.WALL || tile === TILES.TREE;
  }

  function ensureChunk(cx, cy) {
    const key = chunkKey(cx, cy);
    if (state.chunks.has(key)) return state.chunks.get(key);

    const tiles = new Uint8Array(CHUNK * CHUNK);
    for (let ly = 0; ly < CHUNK; ly++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const wx = cx * CHUNK + lx;
        const wy = cy * CHUNK + ly;
        tiles[ly * CHUNK + lx] = baseTile(wx, wy);
      }
    }

    // Structure placement — villages & dungeons via chunk hash
    const r = hash2(cx, cy, state.seed ^ 0xabc);
    const r2 = hash2(cx + 7, cy - 3, state.seed ^ 0xdef);

    if (r > 0.92 && Math.abs(cx) + Math.abs(cy) > 1) {
      placeVillage(tiles, cx, cy);
    } else if (r2 > 0.935 && Math.abs(cx) + Math.abs(cy) > 2) {
      placeDungeon(tiles, cx, cy);
    } else if (r > 0.78 && r < 0.85) {
      // stray quest shrine
      const lx = 4 + Math.floor(hash2(cx, cy, 11) * 8);
      const ly = 4 + Math.floor(hash2(cx, cy, 22) * 8);
      tiles[ly * CHUNK + lx] = TILES.QUEST;
      const wx = cx * CHUNK + lx;
      const wy = cy * CHUNK + ly;
      const sk = `${wx},${wy}`;
      if (!state.structures.has(sk)) {
        state.structures.set(sk, {
          type: "quest",
          wx,
          wy,
          done: false,
          name: randomQuestName(wx, wy),
        });
      }
    }

    // Clear spawn area
    if (cx === 0 && cy === 0) {
      for (let ly = 6; ly <= 9; ly++) {
        for (let lx = 6; lx <= 9; lx++) {
          tiles[ly * CHUNK + lx] = TILES.PATH;
        }
      }
      tiles[8 * CHUNK + 8] = TILES.PATH;
    }

    const chunk = { cx, cy, tiles };
    state.chunks.set(key, chunk);
    return chunk;
  }

  function randomQuestName(wx, wy) {
    const names = [
      "Village Elder",
      "Wandering Monk",
      "Ruined Scholar",
      "Moss Oracle",
      "Stone Scribe",
      "Lantern Keeper",
      "Archive Ghost",
      "Trial Pedestal",
    ];
    return names[Math.floor(hash2(wx, wy, 99) * names.length)];
  }

  function placeVillage(tiles, cx, cy) {
    const ox = 3;
    const oy = 3;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        if (x === 0 || y === 0 || x === 9 || y === 9) {
          if ((x + y) % 3 !== 0) tiles[i] = TILES.RUIN;
          else tiles[i] = TILES.PATH;
        } else {
          tiles[i] = TILES.PATH;
        }
      }
    }
    // houses
    for (let i = 0; i < 3; i++) {
      const hx = ox + 2 + i * 3;
      const hy = oy + 2 + (i % 2) * 4;
      tiles[hy * CHUNK + hx] = TILES.VILLAGE;
      tiles[(hy + 1) * CHUNK + hx] = TILES.WALL;
    }
    // quest NPC in center
    const qx = ox + 5;
    const qy = oy + 5;
    tiles[qy * CHUNK + qx] = TILES.QUEST;
    const wx = cx * CHUNK + qx;
    const wy = cy * CHUNK + qy;
    state.structures.set(`${wx},${wy}`, {
      type: "quest",
      wx,
      wy,
      done: false,
      name: "Village Trial",
      village: true,
    });
  }

  function placeDungeon(tiles, cx, cy) {
    const ox = 2;
    const oy = 2;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        if (x === 0 || y === 0 || x === 11 || y === 11) {
          tiles[i] = TILES.WALL;
        } else {
          tiles[i] = TILES.FLOOR;
        }
      }
    }
    // entrance gap
    tiles[(oy + 11) * CHUNK + (ox + 5)] = TILES.FLOOR;
    tiles[(oy + 11) * CHUNK + (ox + 6)] = TILES.FLOOR;
    // pillars
    tiles[(oy + 3) * CHUNK + (ox + 3)] = TILES.RUIN;
    tiles[(oy + 3) * CHUNK + (ox + 8)] = TILES.RUIN;
    tiles[(oy + 8) * CHUNK + (ox + 3)] = TILES.RUIN;
    tiles[(oy + 8) * CHUNK + (ox + 8)] = TILES.RUIN;
    // dungeon marker + boss
    tiles[(oy + 2) * CHUNK + (ox + 6)] = TILES.DUNGEON;
    const bx = ox + 6;
    const by = oy + 5;
    tiles[by * CHUNK + bx] = TILES.BOSS;
    const wx = cx * CHUNK + bx;
    const wy = cy * CHUNK + by;
    state.structures.set(`${wx},${wy}`, {
      type: "boss",
      wx,
      wy,
      done: false,
      name: dungeonName(cx, cy),
      level: 1 + Math.floor((Math.abs(cx) + Math.abs(cy)) / 4),
    });
  }

  function dungeonName(cx, cy) {
    const a = ["Hollow", "Ashen", "Forgotten", "Sunken", "Crimson", "Silent"];
    const b = ["Crypt", "Keep", "Catacomb", "Sanctum", "Vault", "Spire"];
    return `${a[Math.floor(hash2(cx, cy, 1) * a.length)]} ${b[Math.floor(hash2(cx, cy, 2) * b.length)]}`;
  }

  function getTile(wx, wy) {
    const { cx, cy } = worldToChunk(wx, wy);
    const chunk = ensureChunk(cx, cy);
    const lx = ((wx % CHUNK) + CHUNK) % CHUNK;
    const ly = ((wy % CHUNK) + CHUNK) % CHUNK;
    return chunk.tiles[ly * CHUNK + lx];
  }

  function setTile(wx, wy, tile) {
    const { cx, cy } = worldToChunk(wx, wy);
    const chunk = ensureChunk(cx, cy);
    const lx = ((wx % CHUNK) + CHUNK) % CHUNK;
    const ly = ((wy % CHUNK) + CHUNK) % CHUNK;
    chunk.tiles[ly * CHUNK + lx] = tile;
  }

  // ——— Colors ———
  const TILE_COLORS = {
    [TILES.GRASS]: ["#3d5c32", "#4a6e3c"],
    [TILES.DIRT]: ["#5c4634", "#6b523c"],
    [TILES.STONE]: ["#5a5650", "#6a6660"],
    [TILES.RUIN]: ["#7a6a58", "#8a7a66"],
    [TILES.WATER]: ["#2a4a5c", "#356078"],
    [TILES.SAND]: ["#c4a86a", "#d4b87a"],
    [TILES.PATH]: ["#8a7458", "#9a8468"],
    [TILES.WALL]: ["#3a342c", "#2a241c"],
    [TILES.FLOOR]: ["#4a4034", "#554838"],
    [TILES.VILLAGE]: ["#a65d3f", "#c97852"],
    [TILES.DUNGEON]: ["#5a3038", "#7a4048"],
    [TILES.QUEST]: ["#d4a84b", "#f0c96a"],
    [TILES.BOSS]: ["#b54a3c", "#e06a55"],
    [TILES.TREE]: ["#2a4028", "#1a3018"],
    [TILES.FLOWER]: ["#3d5c32", "#c97852"],
  };

  // ——— Questions ———
  function pickQuestion(tier) {
    const pool = QUESTIONS[state.subject] || QUESTIONS.math;
    const eligible = pool.filter((q) => q.tier <= tier && q.tier >= Math.max(0, tier - 1));
    const fallback = pool.filter((q) => q.tier <= tier);
    const list = eligible.length ? eligible : fallback.length ? fallback : pool;

    // Prefer unused
    let unused = list.filter((q) => !state.usedQuestions.has(q.q));
    if (!unused.length) {
      // reset used for this subject tier band
      list.forEach((q) => state.usedQuestions.delete(q.q));
      unused = list;
    }
    const q = unused[Math.floor(Math.random() * unused.length)];
    state.usedQuestions.add(q.q);
    return q;
  }

  function grantLoot(count = 1, epicBias = false) {
    const diff = DIFFICULTY[state.difficulty];
    const gained = [];
    for (let i = 0; i < count; i++) {
      let roll = Math.random();
      if (epicBias) roll *= 0.6;
      roll /= diff.lootMult * 0.5 + 0.5;
      let rarity;
      if (roll < 0.08) rarity = "legendary";
      else if (roll < 0.22) rarity = "epic";
      else if (roll < 0.45) rarity = "rare";
      else if (roll < 0.7) rarity = "uncommon";
      else rarity = "common";

      const options = LOOT_TABLE.filter((l) => l.rarity === rarity);
      const item = { ...options[Math.floor(Math.random() * options.length)], id: `${Date.now()}-${i}-${Math.random()}` };
      state.inventory.push(item);
      gained.push(item);
    }
    updateInventoryUI();
    return gained;
  }

  function clearInventory() {
    state.inventory = [];
    updateInventoryUI();
  }

  function updateInventoryUI() {
    const list = $("inventory-list");
    const empty = $("inventory-empty");
    list.innerHTML = "";
    if (!state.inventory.length) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    state.inventory.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="item-name">${item.name}</span><span class="item-meta">${item.rarity}</span>`;
      list.appendChild(li);
    });
  }

  function updateHUD() {
    $("hud-level").textContent = String(state.level);
    $("hud-kp").textContent = String(state.kp);
    $("hud-quests").textContent = String(state.questsDone);
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    $("hud-coords").textContent = `${px}, ${py}`;
    $("hud-biome").textContent = BIOME_NAMES[biomeAt(px, py)] || "Unknown";
  }

  // ——— UI helpers ———
  function showToast(msg, bad = false) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.toggle("bad", bad);
    t.classList.remove("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  function openModal(id) {
    $(id).classList.remove("hidden");
  }

  function closeModal(id) {
    $(id).classList.add("hidden");
  }

  function showResult(title, body, onOk) {
    $("result-title").textContent = title;
    $("result-body").textContent = body;
    openModal("result-modal");
    const btn = $("btn-result-ok");
    const handler = () => {
      btn.removeEventListener("click", handler);
      closeModal("result-modal");
      if (onOk) onOk();
    };
    btn.addEventListener("click", handler);
  }

  // ——— Quest flow ———
  function startQuest(structure) {
    if (structure.done) {
      showToast("This trial has already been completed.");
      return;
    }
    state.paused = true;
    const diff = DIFFICULTY[state.difficulty];
    const tier = Math.min(4, diff.questTier + Math.floor((state.level - 1) / 2));
    const question = pickQuestion(tier);

    $("quest-title").textContent = structure.name || "Trial";
    $("quest-flavor").textContent = structure.village
      ? `"Traveler ${state.playerName}, prove your knowledge of ${labelSubject()} and earn our blessing."`
      : `A weathered pedestal hums. Answer correctly to claim its relic.`;
    $("quest-question").textContent = question.q;
    $("quest-feedback").classList.add("hidden");

    const choices = $("quest-choices");
    choices.innerHTML = "";
    question.a.forEach((ans, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${ans}`;
      btn.addEventListener("click", () => answerQuest(structure, question, i, btn));
      choices.appendChild(btn);
    });

    openModal("quest-modal");
  }

  function labelSubject() {
    return (
      {
        math: "Mathematics",
        science: "Science",
        history: "History",
        english: "English & Literature",
        geography: "Geography",
      }[state.subject] || "your subject"
    );
  }

  function answerQuest(structure, question, choice, btn) {
    const buttons = [...$("quest-choices").children];
    buttons.forEach((b) => (b.disabled = true));
    const correct = choice === question.c;
    btn.classList.add(correct ? "correct" : "wrong");
    buttons[question.c].classList.add("correct");

    const fb = $("quest-feedback");
    fb.classList.remove("hidden");

    if (correct) {
      fb.classList.remove("bad");
      fb.textContent = "Correct! Loot secured.";
      structure.done = true;
      setTile(structure.wx, structure.wy, TILES.PATH);
      state.questsDone++;
      state.kp += 10 + DIFFICULTY[state.difficulty].questTier * 5;
      const loot = grantLoot(1 + (Math.random() < 0.35 ? 1 : 0));
      state.checkpoint = { x: structure.wx + 0.5, y: structure.wy + 0.5 };
      updateHUD();
      setTimeout(() => {
        closeModal("quest-modal");
        state.paused = false;
        showToast(`+${loot.map((l) => l.name).join(", ")}`);
      }, 900);
    } else {
      fb.classList.add("bad");
      fb.textContent = "Wrong… the ruins reject you. Returning to the beginning.";
      setTimeout(() => {
        closeModal("quest-modal");
        respawnToBeginning();
        state.paused = false;
        showToast("Respawned at the gate.", true);
      }, 1200);
    }
  }

  function respawnToBeginning() {
    state.player.x = state.spawn.x;
    state.player.y = state.spawn.y;
    state.player.vx = 0;
    state.player.vy = 0;
  }

  function goToPreviousLevel() {
    // Lose items and drop one level (min 1), teleport near checkpoint or spawn
    clearInventory();
    state.level = Math.max(1, state.level - 1);
    const target = state.level <= 1 ? state.spawn : state.checkpoint;
    state.player.x = target.x;
    state.player.y = target.y;
    state.player.vx = 0;
    state.player.vy = 0;
    updateHUD();
  }

  // ——— Boss fight ———
  function startBoss(structure) {
    if (structure.done) {
      showToast("This guardian has already fallen.");
      return;
    }
    state.paused = true;
    const diff = DIFFICULTY[state.difficulty];
    const baseTier = Math.min(4, diff.bossOffset + structure.level);

    state.bossFight = {
      structure,
      phase: 0,
      questions: [
        pickQuestion(Math.min(4, baseTier)),
        pickQuestion(Math.min(4, baseTier + 1)),
        pickQuestion(Math.min(4, baseTier + 2)),
      ],
      combatWon: false,
    };

    $("boss-title").textContent = structure.name;
    $("boss-flavor").textContent = `The dungeon guardian challenges ${state.playerName}. Defeat it with knowledge — three escalating trials await.`;
    $("boss-hp-bar").style.width = "100%";
    openModal("boss-modal");
    showBossQuestion();
  }

  function showBossQuestion() {
    const fight = state.bossFight;
    const phase = fight.phase;
    const question = fight.questions[phase];
    $("boss-phase").textContent = `Question ${phase + 1} / 3`;
    $("boss-question").textContent = question.q;
    $("boss-feedback").classList.add("hidden");
    $("boss-hp-bar").style.width = `${100 - phase * 33}%`;

    const choices = $("boss-choices");
    choices.innerHTML = "";
    question.a.forEach((ans, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${ans}`;
      btn.addEventListener("click", () => answerBoss(i, btn));
      choices.appendChild(btn);
    });
  }

  function answerBoss(choice, btn) {
    const fight = state.bossFight;
    const question = fight.questions[fight.phase];
    const buttons = [...$("boss-choices").children];
    buttons.forEach((b) => (b.disabled = true));
    const correct = choice === question.c;
    btn.classList.add(correct ? "correct" : "wrong");
    buttons[question.c].classList.add("correct");

    const fb = $("boss-feedback");
    fb.classList.remove("hidden");

    if (!correct) {
      fb.classList.add("bad");
      fb.textContent = "The guardian strikes! You lose your items and fall back a level.";
      setTimeout(() => {
        closeModal("boss-modal");
        state.bossFight = null;
        goToPreviousLevel();
        state.paused = false;
        showResult(
          "Defeated",
          "You answered incorrectly. Your satchel is emptied and you awaken at the previous level.",
          null
        );
      }, 1100);
      return;
    }

    fb.classList.remove("bad");
    fb.textContent = "The guardian reels…";
    fight.phase++;
    $("boss-hp-bar").style.width = `${Math.max(0, 100 - fight.phase * 34)}%`;

    if (fight.phase >= 3) {
      // Victory
      setTimeout(() => {
        fight.structure.done = true;
        setTile(fight.structure.wx, fight.structure.wy, TILES.FLOOR);
        state.bossesDefeated++;
        state.level++;
        state.kp += 40 + DIFFICULTY[state.difficulty].bossOffset * 15;
        const loot = grantLoot(2 + (state.difficulty === "raid" ? 2 : 1), true);
        state.checkpoint = { x: fight.structure.wx + 0.5, y: fight.structure.wy + 1.5 };
        state.bossFight = null;
        closeModal("boss-modal");
        updateHUD();
        state.paused = false;
        showResult(
          "Guardian Vanquished!",
          `Level up! You are now level ${state.level}. Loot: ${loot.map((l) => l.name).join(", ")}.`,
          null
        );
        spawnParticles(fight.structure.wx + 0.5, fight.structure.wy + 0.5, 24);
      }, 800);
    } else {
      setTimeout(showBossQuestion, 750);
    }
  }

  // ——— Particles ———
  function spawnParticles(x, y, n) {
    if (!state.settings.particles) return;
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.5,
        life: 0.6 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? "#f0c96a" : "#e06a55",
      });
    }
  }

  // ——— Interaction ———
  function findInteractable() {
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    const dirs = [
      [0, 0],
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    for (const [dx, dy] of dirs) {
      const wx = px + dx;
      const wy = py + dy;
      const tile = getTile(wx, wy);
      if (tile === TILES.QUEST || tile === TILES.BOSS) {
        const s = state.structures.get(`${wx},${wy}`);
        if (s && !s.done) return s;
      }
    }
    return null;
  }

  function tryInteract() {
    if (state.paused || !state.running) return;
    const target = findInteractable();
    if (!target) return;
    if (target.type === "quest") startQuest(target);
    else if (target.type === "boss") startBoss(target);
  }

  // ——— Movement ———
  function updatePlayer(dt) {
    let mx = 0;
    let my = 0;
    if (state.keys["ArrowUp"] || state.keys["w"] || state.keys["W"]) my -= 1;
    if (state.keys["ArrowDown"] || state.keys["s"] || state.keys["S"]) my += 1;
    if (state.keys["ArrowLeft"] || state.keys["a"] || state.keys["A"]) mx -= 1;
    if (state.keys["ArrowRight"] || state.keys["d"] || state.keys["D"]) mx += 1;

    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len;
      my /= len;
      state.player.facing = Math.atan2(my, mx);
    }

    const speed = 3.2 * state.settings.speed;
    const nx = state.player.x + mx * speed * dt;
    const ny = state.player.y + my * speed * dt;

    if (!collides(nx, state.player.y)) state.player.x = nx;
    if (!collides(state.player.x, ny)) state.player.y = ny;

    // Preload nearby chunks
    const { cx, cy } = worldToChunk(Math.floor(state.player.x), Math.floor(state.player.y));
    const rd = state.settings.renderDist;
    for (let y = -rd; y <= rd; y++) {
      for (let x = -rd; x <= rd; x++) {
        ensureChunk(cx + x, cy + y);
      }
    }

    state.interactTarget = findInteractable();
    $("interact-prompt").classList.toggle("hidden", !state.interactTarget);
  }

  function collides(x, y) {
    const r = 0.28;
    const samples = [
      [x - r, y - r],
      [x + r, y - r],
      [x - r, y + r],
      [x + r, y + r],
    ];
    return samples.some(([sx, sy]) => isSolid(getTile(Math.floor(sx), Math.floor(sy))));
  }

  // ——— Render ———
  function resizeCanvas() {
    const wrap = $("game-wrap");
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const scale = Math.max(1, Math.floor(Math.min(w / 320, h / 180)));
    const tw = Math.floor(w / scale);
    const th = Math.floor(h / scale);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      ctx.imageSmoothingEnabled = false;
    }
  }

  function draw() {
    resizeCanvas();
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, w, h);

    const fov = state.settings.fov;
    const tileSize = Math.max(8, Math.floor(Math.min(w, h) / fov));
    const camX = state.player.x;
    const camY = state.player.y;
    const tilesX = Math.ceil(w / tileSize) + 2;
    const tilesY = Math.ceil(h / tileSize) + 2;
    const startX = Math.floor(camX - w / (2 * tileSize));
    const startY = Math.floor(camY - h / (2 * tileSize));

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const wx = startX + tx;
        const wy = startY + ty;
        const tile = getTile(wx, wy);
        const colors = TILE_COLORS[tile] || ["#333", "#444"];
        const px = Math.floor((wx - camX) * tileSize + w / 2);
        const py = Math.floor((wy - camY) * tileSize + h / 2);

        const checker = (wx + wy) & 1;
        ctx.fillStyle = colors[checker];
        ctx.fillRect(px, py, tileSize, tileSize);

        // Pixel details
        if (tile === TILES.WATER) {
          const wave = Math.sin(state.animT * 3 + wx * 0.5 + wy * 0.3) > 0;
          ctx.fillStyle = wave ? "#4a7890" : "#3a6080";
          ctx.fillRect(px + 2, py + tileSize * 0.4, tileSize - 4, 2);
        } else if (tile === TILES.TREE) {
          ctx.fillStyle = "#1a2818";
          ctx.fillRect(px + tileSize * 0.4, py + tileSize * 0.45, tileSize * 0.2, tileSize * 0.55);
          ctx.fillStyle = "#3a6034";
          ctx.fillRect(px + tileSize * 0.15, py + tileSize * 0.1, tileSize * 0.7, tileSize * 0.45);
        } else if (tile === TILES.FLOWER) {
          ctx.fillStyle = "#c97852";
          ctx.fillRect(px + tileSize * 0.4, py + tileSize * 0.35, 3, 3);
        } else if (tile === TILES.QUEST) {
          ctx.fillStyle = "#f0c96a";
          const bob = Math.sin(state.animT * 4) * 2;
          ctx.fillRect(px + tileSize * 0.3, py + tileSize * 0.25 + bob, tileSize * 0.4, tileSize * 0.5);
          ctx.fillStyle = "#1a1612";
          ctx.fillRect(px + tileSize * 0.42, py + tileSize * 0.4 + bob, tileSize * 0.16, tileSize * 0.16);
        } else if (tile === TILES.BOSS) {
          ctx.fillStyle = "#e06a55";
          const pulse = 0.85 + Math.sin(state.animT * 5) * 0.15;
          const s = tileSize * 0.55 * pulse;
          ctx.fillRect(px + (tileSize - s) / 2, py + (tileSize - s) / 2 - 2, s, s);
          ctx.fillStyle = "#1a0908";
          ctx.fillRect(px + tileSize * 0.3, py + tileSize * 0.35, 3, 3);
          ctx.fillRect(px + tileSize * 0.55, py + tileSize * 0.35, 3, 3);
        } else if (tile === TILES.VILLAGE) {
          ctx.fillStyle = "#2a1c14";
          ctx.fillRect(px + 2, py + tileSize * 0.35, tileSize - 4, tileSize * 0.55);
          ctx.fillStyle = "#8a4030";
          ctx.beginPath();
          ctx.moveTo(px + 1, py + tileSize * 0.4);
          ctx.lineTo(px + tileSize / 2, py + 2);
          ctx.lineTo(px + tileSize - 1, py + tileSize * 0.4);
          ctx.fill();
        } else if (tile === TILES.DUNGEON) {
          ctx.fillStyle = "#1a1014";
          ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);
          ctx.fillStyle = "#e06a55";
          ctx.fillRect(px + tileSize * 0.4, py + tileSize * 0.55, tileSize * 0.2, tileSize * 0.3);
        } else if (tile === TILES.RUIN || tile === TILES.WALL) {
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(px, py, 2, tileSize);
          ctx.fillRect(px, py, tileSize, 2);
        }
      }
    }

    // Player
    const ppx = Math.floor(w / 2);
    const ppy = Math.floor(h / 2);
    const ps = Math.max(6, tileSize * 0.55);
    ctx.fillStyle = "#1a1612";
    ctx.fillRect(ppx - ps / 2 + 1, ppy - ps / 2 + 2, ps, ps);
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(ppx - ps / 2, ppy - ps / 2, ps, ps);
    ctx.fillStyle = "#6b8f5a";
    ctx.fillRect(ppx - ps / 2, ppy - ps / 2 + ps * 0.45, ps, ps * 0.55);
    // eyes
    ctx.fillStyle = "#1a1612";
    const lookX = Math.cos(state.player.facing) * 2;
    ctx.fillRect(ppx - 3 + lookX, ppy - ps * 0.15, 2, 2);
    ctx.fillRect(ppx + 1 + lookX, ppy - ps * 0.15, 2, 2);

    // Particles
    state.particles = state.particles.filter((p) => {
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.vy += 0.04;
      p.life -= 0.016;
      if (p.life <= 0) return false;
      const x = Math.floor((p.x - camX) * tileSize + w / 2);
      const y = Math.floor((p.y - camY) * tileSize + h / 2);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, 3, 3);
      ctx.globalAlpha = 1;
      return true;
    });

    // Vignette based on FOV feel
    const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(8,6,4,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    drawMinimap();
  }

  function drawMinimap() {
    if (!state.settings.minimap) {
      $("minimap").classList.add("hidden");
      return;
    }
    $("minimap").classList.remove("hidden");
    const s = 120;
    miniCtx.fillStyle = "#12100e";
    miniCtx.fillRect(0, 0, s, s);
    const range = 40;
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const wx = px + Math.floor((x / s) * range * 2) - range;
        const wy = py + Math.floor((y / s) * range * 2) - range;
        // Sample sparsely for perf — only every 2px drawn via skip
        if ((x + y) % 2) continue;
        const tile = getTile(wx, wy);
        let c = "#3d5c32";
        if (tile === TILES.WATER) c = "#2a4a5c";
        else if (tile === TILES.STONE || tile === TILES.WALL) c = "#5a5650";
        else if (tile === TILES.SAND) c = "#c4a86a";
        else if (tile === TILES.PATH || tile === TILES.FLOOR) c = "#8a7458";
        else if (tile === TILES.QUEST) c = "#f0c96a";
        else if (tile === TILES.BOSS) c = "#e06a55";
        else if (tile === TILES.VILLAGE) c = "#c97852";
        else if (tile === TILES.DUNGEON) c = "#7a4048";
        else if (tile === TILES.TREE) c = "#2a4028";
        miniCtx.fillStyle = c;
        miniCtx.fillRect(x, y, 2, 2);
      }
    }
    miniCtx.fillStyle = "#ffffff";
    miniCtx.fillRect(s / 2 - 2, s / 2 - 2, 4, 4);
  }

  // ——— Loop ———
  let last = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    state.animT += dt;

    if (state.running && !state.paused) {
      updatePlayer(dt);
      updateHUD();
    }
    if (state.running) draw();
    requestAnimationFrame(frame);
  }

  // ——— Game start / quit ———
  function startGame(cfg) {
    state.seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    state.subject = cfg.subject;
    state.difficulty = cfg.difficulty;
    state.playerName = cfg.name || "Scholar";
    state.level = 1;
    state.kp = 0;
    state.questsDone = 0;
    state.bossesDefeated = 0;
    state.inventory = [];
    state.chunks.clear();
    state.structures.clear();
    state.usedQuestions.clear();
    state.particles = [];
    state.spawn = { x: 8.5, y: 8.5 };
    state.checkpoint = { ...state.spawn };
    state.player = { x: 8.5, y: 8.5, vx: 0, vy: 0, facing: 0 };
    state.paused = false;
    state.running = true;
    state.bossFight = null;

    // Generate spawn chunk
    ensureChunk(0, 0);

    $("start-screen").classList.remove("active");
    $("game-screen").classList.add("active");
    updateInventoryUI();
    updateHUD();
    applyMobileVisibility();
    showToast(`Welcome, ${state.playerName}. Seek villages & dungeons.`);
  }

  function quitToMenu() {
    state.running = false;
    state.paused = false;
    closeModal("settings-modal");
    closeModal("inventory-modal");
    closeModal("quest-modal");
    closeModal("boss-modal");
    closeModal("result-modal");
    $("game-screen").classList.remove("active");
    $("start-screen").classList.add("active");
  }

  function applyMobileVisibility() {
    const force = state.settings.forceMobile;
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const narrow = window.innerWidth <= 640;
    $("mobile-controls").classList.toggle("visible", force || coarse || narrow);
  }

  // ——— Events ———
  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("player-name").value.trim() || "Scholar";
    const subject = $("subject-select").value;
    const difficulty = (document.querySelector('input[name="difficulty"]:checked') || {}).value || "easy";
    startGame({ name, subject, difficulty });
  });

  window.addEventListener("keydown", (e) => {
    state.keys[e.key] = true;
    if (e.key === "e" || e.key === "E") {
      e.preventDefault();
      tryInteract();
    }
    if (e.key === "i" || e.key === "I") {
      if (!state.running) return;
      if (!$("inventory-modal").classList.contains("hidden")) closeModal("inventory-modal");
      else {
        updateInventoryUI();
        openModal("inventory-modal");
      }
    }
    if (e.key === "Escape") {
      if (!$("quest-modal").classList.contains("hidden")) return;
      if (!$("boss-modal").classList.contains("hidden")) return;
      if (!$("result-modal").classList.contains("hidden")) return;
      if (!state.running) return;
      if (!$("settings-modal").classList.contains("hidden")) {
        closeModal("settings-modal");
        state.paused = false;
      } else {
        openModal("settings-modal");
        state.paused = true;
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    state.keys[e.key] = false;
  });

  $("btn-settings").addEventListener("click", () => {
    openModal("settings-modal");
    state.paused = true;
  });
  $("btn-inventory").addEventListener("click", () => {
    updateInventoryUI();
    openModal("inventory-modal");
  });
  $("btn-resume").addEventListener("click", () => {
    closeModal("settings-modal");
    state.paused = false;
  });
  $("btn-quit").addEventListener("click", quitToMenu);

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal(btn.getAttribute("data-close"));
      if (btn.getAttribute("data-close") === "settings-modal") state.paused = false;
    });
  });

  // Settings bindings
  const bindRange = (id, key, labelId, fmt) => {
    const el = $(id);
    el.addEventListener("input", () => {
      const v = parseFloat(el.value);
      state.settings[key] = v;
      if (labelId) $(labelId).textContent = fmt ? fmt(v) : String(v);
    });
  };
  bindRange("setting-fov", "fov", "fov-value");
  bindRange("setting-render", "renderDist", "render-value");
  bindRange("setting-speed", "speed", "speed-value", (v) => v.toFixed(1));

  $("setting-minimap").addEventListener("change", (e) => {
    state.settings.minimap = e.target.checked;
  });
  $("setting-particles").addEventListener("change", (e) => {
    state.settings.particles = e.target.checked;
  });
  $("setting-mobile").addEventListener("change", (e) => {
    state.settings.forceMobile = e.target.checked;
    applyMobileVisibility();
  });

  // Mobile d-pad
  const setDir = (dir, down) => {
    const map = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
    state.keys[map[dir]] = down;
  };
  document.querySelectorAll(".pad-btn").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const on = (e) => {
      e.preventDefault();
      setDir(dir, true);
    };
    const off = (e) => {
      e.preventDefault();
      setDir(dir, false);
    };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  });
  $("btn-interact").addEventListener("click", (e) => {
    e.preventDefault();
    tryInteract();
  });

  // Tap canvas to interact when near target
  canvas.addEventListener("click", () => {
    if (state.interactTarget) tryInteract();
  });

  window.addEventListener("resize", () => {
    applyMobileVisibility();
    resizeCanvas();
  });

  // Boot
  applyMobileVisibility();
  requestAnimationFrame(frame);
})();
