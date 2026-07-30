/**
 * Ruin Scholar — Gamified Study Companion
 * Grade + textbook study quests, equippable loot, infinite ruin world.
 */
(() => {
  "use strict";

  const CHUNK = 16;

  const TILES = {
    GRASS: 0, DIRT: 1, STONE: 2, RUIN: 3, WATER: 4, SAND: 5, PATH: 6,
    WALL: 7, FLOOR: 8, VILLAGE: 9, DUNGEON: 10, QUEST: 11, BOSS: 12,
    TREE: 13, FLOWER: 14, ROOF: 15, DOOR: 16, FENCE: 17, LAVA: 18,
    TORCH: 19, BANNER: 20, COBBLE: 21, MOSS: 22,
  };

  const BIOME_NAMES = {
    plains: "Grassland Ruins",
    forest: "Mosswood Expanse",
    desert: "Sunken Sands",
    mountain: "Crag of Echoes",
    swamp: "Mire of Whispers",
  };

  const DIFFICULTY = {
    easy:   { label: "Easy",   questTier: 0, bossOffset: 0, lootFloor: 0, lootCeil: 2, lootCount: 1 },
    medium: { label: "Medium", questTier: 1, bossOffset: 1, lootFloor: 1, lootCeil: 3, lootCount: 1 },
    hard:   { label: "Hard",   questTier: 2, bossOffset: 2, lootFloor: 2, lootCeil: 4, lootCount: 2 },
    raid:   { label: "Raid",   questTier: 3, bossOffset: 3, lootFloor: 3, lootCeil: 4, lootCount: 3 },
  };

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

  // Equippable loot table — slot: weapon | armor | tool | book
  const LOOT_TABLE = [
    { key: "wood_blade", name: "Wood Practice Blade", slot: "weapon", rarity: "common", pwr: 1, def: 0, know: 0 },
    { key: "slate_chalk", name: "Slate & Chalk", slot: "tool", rarity: "common", pwr: 0, def: 0, know: 1 },
    { key: "linen_cloak", name: "Linen Cloak", slot: "armor", rarity: "common", pwr: 0, def: 1, know: 0 },
    { key: "primer", name: "Pocket Primer", slot: "book", rarity: "common", pwr: 0, def: 0, know: 2 },
    { key: "iron_quill", name: "Iron Quill Blade", slot: "weapon", rarity: "uncommon", pwr: 3, def: 0, know: 1 },
    { key: "leather_vest", name: "Scholar's Leather", slot: "armor", rarity: "uncommon", pwr: 0, def: 3, know: 0 },
    { key: "compass", name: "Ruin Compass", slot: "tool", rarity: "uncommon", pwr: 1, def: 0, know: 2 },
    { key: "field_notes", name: "Field Notes", slot: "book", rarity: "uncommon", pwr: 0, def: 0, know: 4 },
    { key: "bronze_saber", name: "Bronze Saber", slot: "weapon", rarity: "rare", pwr: 5, def: 1, know: 0 },
    { key: "chain_hood", name: "Chain Hood", slot: "armor", rarity: "rare", pwr: 0, def: 5, know: 1 },
    { key: "pick_lens", name: "Crystal Pick-Lens", slot: "tool", rarity: "rare", pwr: 3, def: 0, know: 3 },
    { key: "annotated", name: "Annotated Codex", slot: "book", rarity: "rare", pwr: 1, def: 0, know: 6 },
    { key: "runed_edge", name: "Runed Edge", slot: "weapon", rarity: "epic", pwr: 8, def: 2, know: 2 },
    { key: "guardian_plate", name: "Guardian Plate", slot: "armor", rarity: "epic", pwr: 1, def: 9, know: 1 },
    { key: "aether_hammer", name: "Aether Hammer", slot: "tool", rarity: "epic", pwr: 6, def: 1, know: 4 },
    { key: "elder_tome", name: "Elder Tome", slot: "book", rarity: "epic", pwr: 2, def: 1, know: 10 },
    { key: "eclipse_blade", name: "Eclipse Blade", slot: "weapon", rarity: "legendary", pwr: 12, def: 3, know: 3 },
    { key: "starfall_mail", name: "Starfall Mail", slot: "armor", rarity: "legendary", pwr: 2, def: 14, know: 2 },
    { key: "world_spade", name: "Worldspade", slot: "tool", rarity: "legendary", pwr: 9, def: 2, know: 6 },
    { key: "codex_eternity", name: "Codex of Eternity", slot: "book", rarity: "legendary", pwr: 4, def: 2, know: 16 },
  ];

  // Textbooks by subject — filtered by grade range
  const BOOKS = {
    math: [
      { id: "math_basics", title: "Math Basics Workbook", grades: [3, 4, 5], topics: "addition, subtraction, place value, shapes" },
      { id: "math_path", title: "Math Pathways", grades: [4, 5, 6], topics: "fractions, decimals, perimeter, area" },
      { id: "pre_algebra", title: "Pre-Algebra Explorer", grades: [6, 7, 8], topics: "ratios, integers, expressions, equations" },
      { id: "algebra1", title: "Algebra I Essentials", grades: [8, 9, 10], topics: "linear equations, functions, polynomials" },
      { id: "geometry", title: "Geometry Connections", grades: [9, 10, 11], topics: "angles, triangles, proofs, circles" },
      { id: "algebra2", title: "Algebra II & Beyond", grades: [10, 11, 12], topics: "quadratics, logs, sequences, trig intro" },
      { id: "precalc", title: "Precalculus Mastery", grades: [11, 12], topics: "functions, limits intro, trig identities" },
    ],
    science: [
      { id: "sci_world", title: "Our Science World", grades: [3, 4, 5], topics: "animals, plants, weather, matter" },
      { id: "sci_explore", title: "Science Explorers", grades: [5, 6, 7], topics: "cells, ecosystems, energy, Earth" },
      { id: "life_sci", title: "Life Science Today", grades: [6, 7, 8], topics: "cells, genetics basics, body systems" },
      { id: "phys_sci", title: "Physical Science Lab", grades: [8, 9, 10], topics: "forces, atoms, reactions, waves" },
      { id: "bio", title: "Biology Foundations", grades: [9, 10, 11], topics: "DNA, evolution, ecology, cells" },
      { id: "chem", title: "Chemistry in Action", grades: [10, 11, 12], topics: "periodic table, bonding, moles, reactions" },
      { id: "physics", title: "Physics Principles", grades: [11, 12], topics: "motion, energy, electricity, modern physics" },
    ],
    history: [
      { id: "hist_kids", title: "Stories of Long Ago", grades: [3, 4, 5], topics: "communities, explorers, early civilizations" },
      { id: "world_begin", title: "World History Beginnings", grades: [5, 6, 7], topics: "Egypt, Greece, Rome, Middle Ages intro" },
      { id: "us_journey", title: "US History Journey", grades: [6, 7, 8], topics: "colonies, Revolution, Civil War, rights" },
      { id: "world_ages", title: "Ages of the World", grades: [8, 9, 10], topics: "Renaissance, revolutions, industry, empires" },
      { id: "modern_world", title: "The Modern World", grades: [9, 10, 11], topics: "WWI, WWII, Cold War, globalization" },
      { id: "gov_civ", title: "Government & Civics", grades: [10, 11, 12], topics: "constitutions, rights, diplomacy, law" },
      { id: "ap_world", title: "Advanced World Themes", grades: [11, 12], topics: "trade networks, revolutions, ideologies" },
    ],
    english: [
      { id: "read_grow", title: "Reading & Growing", grades: [3, 4, 5], topics: "vocabulary, main idea, simple stories" },
      { id: "lang_arts", title: "Language Arts Workshop", grades: [5, 6, 7], topics: "grammar, paragraphs, figurative language" },
      { id: "lit_bridge", title: "Literature Bridge", grades: [7, 8, 9], topics: "short stories, poetry, theme, character" },
      { id: "comp_rhetoric", title: "Composition & Rhetoric", grades: [8, 9, 10], topics: "essays, argument, tone, structure" },
      { id: "brit_lit", title: "British Literature", grades: [9, 10, 11], topics: "Shakespeare, poetry forms, novels" },
      { id: "amer_lit", title: "American Literature", grades: [10, 11, 12], topics: "American voices, realism, modernism" },
      { id: "ap_lit", title: "Advanced Literary Analysis", grades: [11, 12], topics: "close reading, tragedy, intertextuality" },
    ],
    geography: [
      { id: "map_skills", title: "Map Skills for Kids", grades: [3, 4, 5], topics: "continents, oceans, maps, climate basics" },
      { id: "earth_home", title: "Earth Our Home", grades: [5, 6, 7], topics: "landforms, water cycle, regions, culture" },
      { id: "world_geo", title: "World Geography", grades: [6, 7, 8], topics: "countries, capitals, biomes, population" },
      { id: "phys_geo", title: "Physical Geography", grades: [8, 9, 10], topics: "plates, erosion, weather systems, soils" },
      { id: "human_geo", title: "Human Geography", grades: [9, 10, 11], topics: "cities, migration, economy, culture" },
      { id: "env_sys", title: "Environmental Systems", grades: [10, 11, 12], topics: "climate, resources, sustainability" },
      { id: "adv_geo", title: "Advanced Earth Systems", grades: [11, 12], topics: "atmosphere, hydrology, geospatial ideas" },
    ],
  };

  // Questions tagged with gradeMin/gradeMax and subject
  const QUESTIONS = {
    math: [
      { q: "What is 7 + 5?", a: ["10", "12", "13", "11"], c: 1, g: [3, 5] },
      { q: "What is 9 × 3?", a: ["27", "21", "36", "18"], c: 0, g: [3, 5] },
      { q: "How many sides does a triangle have?", a: ["2", "3", "4", "5"], c: 1, g: [3, 5] },
      { q: "What is 100 − 37?", a: ["73", "63", "67", "77"], c: 0, g: [3, 6] },
      { q: "What is 1/2 of 16?", a: ["4", "6", "8", "10"], c: 2, g: [4, 6] },
      { q: "Perimeter of a square with side 6?", a: ["12", "24", "36", "18"], c: 1, g: [4, 7] },
      { q: "Convert 3/4 to a decimal.", a: ["0.25", "0.5", "0.75", "0.34"], c: 2, g: [5, 8] },
      { q: "What is 15% of 200?", a: ["20", "25", "30", "35"], c: 2, g: [6, 9] },
      { q: "If x + 5 = 12, what is x?", a: ["5", "6", "7", "17"], c: 2, g: [6, 9] },
      { q: "What is 2³?", a: ["6", "8", "9", "4"], c: 1, g: [6, 9] },
      { q: "Area of a rectangle 4 × 9?", a: ["13", "26", "36", "40"], c: 2, g: [5, 8] },
      { q: "Mean of 4, 6, 10, 12?", a: ["7", "8", "9", "10"], c: 1, g: [7, 10] },
      { q: "Solve: 3(x − 2) = 15", a: ["5", "7", "9", "3"], c: 1, g: [7, 10] },
      { q: "Hypotenuse of a 3-4-? right triangle?", a: ["5", "6", "7", "4"], c: 0, g: [8, 11] },
      { q: "Factor: x² − 9", a: ["(x−3)²", "(x−9)(x+1)", "(x−3)(x+3)", "x(x−9)"], c: 2, g: [8, 11] },
      { q: "Slope of the line through (0,0) and (2,6)?", a: ["2", "3", "4", "6"], c: 1, g: [8, 11] },
      { q: "What is sin(90°)?", a: ["0", "0.5", "1", "√2/2"], c: 2, g: [9, 12] },
      { q: "Quadratic discriminant is…?", a: ["b²−4ac", "b²+4ac", "2b−4ac", "a²−4bc"], c: 0, g: [9, 12] },
      { q: "Derivative of x²?", a: ["x", "2x", "x²", "2"], c: 1, g: [11, 12] },
      { q: "log₁₀(1000) = ?", a: ["2", "3", "4", "10"], c: 1, g: [10, 12] },
      { q: "lim(x→0) (sin x)/x = ?", a: ["0", "∞", "1", "undefined"], c: 2, g: [11, 12] },
      { q: "Integral of 2x dx?", a: ["x² + C", "2x² + C", "x + C", "2 + C"], c: 0, g: [11, 12] },
    ],
    science: [
      { q: "What do plants need to make food?", a: ["Moonlight", "Sunlight", "Sand", "Plastic"], c: 1, g: [3, 5] },
      { q: "Water freezes at what °C?", a: ["0°C", "32°C", "100°C", "−10°C"], c: 0, g: [3, 6] },
      { q: "Which planet is the Red Planet?", a: ["Venus", "Mars", "Jupiter", "Mercury"], c: 1, g: [3, 6] },
      { q: "What is H₂O?", a: ["Salt", "Water", "Hydrogen", "Ozone"], c: 1, g: [4, 7] },
      { q: "Gas plants absorb for photosynthesis?", a: ["Oxygen", "Nitrogen", "CO₂", "Helium"], c: 2, g: [5, 8] },
      { q: "Adult human body has about how many bones?", a: ["106", "206", "306", "156"], c: 1, g: [5, 8] },
      { q: "Force equals mass times…?", a: ["velocity", "acceleration", "distance", "time"], c: 1, g: [7, 10] },
      { q: "Organelle that makes energy?", a: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"], c: 2, g: [7, 10] },
      { q: "Atomic number of carbon?", a: ["4", "6", "8", "12"], c: 1, g: [8, 11] },
      { q: "pH of a neutral solution?", a: ["0", "7", "14", "1"], c: 1, g: [8, 11] },
      { q: "DNA stands for…?", a: ["Deoxyribonucleic acid", "Dinucleic acid", "Dual nucleic acid", "Deoxynitric acid"], c: 0, g: [8, 12] },
      { q: "Particle with negative charge?", a: ["Proton", "Neutron", "Electron", "Photon"], c: 2, g: [8, 11] },
      { q: "Rock formed from cooled magma?", a: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], c: 2, g: [6, 9] },
      { q: "Speed of light in vacuum (approx)?", a: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁵ km/h", "340 m/s"], c: 0, g: [9, 12] },
      { q: "Avogadro’s number ≈ ?", a: ["6.02×10²³", "3.14×10⁸", "9.8×10¹", "1.6×10⁻¹⁹"], c: 0, g: [10, 12] },
      { q: "E = mc² relates energy to…?", a: ["momentum", "mass & light speed", "charge", "frequency"], c: 1, g: [10, 12] },
      { q: "CRISPR is used for…?", a: ["Weather", "Gene editing", "Fusion", "Optics"], c: 1, g: [11, 12] },
      { q: "Entropy in a closed system tends to…?", a: ["Decrease", "Stay fixed", "Increase", "Oscillate"], c: 2, g: [11, 12] },
    ],
    history: [
      { q: "First US President?", a: ["Jefferson", "Washington", "Lincoln", "Adams"], c: 1, g: [3, 6] },
      { q: "Egypt’s writing system?", a: ["Cuneiform", "Hieroglyphics", "Latin", "Runes"], c: 1, g: [4, 7] },
      { q: "Great Wall country?", a: ["Japan", "India", "China", "Mongolia"], c: 2, g: [4, 7] },
      { q: "Who painted the Mona Lisa?", a: ["Michelangelo", "Da Vinci", "Raphael", "Rembrandt"], c: 1, g: [5, 8] },
      { q: "WWII ended in Europe in…?", a: ["1943", "1944", "1945", "1946"], c: 2, g: [6, 9] },
      { q: "Renaissance began in…?", a: ["France", "England", "Italy", "Spain"], c: 2, g: [6, 9] },
      { q: "Magna Carta year?", a: ["1066", "1215", "1492", "1776"], c: 1, g: [7, 10] },
      { q: "Industrial Revolution began in…?", a: ["USA", "Germany", "Britain", "France"], c: 2, g: [7, 10] },
      { q: "Cold War mainly between…?", a: ["UK & France", "USA & USSR", "China & Japan", "Germany & Italy"], c: 1, g: [8, 11] },
      { q: "Primary draft of Declaration of Independence?", a: ["Franklin", "Jefferson", "Madison", "Hamilton"], c: 1, g: [8, 11] },
      { q: "Berlin Wall fell in…?", a: ["1985", "1989", "1991", "1979"], c: 1, g: [8, 12] },
      { q: "Meiji Restoration modernized…?", a: ["Korea", "China", "Japan", "Vietnam"], c: 2, g: [9, 12] },
      { q: "Treaty of Westphalia ended…?", a: ["Hundred Years'", "Thirty Years'", "Seven Years'", "Napoleonic"], c: 1, g: [10, 12] },
      { q: "Rosetta Stone unlocked…?", a: ["Sumerian", "Ancient Egyptian", "Mayan", "Sanskrit"], c: 1, g: [9, 12] },
      { q: "Achaemenid Empire founded by…?", a: ["Darius I", "Cyrus the Great", "Xerxes", "Alexander"], c: 1, g: [10, 12] },
      { q: "Delian League led by…?", a: ["Sparta", "Athens", "Corinth", "Thebes"], c: 1, g: [11, 12] },
    ],
    english: [
      { q: "A noun is a…?", a: ["Action word", "Person, place, or thing", "Describing word", "Connecting word"], c: 1, g: [3, 5] },
      { q: "Synonym of happy?", a: ["Sad", "Joyful", "Angry", "Tired"], c: 1, g: [3, 5] },
      { q: "Past tense of run?", a: ["Runned", "Ran", "Running", "Runs"], c: 1, g: [3, 6] },
      { q: "An adjective describes a…?", a: ["Verb only", "Noun", "Preposition", "Conjunction"], c: 1, g: [4, 7] },
      { q: "Who wrote Romeo and Juliet?", a: ["Dickens", "Shakespeare", "Austen", "Twain"], c: 1, g: [6, 10] },
      { q: "A metaphor is…?", a: ["Comparison with like/as", "Direct comparison without like/as", "Exaggeration", "Sound word"], c: 1, g: [6, 9] },
      { q: "Plural of child?", a: ["Childs", "Children", "Childrens", "Childer"], c: 1, g: [4, 7] },
      { q: "Alliteration repeats…?", a: ["Vowels only", "Initial consonant sounds", "Syllables", "Rhymes"], c: 1, g: [6, 9] },
      { q: "A protagonist is the…?", a: ["Villain", "Main character", "Narrator always", "Setting"], c: 1, g: [6, 9] },
      { q: "Who wrote Pride and Prejudice?", a: ["Brontë", "Austen", "Woolf", "Eliot"], c: 1, g: [8, 11] },
      { q: "A sonnet has how many lines?", a: ["10", "12", "14", "16"], c: 2, g: [8, 12] },
      { q: "Who wrote 1984?", a: ["Huxley", "Orwell", "Bradbury", "Atwood"], c: 1, g: [9, 12] },
      { q: "Dramatic irony means…?", a: ["Audience knows more than characters", "Opposite happens", "Sarcasm", "Pun"], c: 0, g: [9, 12] },
      { q: "Who wrote The Canterbury Tales?", a: ["Milton", "Chaucer", "Spenser", "Marlowe"], c: 1, g: [10, 12] },
      { q: "A bildungsroman focuses on…?", a: ["War", "Coming of age", "Detective work", "Travel only"], c: 1, g: [10, 12] },
      { q: "Hamartia means…?", a: ["Comic relief", "Tragic flaw", "Chorus", "Deus ex machina"], c: 1, g: [11, 12] },
      { q: "Anaphora is repetition at the…?", a: ["End of clauses", "Beginning of successive clauses", "Middle of words", "Rhyme"], c: 1, g: [11, 12] },
    ],
    geography: [
      { q: "Largest ocean?", a: ["Atlantic", "Indian", "Pacific", "Arctic"], c: 2, g: [3, 6] },
      { q: "Capital of France?", a: ["Lyon", "Paris", "Marseille", "Nice"], c: 1, g: [3, 6] },
      { q: "Egypt is mostly on which continent?", a: ["Asia", "Europe", "Africa", "Australia"], c: 2, g: [3, 6] },
      { q: "Amazon River is mainly in…?", a: ["Africa", "South America", "Asia", "Australia"], c: 1, g: [4, 7] },
      { q: "Equator divides…?", a: ["East & West", "North & South", "Land & sea", "Day & night"], c: 1, g: [4, 7] },
      { q: "Capital of Japan?", a: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], c: 2, g: [5, 8] },
      { q: "Sahara is primarily in…?", a: ["South America", "Africa", "Australia", "Asia"], c: 1, g: [5, 8] },
      { q: "Ring of Fire relates to…?", a: ["Tornadoes", "Earthquakes & volcanoes", "Hurricanes only", "Deserts"], c: 1, g: [6, 9] },
      { q: "Longitude measures…?", a: ["North-South", "East-West", "Altitude", "Depth"], c: 1, g: [7, 10] },
      { q: "Everest borders Nepal and…?", a: ["India", "China", "Bhutan", "Pakistan"], c: 1, g: [6, 9] },
      { q: "Largest desert including cold deserts?", a: ["Sahara", "Gobi", "Antarctic", "Arabian"], c: 2, g: [8, 11] },
      { q: "Strait of Gibraltar separates Europe from…?", a: ["Asia", "Africa", "America", "Australia"], c: 1, g: [8, 11] },
      { q: "Plate tectonics explains…?", a: ["Tides only", "Continental drift & quakes", "Seasons", "Magnetism only"], c: 1, g: [8, 12] },
      { q: "Köppen classification describes…?", a: ["Soils", "Climate zones", "Currents", "Languages"], c: 1, g: [9, 12] },
      { q: "Orographic rain is caused by…?", a: ["Mountains lifting air", "Tides", "Solar flares", "City heat"], c: 0, g: [10, 12] },
      { q: "Hadley cells are part of…?", a: ["Ocean trenches", "Atmospheric circulation", "Faults", "Glaciers"], c: 1, g: [11, 12] },
      { q: "Milankovitch cycles relate to…?", a: ["Tides", "Orbital climate changes", "Volcanoes only", "Magnetosphere"], c: 1, g: [11, 12] },
    ],
  };

  const state = {
    running: false,
    paused: false,
    seed: (Date.now() ^ 0x9e3779b9) >>> 0,
    subject: "math",
    grade: 8,
    bookId: "",
    bookTitle: "",
    difficulty: "easy",
    playerName: "Scholar",
    level: 1,
    kp: 0,
    questsDone: 0,
    bossesDefeated: 0,
    inventory: [],
    equipped: { weapon: null, armor: null, tool: null, book: null },
    spawn: { x: 8.5, y: 8.5 },
    checkpoint: { x: 8.5, y: 8.5 },
    player: { x: 8.5, y: 8.5, facing: 0 },
    keys: Object.create(null),
    settings: { fov: 11, renderDist: 6, speed: 1, minimap: true, particles: true, forceMobile: false },
    chunks: new Map(),
    structures: new Map(),
    interactTarget: null,
    particles: [],
    usedQuestions: new Set(),
    bossFight: null,
    animT: 0,
  };

  const $ = (id) => document.getElementById(id);
  const canvas = $("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const miniCanvas = $("minimap-canvas");
  const miniCtx = miniCanvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  miniCtx.imageSmoothingEnabled = false;

  // ——— Books UI ———
  function booksFor(subject, grade) {
    return (BOOKS[subject] || []).filter((b) => b.grades.includes(grade));
  }

  function refreshBookSelect() {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const sel = $("book-select");
    const list = booksFor(subject, grade);
    sel.innerHTML = "";
    if (!list.length) {
      const opt = document.createElement("option");
      opt.value = "generic";
      opt.textContent = "General Study Guide";
      sel.appendChild(opt);
      $("book-hint").textContent = "No specific textbook listed — using general grade-level topics.";
      return;
    }
    list.forEach((b, i) => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.title;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
    const first = list[0];
    $("book-hint").textContent = `Topics: ${first.topics}. Matched to Grade ${grade}.`;
  }

  function onBookChange() {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const book = booksFor(subject, grade).find((b) => b.id === $("book-select").value);
    if (book) $("book-hint").textContent = `Topics: ${book.topics}. Matched to Grade ${grade}.`;
  }

  // ——— RNG / world ———
  function hash2(x, y, seed = state.seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function smoothNoise(x, y, scale = 1) {
    const sx = x / scale, sy = y / scale;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const fx = sx - x0, fy = sy - y0;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash2(x0, y0), b = hash2(x0 + 1, y0), c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm(x, y) {
    return smoothNoise(x, y, 48) * 0.5 + smoothNoise(x, y, 24) * 0.28 + smoothNoise(x, y, 12) * 0.14 + smoothNoise(x, y, 6) * 0.08;
  }

  function chunkKey(cx, cy) { return `${cx},${cy}`; }
  function worldToChunk(wx, wy) { return { cx: Math.floor(wx / CHUNK), cy: Math.floor(wy / CHUNK) }; }

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
      return detail < 0.2 ? TILES.MOSS : TILES.DIRT;
    }
    if (biome === "desert") return n < 0.28 ? TILES.STONE : TILES.SAND;
    if (biome === "mountain") {
      if (n > 0.78) return TILES.WALL;
      if (n > 0.62) return TILES.STONE;
      return TILES.COBBLE;
    }
    if (biome === "forest") {
      if (detail < 0.14) return TILES.TREE;
      if (detail < 0.2) return TILES.FLOWER;
      return TILES.GRASS;
    }
    if (detail < 0.04) return TILES.RUIN;
    if (detail < 0.07) return TILES.FLOWER;
    if (n < 0.3) return TILES.DIRT;
    return TILES.GRASS;
  }

  function isSolid(tile) {
    return [TILES.WATER, TILES.WALL, TILES.TREE, TILES.LAVA, TILES.ROOF, TILES.FENCE].includes(tile);
  }

  function ensureChunk(cx, cy) {
    const key = chunkKey(cx, cy);
    if (state.chunks.has(key)) return state.chunks.get(key);

    const tiles = new Uint8Array(CHUNK * CHUNK);
    for (let ly = 0; ly < CHUNK; ly++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        tiles[ly * CHUNK + lx] = baseTile(cx * CHUNK + lx, cy * CHUNK + ly);
      }
    }

    const dist = Math.abs(cx) + Math.abs(cy);
    const r = hash2(cx, cy, state.seed ^ 0xabc);
    const r2 = hash2(cx + 7, cy - 3, state.seed ^ 0xdef);

    if (r > 0.91 && dist > 1) placeVillage(tiles, cx, cy);
    else if (r2 > 0.925 && dist > 2) placeDungeon(tiles, cx, cy);
    else if (r > 0.76 && r < 0.84) {
      const lx = 4 + Math.floor(hash2(cx, cy, 11) * 8);
      const ly = 4 + Math.floor(hash2(cx, cy, 22) * 8);
      tiles[ly * CHUNK + lx] = TILES.QUEST;
      const wx = cx * CHUNK + lx, wy = cy * CHUNK + ly;
      registerStructure(wx, wy, "quest", randomQuestName(wx, wy), questRank(dist));
    }

    if (cx === 0 && cy === 0) {
      for (let ly = 6; ly <= 9; ly++) for (let lx = 6; lx <= 9; lx++) tiles[ly * CHUNK + lx] = TILES.PATH;
    }

    const chunk = { cx, cy, tiles };
    state.chunks.set(key, chunk);
    return chunk;
  }

  function questRank(dist) {
    if (dist > 18) return 3;
    if (dist > 10) return 2;
    if (dist > 4) return 1;
    return 0;
  }

  function rankLabel(r) { return ["C", "B", "A", "S"][Math.max(0, Math.min(3, r))] || "C"; }

  function registerStructure(wx, wy, type, name, rank, extra = {}) {
    state.structures.set(`${wx},${wy}`, { type, wx, wy, done: false, name, rank, ...extra });
  }

  function randomQuestName(wx, wy) {
    const names = ["Village Elder", "Wandering Monk", "Ruined Scholar", "Moss Oracle", "Stone Scribe", "Lantern Keeper", "Archive Ghost", "Trial Pedestal"];
    return names[Math.floor(hash2(wx, wy, 99) * names.length)];
  }

  function dungeonName(cx, cy) {
    const a = ["Hollow", "Ashen", "Forgotten", "Sunken", "Crimson", "Silent", "Obsidian", "Bone"];
    const b = ["Crypt", "Keep", "Catacomb", "Sanctum", "Vault", "Spire", "Pit", "Forge"];
    return `${a[Math.floor(hash2(cx, cy, 1) * a.length)]} ${b[Math.floor(hash2(cx, cy, 2) * b.length)]}`;
  }

  /** Warm cottages, fences, banners — clearly a village */
  function placeVillage(tiles, cx, cy) {
    const ox = 2, oy = 2;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        if (x === 0 || y === 0 || x === 11 || y === 11) tiles[i] = TILES.FENCE;
        else tiles[i] = TILES.PATH;
      }
    }
    // gate openings
    tiles[(oy + 11) * CHUNK + (ox + 5)] = TILES.PATH;
    tiles[(oy + 11) * CHUNK + (ox + 6)] = TILES.PATH;
    tiles[(oy + 0) * CHUNK + (ox + 5)] = TILES.BANNER;
    tiles[(oy + 0) * CHUNK + (ox + 6)] = TILES.BANNER;

    // three cottages with roofs + doors
    const houses = [[3, 3], [7, 3], [5, 7]];
    houses.forEach(([hx, hy]) => {
      tiles[(oy + hy) * CHUNK + (ox + hx)] = TILES.ROOF;
      tiles[(oy + hy) * CHUNK + (ox + hx + 1)] = TILES.ROOF;
      tiles[(oy + hy + 1) * CHUNK + (ox + hx)] = TILES.VILLAGE;
      tiles[(oy + hy + 1) * CHUNK + (ox + hx + 1)] = TILES.DOOR;
    });

    const qx = ox + 5, qy = oy + 5;
    tiles[qy * CHUNK + qx] = TILES.QUEST;
    const dist = Math.abs(cx) + Math.abs(cy);
    registerStructure(cx * CHUNK + qx, cy * CHUNK + qy, "quest", "Village Trial", questRank(dist), { village: true });
  }

  /** Dark crypt with lava moat, torches, boss — clearly a dungeon */
  function placeDungeon(tiles, cx, cy) {
    const ox = 1, oy = 1;
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 14; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        const edge = x === 0 || y === 0 || x === 13 || y === 13;
        const moat = x === 1 || y === 1 || x === 12 || y === 12;
        if (edge) tiles[i] = TILES.WALL;
        else if (moat && !(y === 13 || y === 12)) tiles[i] = TILES.LAVA;
        else tiles[i] = TILES.FLOOR;
      }
    }
    // entrance bridge
    for (let y = 11; y <= 13; y++) {
      tiles[(oy + y) * CHUNK + (ox + 6)] = TILES.COBBLE;
      tiles[(oy + y) * CHUNK + (ox + 7)] = TILES.COBBLE;
    }
    // torches & pillars
    [[3, 3], [10, 3], [3, 10], [10, 10]].forEach(([px, py]) => {
      tiles[(oy + py) * CHUNK + (ox + px)] = TILES.RUIN;
      tiles[(oy + py - 1) * CHUNK + (ox + px)] = TILES.TORCH;
    });
    tiles[(oy + 2) * CHUNK + (ox + 6)] = TILES.DUNGEON;
    tiles[(oy + 2) * CHUNK + (ox + 7)] = TILES.DUNGEON;

    const bx = ox + 6, by = oy + 6;
    tiles[by * CHUNK + bx] = TILES.BOSS;
    tiles[by * CHUNK + (bx + 1)] = TILES.BOSS;
    const dist = Math.abs(cx) + Math.abs(cy);
    const rank = Math.min(3, questRank(dist) + 1);
    registerStructure(cx * CHUNK + bx, cy * CHUNK + by, "boss", dungeonName(cx, cy), rank, {
      level: 1 + Math.floor(dist / 4),
    });
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

  // ——— Questions ———
  function gradeTierBoost() {
    // map grade 3–12 roughly onto question stretch with difficulty
    return DIFFICULTY[state.difficulty].questTier;
  }

  function pickQuestion(extraTier = 0) {
    const pool = QUESTIONS[state.subject] || QUESTIONS.math;
    const g = state.grade;
    let eligible = pool.filter((q) => g >= q.g[0] && g <= q.g[1]);
    if (!eligible.length) eligible = pool.filter((q) => Math.abs(((q.g[0] + q.g[1]) / 2) - g) <= 3);
    if (!eligible.length) eligible = pool.slice();

    // Prefer unused
    let unused = eligible.filter((q) => !state.usedQuestions.has(q.q));
    if (!unused.length) {
      eligible.forEach((q) => state.usedQuestions.delete(q.q));
      unused = eligible;
    }

    // Slight bias toward harder end of band when extraTier / raid
    if (extraTier > 0 || state.difficulty === "hard" || state.difficulty === "raid") {
      unused.sort((a, b) => b.g[1] - a.g[1]);
      const top = unused.slice(0, Math.max(3, Math.ceil(unused.length * 0.6)));
      const q = top[Math.floor(Math.random() * top.length)];
      state.usedQuestions.add(q.q);
      return q;
    }
    const q = unused[Math.floor(Math.random() * unused.length)];
    state.usedQuestions.add(q.q);
    return q;
  }

  // ——— Loot / equip ———
  function gearStats() {
    let def = 0, pwr = 0, know = 0;
    for (const slot of Object.keys(state.equipped)) {
      const it = state.equipped[slot];
      if (!it) continue;
      def += it.def || 0;
      pwr += it.pwr || 0;
      know += it.know || 0;
    }
    return { def, pwr, know };
  }

  function grantLoot({ count = 1, rank = 0, boss = false } = {}) {
    const diff = DIFFICULTY[state.difficulty];
    const gained = [];
    // Higher rank / difficulty / boss → better rarity floor
    const floor = Math.min(4, diff.lootFloor + rank + (boss ? 1 : 0));
    const ceil = Math.min(4, Math.max(floor, diff.lootCeil + (boss ? 1 : 0)));

    for (let i = 0; i < count; i++) {
      const rarityIdx = floor + Math.floor(Math.random() * (ceil - floor + 1));
      const rarity = RARITY_ORDER[rarityIdx];
      const options = LOOT_TABLE.filter((l) => l.rarity === rarity);
      const base = options[Math.floor(Math.random() * options.length)] || LOOT_TABLE[0];
      const item = {
        ...base,
        uid: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        fromRank: rank,
      };
      state.inventory.push(item);
      gained.push(item);
    }
    updateInventoryUI();
    return gained;
  }

  function clearInventoryAndGear() {
    state.inventory = [];
    state.equipped = { weapon: null, armor: null, tool: null, book: null };
    updateInventoryUI();
    updateEquipUI();
  }

  function equipItem(uid) {
    const idx = state.inventory.findIndex((i) => i.uid === uid);
    if (idx < 0) return;
    const item = state.inventory[idx];
    const slot = item.slot;
    const prev = state.equipped[slot];
    state.inventory.splice(idx, 1);
    if (prev) state.inventory.push(prev);
    state.equipped[slot] = item;
    updateInventoryUI();
    updateEquipUI();
    showToast(`Equipped ${item.name}`);
  }

  function unequipSlot(slot) {
    const item = state.equipped[slot];
    if (!item) return;
    state.equipped[slot] = null;
    state.inventory.push(item);
    updateInventoryUI();
    updateEquipUI();
    showToast(`Unequipped ${item.name}`);
  }

  function shortName(name) {
    if (!name) return "—";
    return name.length > 16 ? name.slice(0, 14) + "…" : name;
  }

  function updateEquipUI() {
    const e = state.equipped;
    const set = (chipId, slotId, item) => {
      $(chipId).textContent = shortName(item && item.name);
      $(slotId).textContent = item ? item.name : "Empty";
      const btn = $(slotId.replace("-name", ""));
      if (btn) btn.classList.toggle("filled", !!item);
    };
    set("eq-weapon", "slot-weapon-name", e.weapon);
    set("eq-armor", "slot-armor-name", e.armor);
    set("eq-tool", "slot-tool-name", e.tool);
    set("eq-book", "slot-book-name", e.book);
    const s = gearStats();
    $("hud-def").textContent = String(s.def);
    $("hud-pwr").textContent = String(s.pwr);
    if ($("inv-def")) {
      $("inv-def").textContent = String(s.def);
      $("inv-pwr").textContent = String(s.pwr);
      $("inv-know").textContent = String(s.know);
    }
  }

  function updateInventoryUI() {
    const list = $("inventory-list");
    const empty = $("inventory-empty");
    list.innerHTML = "";
    if (!state.inventory.length) {
      empty.classList.remove("hidden");
      updateEquipUI();
      return;
    }
    empty.classList.add("hidden");
    state.inventory.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="item-name rarity-${item.rarity}">${item.name}</span>
        <span class="item-meta">${item.slot} · ${item.rarity} · DEF ${item.def} PWR ${item.pwr} KNOW ${item.know}</span>
        <span class="item-actions"><button type="button" class="btn-equip" data-uid="${item.uid}">Equip</button></span>`;
      list.appendChild(li);
    });
    list.querySelectorAll(".btn-equip").forEach((btn) => {
      btn.addEventListener("click", () => equipItem(btn.getAttribute("data-uid")));
    });
    updateEquipUI();
  }

  function updateHUD() {
    $("hud-level").textContent = String(state.level);
    $("hud-kp").textContent = String(state.kp);
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    $("hud-coords").textContent = `${px}, ${py}`;
    $("hud-biome").textContent = BIOME_NAMES[biomeAt(px, py)] || "Unknown";
    $("hud-study").textContent = `G${state.grade} · ${state.bookTitle}`;
    const s = gearStats();
    $("hud-def").textContent = String(s.def);
    $("hud-pwr").textContent = String(s.pwr);
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

  function openModal(id) { $(id).classList.remove("hidden"); }
  function closeModal(id) { $(id).classList.add("hidden"); }

  function showResult(title, body) {
    $("result-title").textContent = title;
    $("result-body").textContent = body;
    openModal("result-modal");
    const btn = $("btn-result-ok");
    const handler = () => {
      btn.removeEventListener("click", handler);
      closeModal("result-modal");
    };
    btn.addEventListener("click", handler);
  }

  function labelSubject() {
    return { math: "Mathematics", science: "Science", history: "History", english: "English", geography: "Geography" }[state.subject] || "your subject";
  }

  // ——— Quest / Boss ———
  function startQuest(structure) {
    if (structure.done) { showToast("This trial is already complete."); return; }
    state.paused = true;
    const rank = structure.rank || 0;
    const question = pickQuestion(rank + gradeTierBoost());

    $("quest-title").textContent = structure.name || "Trial";
    $("quest-rank").textContent = `Rank ${rankLabel(rank)}`;
    $("quest-flavor").textContent = structure.village
      ? `"${state.playerName}, Grade ${state.grade} — prove your knowledge from ${state.bookTitle}."`
      : `A weathered pedestal hums with Grade ${state.grade} trials from ${state.bookTitle}.`;
    $("quest-book-tag").textContent = `📖 ${state.bookTitle} · ${labelSubject()} · Grade ${state.grade}`;
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
      const rank = structure.rank || 0;
      const diff = DIFFICULTY[state.difficulty];
      const count = diff.lootCount + (rank > 1 ? 1 : 0);
      const loot = grantLoot({ count, rank, boss: false });
      structure.done = true;
      setTile(structure.wx, structure.wy, TILES.PATH);
      state.questsDone++;
      state.kp += 10 + rank * 5 + gearStats().know;
      state.checkpoint = { x: structure.wx + 0.5, y: structure.wy + 0.5 };
      fb.textContent = `Correct! Loot: ${loot.map((l) => l.name).join(", ")}. Equip it from Inventory (I).`;
      updateHUD();
      setTimeout(() => {
        closeModal("quest-modal");
        state.paused = false;
        showToast(`+${loot.map((l) => l.name).join(", ")}`);
      }, 1100);
    } else {
      fb.classList.add("bad");
      fb.textContent = "Wrong… the ruins reject you. Back to the beginning!";
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
    state.player.facing = 0;
  }

  function goToPreviousLevel() {
    clearInventoryAndGear();
    state.level = Math.max(1, state.level - 1);
    const target = state.level <= 1 ? state.spawn : state.checkpoint;
    state.player.x = target.x;
    state.player.y = target.y;
    updateHUD();
  }

  function startBoss(structure) {
    if (structure.done) { showToast("This guardian has already fallen."); return; }
    state.paused = true;
    const rank = structure.rank || 1;
    const boost = DIFFICULTY[state.difficulty].bossOffset + rank;
    state.bossFight = {
      structure,
      phase: 0,
      questions: [pickQuestion(boost), pickQuestion(boost + 1), pickQuestion(boost + 2)],
    };
    $("boss-title").textContent = structure.name;
    $("boss-flavor").textContent = `Dungeon guardian of Rank ${rankLabel(rank)}. Three escalating questions from ${state.bookTitle}. Fail one → lose all gear & drop a level.`;
    $("boss-book-tag").textContent = `📖 ${state.bookTitle} · Grade ${state.grade} · ${DIFFICULTY[state.difficulty].label}`;
    $("boss-hp-bar").style.width = "100%";
    openModal("boss-modal");
    showBossQuestion();
  }

  function showBossQuestion() {
    const fight = state.bossFight;
    const question = fight.questions[fight.phase];
    $("boss-phase").textContent = `Question ${fight.phase + 1} / 3`;
    $("boss-question").textContent = question.q;
    $("boss-feedback").classList.add("hidden");
    $("boss-hp-bar").style.width = `${100 - fight.phase * 33}%`;
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
      fb.textContent = "The guardian strikes! Gear lost — falling back a level.";
      setTimeout(() => {
        closeModal("boss-modal");
        state.bossFight = null;
        goToPreviousLevel();
        state.paused = false;
        showResult("Defeated", "Wrong answer. Your satchel and equipped gear are gone. You awaken at the previous level.");
      }, 1100);
      return;
    }

    fb.classList.remove("bad");
    fb.textContent = "The guardian reels…";
    fight.phase++;
    $("boss-hp-bar").style.width = `${Math.max(0, 100 - fight.phase * 34)}%`;

    if (fight.phase >= 3) {
      setTimeout(() => {
        const rank = fight.structure.rank || 1;
        const diff = DIFFICULTY[state.difficulty];
        const loot = grantLoot({ count: diff.lootCount + 2, rank, boss: true });
        fight.structure.done = true;
        setTile(fight.structure.wx, fight.structure.wy, TILES.FLOOR);
        if (getTile(fight.structure.wx + 1, fight.structure.wy) === TILES.BOSS) {
          setTile(fight.structure.wx + 1, fight.structure.wy, TILES.FLOOR);
        }
        state.bossesDefeated++;
        state.level++;
        state.kp += 40 + rank * 15 + gearStats().know;
        state.checkpoint = { x: fight.structure.wx + 0.5, y: fight.structure.wy + 1.5 };
        spawnParticles(fight.structure.wx + 0.5, fight.structure.wy + 0.5, 28);
        state.bossFight = null;
        closeModal("boss-modal");
        updateHUD();
        state.paused = false;
        showResult("Guardian Vanquished!", `Level ${state.level}! Epic loot: ${loot.map((l) => l.name).join(", ")}. Equip from Inventory (I).`);
      }, 800);
    } else {
      setTimeout(showBossQuestion, 750);
    }
  }

  function spawnParticles(x, y, n) {
    if (!state.settings.particles) return;
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.5,
        life: 0.6 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? "#f0c96a" : "#e06a55",
      });
    }
  }

  // ——— Interaction / movement ———
  function findInteractable() {
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    for (const [dx, dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const wx = px + dx, wy = py + dy;
      const tile = getTile(wx, wy);
      if (tile === TILES.QUEST || tile === TILES.BOSS) {
        const s = state.structures.get(`${wx},${wy}`) || state.structures.get(`${wx - 1},${wy}`);
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

  function updatePlayer(dt) {
    let mx = 0, my = 0;
    if (state.keys.ArrowUp || state.keys.w || state.keys.W) my -= 1;
    if (state.keys.ArrowDown || state.keys.s || state.keys.S) my += 1;
    if (state.keys.ArrowLeft || state.keys.a || state.keys.A) mx -= 1;
    if (state.keys.ArrowRight || state.keys.d || state.keys.D) mx += 1;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      state.player.facing = Math.atan2(my, mx);
    }
    const speed = (3.2 + gearStats().pwr * 0.04) * state.settings.speed;
    const nx = state.player.x + mx * speed * dt;
    const ny = state.player.y + my * speed * dt;
    if (!collides(nx, state.player.y)) state.player.x = nx;
    if (!collides(state.player.x, ny)) state.player.y = ny;

    const { cx, cy } = worldToChunk(Math.floor(state.player.x), Math.floor(state.player.y));
    const rd = state.settings.renderDist;
    for (let y = -rd; y <= rd; y++) for (let x = -rd; x <= rd; x++) ensureChunk(cx + x, cy + y);

    state.interactTarget = findInteractable();
    $("interact-prompt").classList.toggle("hidden", !state.interactTarget);
  }

  function collides(x, y) {
    const r = 0.28;
    return [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]
      .some(([sx, sy]) => isSolid(getTile(Math.floor(sx), Math.floor(sy))));
  }

  // ——— Pixel drawing (more detailed / realistic tiles) ———
  function pxRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawTileArt(tile, px, py, ts, wx, wy) {
    const c = (wx + wy) & 1;
    switch (tile) {
      case TILES.GRASS:
        pxRect(px, py, ts, ts, c ? "#3f6a38" : "#356032");
        pxRect(px + 2, py + ts * 0.3, 2, 3, "#6a9a4a");
        pxRect(px + ts * 0.6, py + ts * 0.55, 2, 3, "#5a8a40");
        break;
      case TILES.DIRT:
        pxRect(px, py, ts, ts, c ? "#6b523c" : "#5c4634");
        pxRect(px + 3, py + 4, 2, 2, "#4a3828");
        break;
      case TILES.MOSS:
        pxRect(px, py, ts, ts, "#3a5030");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#4a7040");
        break;
      case TILES.STONE:
        pxRect(px, py, ts, ts, c ? "#6a6660" : "#5a5650");
        pxRect(px, py, ts, 2, "#7a7670");
        pxRect(px, py + ts * 0.5, ts, 1, "#4a4640");
        break;
      case TILES.COBBLE:
        pxRect(px, py, ts, ts, "#5a5248");
        pxRect(px + 1, py + 1, ts / 2 - 2, ts / 2 - 2, "#6a6258");
        pxRect(px + ts / 2, py + ts / 2, ts / 2 - 1, ts / 2 - 1, "#4a443c");
        break;
      case TILES.RUIN:
        pxRect(px, py, ts, ts, "#7a6a58");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#5a4a3a");
        pxRect(px + 3, py + 3, 2, ts - 6, "#3a3028");
        break;
      case TILES.WATER: {
        pxRect(px, py, ts, ts, "#2a5570");
        const wave = Math.sin(state.animT * 3 + wx * 0.7 + wy * 0.4) > 0;
        pxRect(px + 2, py + ts * 0.35, ts - 4, 2, wave ? "#5a90a8" : "#3a7088");
        pxRect(px + 4, py + ts * 0.6, ts - 8, 1, "#7ab0c0");
        break;
      }
      case TILES.SAND:
        pxRect(px, py, ts, ts, c ? "#d4b87a" : "#c4a86a");
        pxRect(px + 4, py + 6, 2, 1, "#e0c888");
        break;
      case TILES.PATH:
        pxRect(px, py, ts, ts, c ? "#9a8468" : "#8a7458");
        pxRect(px + 1, py + 1, 2, 2, "#b09a78");
        break;
      case TILES.FLOOR:
        pxRect(px, py, ts, ts, "#3a3028");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#4a4034");
        pxRect(px + 2, py + ts * 0.5, ts - 4, 1, "#2a2218");
        break;
      case TILES.WALL:
        pxRect(px, py, ts, ts, "#2a241c");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#3a342c");
        pxRect(px, py, 2, ts, "#1a1612");
        pxRect(px, py, ts, 2, "#4a443c");
        break;
      case TILES.LAVA: {
        const pulse = 0.5 + Math.sin(state.animT * 4 + wx + wy) * 0.5;
        pxRect(px, py, ts, ts, "#5a1808");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, pulse > 0.5 ? "#e06030" : "#c04020");
        pxRect(px + ts * 0.4, py + ts * 0.3, 3, 3, "#f0c060");
        break;
      }
      case TILES.TREE:
        pxRect(px, py, ts, ts, "#2a4828");
        pxRect(px + ts * 0.4, py + ts * 0.5, ts * 0.2, ts * 0.5, "#4a3020");
        pxRect(px + ts * 0.15, py + ts * 0.08, ts * 0.7, ts * 0.48, "#2e5a28");
        pxRect(px + ts * 0.28, py + ts * 0.18, ts * 0.45, ts * 0.28, "#3e7a38");
        break;
      case TILES.FLOWER:
        pxRect(px, py, ts, ts, "#356032");
        pxRect(px + ts * 0.45, py + ts * 0.45, 2, ts * 0.35, "#2a5020");
        pxRect(px + ts * 0.35, py + ts * 0.3, 5, 5, "#d07050");
        pxRect(px + ts * 0.45, py + ts * 0.38, 2, 2, "#f0d060");
        break;
      case TILES.FENCE:
        pxRect(px, py, ts, ts, "#6b8f5a");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#8a7458");
        pxRect(px + ts * 0.2, py + 3, 3, ts - 6, "#5a4430");
        pxRect(px + ts * 0.65, py + 3, 3, ts - 6, "#5a4430");
        pxRect(px + 3, py + ts * 0.35, ts - 6, 3, "#c4a574");
        break;
      case TILES.BANNER:
        pxRect(px, py, ts, ts, "#6b8f5a");
        pxRect(px + ts * 0.45, py + 2, 2, ts - 4, "#5a4430");
        pxRect(px + ts * 0.2, py + 3, ts * 0.5, ts * 0.45, "#c97852");
        pxRect(px + ts * 0.3, py + 6, ts * 0.3, ts * 0.2, "#f0c96a");
        break;
      case TILES.ROOF:
        pxRect(px, py, ts, ts, "#8a7458");
        // peaked roof
        for (let i = 0; i < ts / 2; i++) {
          pxRect(px + i, py + ts / 2 - i, ts - i * 2, 2, i % 2 ? "#a65d3f" : "#8a4030");
        }
        break;
      case TILES.DOOR:
        pxRect(px, py, ts, ts, "#5c4634");
        pxRect(px + 3, py + 2, ts - 6, ts - 3, "#3a2818");
        pxRect(px + ts * 0.65, py + ts * 0.5, 2, 2, "#f0c96a");
        break;
      case TILES.VILLAGE:
        // warm cottage wall + window
        pxRect(px, py, ts, ts, "#8a7458");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#c4a574");
        pxRect(px + ts * 0.3, py + ts * 0.35, ts * 0.4, ts * 0.35, "#5a90c0");
        pxRect(px + ts * 0.45, py + ts * 0.35, 2, ts * 0.35, "#3a6080");
        pxRect(px + ts * 0.3, py + ts * 0.5, ts * 0.4, 2, "#3a6080");
        break;
      case TILES.DUNGEON:
        // dark skull-arch entrance
        pxRect(px, py, ts, ts, "#1a1014");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#3a1820");
        pxRect(px + ts * 0.25, py + ts * 0.2, ts * 0.5, ts * 0.55, "#0a0608");
        pxRect(px + ts * 0.35, py + ts * 0.35, 3, 3, "#e06a55");
        pxRect(px + ts * 0.55, py + ts * 0.35, 3, 3, "#e06a55");
        break;
      case TILES.TORCH: {
        pxRect(px, py, ts, ts, "#3a3028");
        pxRect(px + ts * 0.4, py + ts * 0.35, 3, ts * 0.55, "#5a4030");
        const flicker = Math.sin(state.animT * 10 + wx * 3) > 0;
        pxRect(px + ts * 0.35, py + ts * 0.15, 5, 6, flicker ? "#f0c060" : "#e06030");
        break;
      }
      case TILES.QUEST: {
        const bob = Math.sin(state.animT * 4) * 2;
        pxRect(px, py, ts, ts, "#8a7458");
        pxRect(px + ts * 0.25, py + ts * 0.2 + bob, ts * 0.5, ts * 0.55, "#f0c96a");
        pxRect(px + ts * 0.35, py + ts * 0.35 + bob, ts * 0.3, ts * 0.25, "#1a1612");
        pxRect(px + ts * 0.42, py + ts * 0.42 + bob, 3, 3, "#f0c96a");
        break;
      }
      case TILES.BOSS: {
        const pulse = 0.85 + Math.sin(state.animT * 5) * 0.15;
        pxRect(px, py, ts, ts, "#2a1010");
        const s = ts * 0.7 * pulse;
        pxRect(px + (ts - s) / 2, py + (ts - s) / 2 - 2, s, s, "#b54a3c");
        pxRect(px + ts * 0.28, py + ts * 0.32, 3, 3, "#f0e0a0");
        pxRect(px + ts * 0.58, py + ts * 0.32, 3, 3, "#f0e0a0");
        pxRect(px + ts * 0.35, py + ts * 0.55, ts * 0.3, 3, "#1a0908");
        break;
      }
      default:
        pxRect(px, py, ts, ts, "#333");
    }
  }

  function resizeCanvas() {
    const wrap = $("game-wrap");
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const scale = Math.max(1, Math.floor(Math.min(w / 320, h / 180)));
    const tw = Math.floor(w / scale), th = Math.floor(h / scale);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      ctx.imageSmoothingEnabled = false;
    }
  }

  function draw() {
    resizeCanvas();
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#0a0908";
    ctx.fillRect(0, 0, w, h);

    const fov = state.settings.fov;
    const tileSize = Math.max(10, Math.floor(Math.min(w, h) / fov));
    const camX = state.player.x, camY = state.player.y;
    const tilesX = Math.ceil(w / tileSize) + 2;
    const tilesY = Math.ceil(h / tileSize) + 2;
    const startX = Math.floor(camX - w / (2 * tileSize));
    const startY = Math.floor(camY - h / (2 * tileSize));

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const wx = startX + tx, wy = startY + ty;
        const px = Math.floor((wx - camX) * tileSize + w / 2);
        const py = Math.floor((wy - camY) * tileSize + h / 2);
        drawTileArt(getTile(wx, wy), px, py, tileSize, wx, wy);
      }
    }

    // Player with equipped gear tint
    const ppx = Math.floor(w / 2), ppy = Math.floor(h / 2);
    const ps = Math.max(8, tileSize * 0.55);
    const armor = state.equipped.armor;
    const body = armor ? (armor.rarity === "legendary" ? "#d4a84b" : armor.rarity === "epic" ? "#a060c0" : armor.rarity === "rare" ? "#6a90c0" : "#6b8f5a") : "#6b8f5a";
    pxRect(ppx - ps / 2 + 1, ppy - ps / 2 + 2, ps, ps, "#1a1612");
    pxRect(ppx - ps / 2, ppy - ps / 2, ps, ps * 0.45, "#c4a574");
    pxRect(ppx - ps / 2, ppy - ps / 2 + ps * 0.4, ps, ps * 0.6, body);
    const lookX = Math.cos(state.player.facing) * 2;
    pxRect(ppx - 3 + lookX, ppy - ps * 0.15, 2, 2, "#1a1612");
    pxRect(ppx + 1 + lookX, ppy - ps * 0.15, 2, 2, "#1a1612");
    if (state.equipped.weapon) {
      pxRect(ppx + ps / 2 - 1, ppy - 2, 3, ps * 0.7, "#d0d0d0");
      pxRect(ppx + ps / 2 - 2, ppy - 4, 5, 3, "#f0c96a");
    }

    state.particles = state.particles.filter((p) => {
      p.x += p.vx * 0.016; p.y += p.vy * 0.016; p.vy += 0.04; p.life -= 0.016;
      if (p.life <= 0) return false;
      const x = Math.floor((p.x - camX) * tileSize + w / 2);
      const y = Math.floor((p.y - camY) * tileSize + h / 2);
      ctx.globalAlpha = Math.max(0, p.life);
      pxRect(x, y, 3, 3, p.color);
      ctx.globalAlpha = 1;
      return true;
    });

    const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(8,6,4,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    drawMinimap();
  }

  function drawMinimap() {
    if (!state.settings.minimap) { $("minimap").classList.add("hidden"); return; }
    $("minimap").classList.remove("hidden");
    const s = 120;
    miniCtx.fillStyle = "#12100e";
    miniCtx.fillRect(0, 0, s, s);
    const range = 40;
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        if ((x + y) % 2) continue;
        const wx = px + Math.floor((x / s) * range * 2) - range;
        const wy = py + Math.floor((y / s) * range * 2) - range;
        const tile = getTile(wx, wy);
        let c = "#3d5c32";
        if (tile === TILES.WATER) c = "#2a4a5c";
        else if (tile === TILES.LAVA) c = "#e06030";
        else if (tile === TILES.STONE || tile === TILES.WALL) c = "#5a5650";
        else if (tile === TILES.SAND) c = "#c4a86a";
        else if (tile === TILES.PATH || tile === TILES.FLOOR || tile === TILES.COBBLE) c = "#8a7458";
        else if (tile === TILES.QUEST) c = "#f0c96a";
        else if (tile === TILES.BOSS) c = "#e06a55";
        else if (tile === TILES.VILLAGE || tile === TILES.ROOF || tile === TILES.DOOR || tile === TILES.BANNER || tile === TILES.FENCE) c = "#d4a060";
        else if (tile === TILES.DUNGEON || tile === TILES.TORCH) c = "#8a2030";
        else if (tile === TILES.TREE) c = "#2a4028";
        miniCtx.fillStyle = c;
        miniCtx.fillRect(x, y, 2, 2);
      }
    }
    miniCtx.fillStyle = "#ffffff";
    miniCtx.fillRect(s / 2 - 2, s / 2 - 2, 4, 4);
  }

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

  function startGame(cfg) {
    state.seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    state.subject = cfg.subject;
    state.grade = cfg.grade;
    state.bookId = cfg.bookId;
    state.bookTitle = cfg.bookTitle;
    state.difficulty = cfg.difficulty;
    state.playerName = cfg.name || "Scholar";
    state.level = 1;
    state.kp = 0;
    state.questsDone = 0;
    state.bossesDefeated = 0;
    state.inventory = [];
    state.equipped = { weapon: null, armor: null, tool: null, book: null };
    state.chunks.clear();
    state.structures.clear();
    state.usedQuestions.clear();
    state.particles = [];
    state.spawn = { x: 8.5, y: 8.5 };
    state.checkpoint = { ...state.spawn };
    state.player = { x: 8.5, y: 8.5, facing: 0 };
    state.paused = false;
    state.running = true;
    state.bossFight = null;

    // Starter common gear so equip is obvious
    const starter = LOOT_TABLE.find((l) => l.key === "primer");
    if (starter) {
      state.inventory.push({ ...starter, uid: "starter-book" });
    }

    ensureChunk(0, 0);
    $("start-screen").classList.remove("active");
    $("game-screen").classList.add("active");
    updateInventoryUI();
    updateHUD();
    applyMobileVisibility();
    showToast(`Grade ${state.grade} · ${state.bookTitle}. Seek gold pedestals & red dungeons.`);
  }

  function quitToMenu() {
    state.running = false;
    state.paused = false;
    ["settings-modal", "inventory-modal", "quest-modal", "boss-modal", "result-modal"].forEach(closeModal);
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
  $("subject-select").addEventListener("change", refreshBookSelect);
  $("grade-select").addEventListener("change", refreshBookSelect);
  $("book-select").addEventListener("change", onBookChange);
  refreshBookSelect();

  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("player-name").value.trim() || "Scholar";
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const bookId = $("book-select").value;
    const book = booksFor(subject, grade).find((b) => b.id === bookId);
    const bookTitle = book ? book.title : "General Study Guide";
    const difficulty = (document.querySelector('input[name="difficulty"]:checked') || {}).value || "easy";
    startGame({ name, subject, grade, bookId, bookTitle, difficulty });
  });

  window.addEventListener("keydown", (e) => {
    state.keys[e.key] = true;
    if (e.key === "e" || e.key === "E") { e.preventDefault(); tryInteract(); }
    if (e.key === "i" || e.key === "I") {
      if (!state.running) return;
      if (!$("inventory-modal").classList.contains("hidden")) closeModal("inventory-modal");
      else { updateInventoryUI(); openModal("inventory-modal"); }
    }
    if (e.key === "Escape") {
      if (!$("quest-modal").classList.contains("hidden") || !$("boss-modal").classList.contains("hidden") || !$("result-modal").classList.contains("hidden")) return;
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
  window.addEventListener("keyup", (e) => { state.keys[e.key] = false; });

  $("btn-settings").addEventListener("click", () => { openModal("settings-modal"); state.paused = true; });
  $("btn-inventory").addEventListener("click", () => { updateInventoryUI(); openModal("inventory-modal"); });
  $("btn-resume").addEventListener("click", () => { closeModal("settings-modal"); state.paused = false; });
  $("btn-quit").addEventListener("click", quitToMenu);

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal(btn.getAttribute("data-close"));
      if (btn.getAttribute("data-close") === "settings-modal") state.paused = false;
    });
  });

  document.querySelectorAll("[data-unequip]").forEach((btn) => {
    btn.addEventListener("click", () => unequipSlot(btn.getAttribute("data-unequip")));
  });

  const bindRange = (id, key, labelId, fmt) => {
    $(id).addEventListener("input", () => {
      const v = parseFloat($(id).value);
      state.settings[key] = v;
      if (labelId) $(labelId).textContent = fmt ? fmt(v) : String(v);
    });
  };
  bindRange("setting-fov", "fov", "fov-value");
  bindRange("setting-render", "renderDist", "render-value");
  bindRange("setting-speed", "speed", "speed-value", (v) => v.toFixed(1));
  $("setting-minimap").addEventListener("change", (e) => { state.settings.minimap = e.target.checked; });
  $("setting-particles").addEventListener("change", (e) => { state.settings.particles = e.target.checked; });
  $("setting-mobile").addEventListener("change", (e) => { state.settings.forceMobile = e.target.checked; applyMobileVisibility(); });

  const setDir = (dir, down) => {
    const map = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
    state.keys[map[dir]] = down;
  };
  document.querySelectorAll(".pad-btn").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const on = (e) => { e.preventDefault(); setDir(dir, true); };
    const off = (e) => { e.preventDefault(); setDir(dir, false); };
    btn.addEventListener("pointerdown", on);
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointerleave", off);
    btn.addEventListener("pointercancel", off);
  });
  $("btn-interact").addEventListener("click", (e) => { e.preventDefault(); tryInteract(); });
  canvas.addEventListener("click", () => { if (state.interactTarget) tryInteract(); });
  window.addEventListener("resize", () => { applyMobileVisibility(); resizeCanvas(); });

  applyMobileVisibility();
  requestAnimationFrame(frame);
})();
