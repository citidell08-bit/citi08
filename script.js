/**
 * Ruin Scholar — Gamified Study Companion
 * Grade + textbook study quests, equippable loot, infinite ruin world,
 * village cottages, dungeon instances, combat.
 */
(() => {
  "use strict";

  const CHUNK = 16;
  const TILE = 16;

  const TILES = {
    GRASS: 0, DIRT: 1, STONE: 2, RUIN: 3, WATER: 4, SAND: 5, PATH: 6,
    WALL: 7, FLOOR: 8, VILLAGE: 9, DUNGEON: 10, QUEST: 11, BOSS: 12,
    TREE: 13, FLOWER: 14, ROOF: 15, DOOR: 16, FENCE: 17, LAVA: 18,
    TORCH: 19, BANNER: 20, COBBLE: 21, MOSS: 22, CHEST: 23, STAIRS: 24,
    EXIT: 25,
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

  const FLOOR_THEMES = [
    { name: "Rat Warren", monster: "rat", hp: 14, dmg: 6, spd: 1.6, color: "#8a6040", body: "#6a4830", eye: "#1a1008" },
    { name: "Ossuary", monster: "skeleton", hp: 22, dmg: 8, spd: 1.4, color: "#d8d0c0", body: "#c0b8a8", eye: "#40c0ff" },
    { name: "Spider Nest", monster: "spider", hp: 18, dmg: 7, spd: 2.0, color: "#3a2830", body: "#2a1820", eye: "#ff4040" },
    { name: "Slime Pits", monster: "slime", hp: 26, dmg: 5, spd: 1.2, color: "#40c060", body: "#30a048", eye: "#102010" },
    { name: "Bat Caverns", monster: "bat", hp: 16, dmg: 9, spd: 2.4, color: "#4a3858", body: "#3a2848", eye: "#f0c040" },
    { name: "Cultist Sanctum", monster: "cultist", hp: 30, dmg: 10, spd: 1.5, color: "#6a2848", body: "#4a1838", eye: "#e060a0" },
    { name: "Knight's Hall", monster: "knight", hp: 38, dmg: 12, spd: 1.3, color: "#708090", body: "#506070", eye: "#f0e0a0" },
    { name: "Demon Forge", monster: "demon", hp: 44, dmg: 14, spd: 1.7, color: "#a03020", body: "#801810", eye: "#ff8040" },
    { name: "Shadow Vault", monster: "shadow", hp: 36, dmg: 16, spd: 2.1, color: "#282030", body: "#181020", eye: "#a060ff" },
    { name: "Guardian Throne", monster: "guardian", hp: 60, dmg: 18, spd: 1.2, color: "#c0a040", body: "#a08030", eye: "#ffffff" },
  ];

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
    hp: 100,
    maxHp: 100,
    inventory: [],
    equipped: { weapon: null, armor: null, tool: null, book: null },
    spawn: { x: 8.5, y: 8.5 },
    checkpoint: { x: 8.5, y: 8.5 },
    overworldReturn: { x: 8.5, y: 8.5 },
    player: { x: 8.5, y: 8.5, facing: 0 },
    keys: Object.create(null),
    settings: { fov: 11, renderDist: 6, speed: 1, minimap: true, particles: true, forceMobile: false },
    chunks: new Map(),
    structures: new Map(),
    buildings: new Map(),
    chests: new Map(),
    dungeon: null,
    interactTarget: null,
    particles: [],
    usedQuestions: new Set(),
    bossFight: null,
    animT: 0,
    hitCd: 0,
    hurtCd: 0,
    nextId: 1,
  };


  const $ = (id) => document.getElementById(id);
  const canvas = $("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const miniCanvas = $("minimap-canvas");
  const miniCtx = miniCanvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  miniCtx.imageSmoothingEnabled = false;

  function uid() { return `id-${state.nextId++}`; }

  function booksFor(subject, grade) {
    const g = Number(grade);
    const list = (BOOKS[subject] || []).filter((b) => b.grades.some((x) => Number(x) === g));
    if (list.length) return list;
    const all = BOOKS[subject] || [];
    if (!all.length) return [{ id: "generic", title: "General Study Guide", grades: [g], topics: "grade-level review topics" }];
    return [...all].sort((a, b) => {
      const da = Math.min(...a.grades.map((x) => Math.abs(Number(x) - g)));
      const db = Math.min(...b.grades.map((x) => Math.abs(Number(x) - g)));
      return da - db;
    }).slice(0, 3);
  }

  function selectedBook() {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const id = $("book-select").value;
    return booksFor(subject, grade).find((b) => b.id === id) || booksFor(subject, grade)[0] || null;
  }

  function selectBook(bookId) {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const list = booksFor(subject, grade);
    const book = list.find((b) => b.id === bookId) || list[0];
    if (!book) return;
    $("book-select").value = book.id;
    $("book-list").querySelectorAll(".book-option").forEach((btn) => {
      const on = btn.getAttribute("data-book-id") === book.id;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    $("book-hint").textContent = `Selected: ${book.title}. Topics: ${book.topics}. Grade ${grade}.`;
  }

  function refreshBookSelect() {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const list = booksFor(subject, grade);
    const box = $("book-list");
    const prev = $("book-select").value;
    box.innerHTML = "";
    list.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book-option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("data-book-id", b.id);
      btn.innerHTML = `<strong>${b.title}</strong><small>Grades ${b.grades.join(", ")} · ${b.topics}</small>`;
      btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); selectBook(b.id); });
      box.appendChild(btn);
    });
    const keep = list.some((b) => b.id === prev) ? prev : list[0].id;
    selectBook(keep);
  }

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
  function tileKey(wx, wy) { return `${wx},${wy}`; }

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

  function isSolidTile(tile) {
    return [TILES.WATER, TILES.WALL, TILES.TREE, TILES.LAVA, TILES.FENCE, TILES.VILLAGE].includes(tile);
  }

  function registerBuilding(building) {
    state.buildings.set(building.id, building);
  }

  function registerChest(wx, wy, rank = 0, dungeon = false, tilesBuf = null, cx = 0, cy = 0) {
    const id = uid();
    const chest = { id, wx, wy, opened: false, rank, dungeon };
    state.chests.set(tileKey(wx, wy), chest);
    if (!dungeon) {
      if (tilesBuf) {
        const lx = wx - cx * CHUNK;
        const ly = wy - cy * CHUNK;
        if (lx >= 0 && ly >= 0 && lx < CHUNK && ly < CHUNK) tilesBuf[ly * CHUNK + lx] = TILES.CHEST;
      } else {
        setOverworldTile(wx, wy, TILES.CHEST);
      }
    }
    return chest;
  }

  function registerStructure(wx, wy, type, name, rank, extra = {}) {
    state.structures.set(tileKey(wx, wy), { type, wx, wy, done: false, name, rank, ...extra });
  }

  function questRank(dist) {
    if (dist > 18) return 3;
    if (dist > 10) return 2;
    if (dist > 4) return 1;
    return 0;
  }

  function rankLabel(r) { return ["C", "B", "A", "S"][Math.max(0, Math.min(3, r))] || "C"; }

  function randomQuestName(wx, wy) {
    const names = ["Village Elder", "Wandering Monk", "Ruined Scholar", "Moss Oracle", "Stone Scribe", "Lantern Keeper", "Archive Ghost", "Trial Pedestal"];
    return names[Math.floor(hash2(wx, wy, 99) * names.length)];
  }

  function dungeonName(cx, cy) {
    const a = ["Hollow", "Ashen", "Forgotten", "Sunken", "Crimson", "Silent", "Obsidian", "Bone"];
    const b = ["Crypt", "Keep", "Catacomb", "Sanctum", "Vault", "Spire", "Pit", "Forge"];
    return `${a[Math.floor(hash2(cx, cy, 1) * a.length)]} ${b[Math.floor(hash2(cx, cy, 2) * b.length)]}`;
  }

  function placeCottage(tiles, cx, cy, ox, oy, hx, hy, w, h) {
    const wx0 = cx * CHUNK + ox + hx;
    const wy0 = cy * CHUNK + oy + hy;
    const interior = [];
    const roof = [];
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const lx = ox + hx + dx, ly = oy + hy + dy;
        const i = ly * CHUNK + lx;
        const edge = dx === 0 || dy === 0 || dx === w - 1 || dy === h - 1;
        const isDoor = dy === h - 1 && dx === Math.floor(w / 2);
        if (dy <= 1) {
          // Peak rows: floor under the visual roof overlay
          tiles[i] = edge && !isDoor ? TILES.VILLAGE : TILES.FLOOR;
          if (!edge || isDoor) interior.push({ wx: wx0 + dx, wy: wy0 + dy });
        } else if (edge && !isDoor) {
          tiles[i] = TILES.VILLAGE;
        } else if (isDoor) {
          tiles[i] = TILES.DOOR;
        } else {
          tiles[i] = TILES.FLOOR;
          interior.push({ wx: wx0 + dx, wy: wy0 + dy });
        }
        // Full cottage footprint gets a roof overlay (hidden when inside)
        if (!(isDoor && dy === h - 1)) {
          roof.push({ wx: wx0 + dx, wy: wy0 + dy });
        }
      }
    }
    const bid = uid();
    registerBuilding({ id: bid, x: wx0, y: wy0, w, h, interior, roof, chunk: { cx, cy } });
    const chestPos = interior[Math.floor(interior.length / 2)] || { wx: wx0 + 1, wy: wy0 + 2 };
    registerChest(chestPos.wx, chestPos.wy, questRank(Math.abs(cx) + Math.abs(cy)), false, tiles, cx, cy);
    return bid;
  }

  function placeVillage(tiles, cx, cy) {
    const ox = 2, oy = 2;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        if (x === 0 || y === 0 || x === 11 || y === 11) tiles[i] = TILES.FENCE;
        else tiles[i] = TILES.PATH;
      }
    }
    tiles[(oy + 11) * CHUNK + (ox + 5)] = TILES.PATH;
    tiles[(oy + 11) * CHUNK + (ox + 6)] = TILES.PATH;
    tiles[(oy + 0) * CHUNK + (ox + 5)] = TILES.BANNER;
    tiles[(oy + 0) * CHUNK + (ox + 6)] = TILES.BANNER;
    placeCottage(tiles, cx, cy, ox, oy, 2, 2, 4, 4);
    placeCottage(tiles, cx, cy, ox, oy, 7, 2, 4, 4);
    placeCottage(tiles, cx, cy, ox, oy, 4, 7, 5, 4);
    const qx = ox + 5, qy = oy + 5;
    tiles[qy * CHUNK + qx] = TILES.QUEST;
    const dist = Math.abs(cx) + Math.abs(cy);
    registerStructure(cx * CHUNK + qx, cy * CHUNK + qy, "quest", "Village Trial", questRank(dist), { village: true });
  }

  function placeDungeon(tiles, cx, cy) {
    const ox = 1, oy = 1;
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 14; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        const edge = x === 0 || y === 0 || x === 13 || y === 13;
        const moat = x === 1 || y === 1 || x === 12 || y === 12;
        if (edge) tiles[i] = TILES.WALL;
        else if (moat && !(y >= 11)) tiles[i] = TILES.LAVA;
        else tiles[i] = TILES.FLOOR;
      }
    }
    for (let y = 11; y <= 13; y++) {
      tiles[(oy + y) * CHUNK + (ox + 6)] = TILES.COBBLE;
      tiles[(oy + y) * CHUNK + (ox + 7)] = TILES.COBBLE;
    }
    [[3, 3], [10, 3], [3, 10], [10, 10]].forEach(([px, py]) => {
      tiles[(oy + py) * CHUNK + (ox + px)] = TILES.RUIN;
      tiles[(oy + py - 1) * CHUNK + (ox + px)] = TILES.TORCH;
    });
    tiles[(oy + 2) * CHUNK + (ox + 6)] = TILES.DUNGEON;
    tiles[(oy + 2) * CHUNK + (ox + 7)] = TILES.DUNGEON;
    const dist = Math.abs(cx) + Math.abs(cy);
    const rank = Math.min(3, questRank(dist) + 1);
    const wx = cx * CHUNK + ox + 6, wy = cy * CHUNK + oy + 2;
    registerStructure(wx, wy, "dungeon_entrance", dungeonName(cx, cy), rank, { level: 1 + Math.floor(dist / 4), wx2: wx + 1 });
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
      registerStructure(cx * CHUNK + lx, cy * CHUNK + ly, "quest", randomQuestName(cx * CHUNK + lx, cy * CHUNK + ly), questRank(dist));
    }
    if (cx === 0 && cy === 0) {
      for (let ly = 6; ly <= 9; ly++) for (let lx = 6; lx <= 9; lx++) tiles[ly * CHUNK + lx] = TILES.PATH;
    }
    const chunk = { cx, cy, tiles };
    state.chunks.set(key, chunk);
    return chunk;
  }

  function getOverworldTile(wx, wy) {
    const { cx, cy } = worldToChunk(wx, wy);
    const chunk = ensureChunk(cx, cy);
    const lx = ((wx % CHUNK) + CHUNK) % CHUNK;
    const ly = ((wy % CHUNK) + CHUNK) % CHUNK;
    return chunk.tiles[ly * CHUNK + lx];
  }

  function setOverworldTile(wx, wy, tile) {
    const { cx, cy } = worldToChunk(wx, wy);
    const chunk = ensureChunk(cx, cy);
    const lx = ((wx % CHUNK) + CHUNK) % CHUNK;
    const ly = ((wy % CHUNK) + CHUNK) % CHUNK;
    chunk.tiles[ly * CHUNK + lx] = tile;
  }

  function getTile(wx, wy) {
    if (state.dungeon && state.dungeon.active) {
      const d = state.dungeon;
      if (wx < 0 || wy < 0 || wx >= d.w || wy >= d.h) return TILES.WALL;
      return d.tiles[wy][wx];
    }
    return getOverworldTile(wx, wy);
  }

  function setTile(wx, wy, tile) {
    if (state.dungeon && state.dungeon.active) {
      const d = state.dungeon;
      if (wx >= 0 && wy >= 0 && wx < d.w && wy < d.h) d.tiles[wy][wx] = tile;
      return;
    }
    setOverworldTile(wx, wy, tile);
  }

  function playerInsideBuilding(b) {
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    return b.interior.some((t) => t.wx === px && t.wy === py);
  }

  function isUnderRoof(x, y) {
    for (const b of state.buildings.values()) {
      if (playerInsideBuilding(b)) continue;
      for (const r of b.roof) {
        if (Math.floor(x) === r.wx && Math.floor(y) === r.wy) return true;
      }
    }
    return false;
  }

  function collides(x, y) {
    const r = 0.28;
    const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
    for (const [sx, sy] of pts) {
      if (isSolidTile(getTile(Math.floor(sx), Math.floor(sy)))) return true;
    }
    return false;
  }


  function generateDungeonFloor(floor, rank, name) {
    const theme = FLOOR_THEMES[floor - 1];
    const w = 56 + floor * 2, h = 40 + floor;
    const tiles = Array.from({ length: h }, () => Array(w).fill(TILES.WALL));
    const rooms = [];
    const tries = 30 + floor * 2;
    for (let t = 0; t < tries; t++) {
      const rw = 5 + Math.floor(Math.random() * 5);
      const rh = 4 + Math.floor(Math.random() * 4);
      const rx = 2 + Math.floor(Math.random() * (w - rw - 4));
      const ry = 2 + Math.floor(Math.random() * (h - rh - 4));
      const overlap = rooms.some((r) => !(rx + rw + 2 < r.x || rx > r.x + r.w + 2 || ry + rh + 2 < r.y || ry > r.y + r.h + 2));
      if (overlap) continue;
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) tiles[y][x] = TILES.FLOOR;
      }
    }
    if (rooms.length < 4) {
      rooms.length = 0;
      for (let i = 0; i < 6; i++) {
        const rx = 4 + i * 8, ry = 6 + (i % 2) * 10;
        rooms.push({ x: rx, y: ry, w: 7, h: 6 });
        for (let y = ry; y < ry + 6; y++) for (let x = rx; x < rx + 7; x++) if (y < h && x < w) tiles[y][x] = TILES.FLOOR;
      }
    }
    rooms.sort((a, b) => a.x - b.x);
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      const ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2);
      const bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
      for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) if (x >= 0 && x < w) tiles[ay][x] = TILES.FLOOR;
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) if (y >= 0 && y < h) tiles[y][bx] = TILES.FLOOR;
    }
    const startRoom = rooms[0];
    const endRoom = rooms[rooms.length - 1];
    const spawnX = Math.floor(startRoom.x + startRoom.w / 2) + 0.5;
    const spawnY = Math.floor(startRoom.y + startRoom.h / 2) + 0.5;
    const monsters = [];
    const chests = [];
    rooms.forEach((room, idx) => {
      if (idx === 0) return;
      const cx = Math.floor(room.x + room.w / 2);
      const cy = Math.floor(room.y + room.h / 2);
      if (hash2(cx, cy, floor * 991 + rank) > 0.35) {
        const mhp = Math.floor(theme.hp * (1 + rank * 0.15 + floor * 0.08));
        monsters.push({
          id: uid(), x: cx + 0.5, y: cy + 0.5, hp: mhp, maxHp: mhp,
          type: theme.monster, dmg: theme.dmg + Math.floor(floor / 2),
          spd: theme.spd, color: theme.color, body: theme.body, eye: theme.eye,
          hitCd: 0,
        });
      }
      if (hash2(cx + 3, cy + 1, floor * 313) > 0.4) {
        const ch = { id: uid(), x: cx, y: cy, opened: false, rank };
        chests.push(ch);
        tiles[cy][cx] = TILES.CHEST;
      }
      if (hash2(cx, cy, floor * 77) > 0.82 && floor < 10) {
        const tx = room.x + 1, ty = room.y + 1;
        tiles[ty][tx] = TILES.TORCH;
      }
    });
    let stairs = null, bossTile = null, exit = null;
    if (floor < 10) {
      const sx = Math.floor(endRoom.x + endRoom.w / 2);
      const sy = Math.floor(endRoom.y + endRoom.h / 2);
      tiles[sy][sx] = TILES.STAIRS;
      stairs = { x: sx, y: sy };
    } else {
      const bx = Math.floor(endRoom.x + endRoom.w / 2);
      const by = Math.floor(endRoom.y + endRoom.h / 2);
      tiles[by][bx] = TILES.BOSS;
      bossTile = { x: bx, y: by };
    }
    if (floor === 1) {
      const ex = Math.floor(startRoom.x + 1);
      const ey = Math.floor(startRoom.y + 1);
      tiles[ey][ex] = TILES.EXIT;
      exit = { x: ex, y: ey };
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (tiles[y][x] === TILES.FLOOR && hash2(x, y, floor * 17) > 0.93) tiles[y][x] = TILES.COBBLE;
        if (tiles[y][x] === TILES.WALL && hash2(x, y, floor * 41) > 0.7) tiles[y][x] = TILES.STONE;
      }
    }
    return { w, h, tiles, monsters, chests, stairs, exit, bossTile, spawnX, spawnY, theme };
  }

  function enterDungeon(structure) {
    state.overworldReturn = { x: state.player.x, y: state.player.y };
    const floor = 1;
    const gen = generateDungeonFloor(floor, structure.rank || 0, structure.name);
    state.dungeon = {
      active: true,
      floor,
      name: structure.name,
      rank: structure.rank || 0,
      structure,
      tiles: gen.tiles,
      w: gen.w,
      h: gen.h,
      monsters: gen.monsters,
      chests: gen.chests,
      stairs: gen.stairs,
      exit: gen.exit,
      bossTile: gen.bossTile,
      buildings: [],
      bossStarted: false,
    };
    state.player.x = gen.spawnX;
    state.player.y = gen.spawnY;
    recalcHp();
    updateDungeonUI();
    showToast(`Entered ${structure.name} — Floor 1: ${gen.theme.name}`);
  }

  function leaveDungeon() {
    if (!state.dungeon?.active) return;
    state.dungeon = null;
    state.player.x = state.overworldReturn.x;
    state.player.y = state.overworldReturn.y;
    updateDungeonUI();
    showToast("Returned to the overworld.");
  }

  function nextDungeonFloor() {
    const d = state.dungeon;
    if (!d || !d.stairs) return;
    const next = d.floor + 1;
    const gen = generateDungeonFloor(next, d.rank, d.name);
    d.floor = next;
    d.tiles = gen.tiles;
    d.w = gen.w;
    d.h = gen.h;
    d.monsters = gen.monsters;
    d.chests = gen.chests;
    d.stairs = gen.stairs;
    d.exit = null;
    d.bossTile = gen.bossTile;
    d.bossStarted = false;
    state.player.x = gen.spawnX;
    state.player.y = gen.spawnY;
    recalcHp();
    state.hp = state.maxHp;
    updateDungeonUI();
    showToast(`Descended to Floor ${next}: ${gen.theme.name}`);
    if (next === 10) showToast("The Guardian awaits! Clear foes or reach the throne.");
  }

  function recalcHp() {
    const def = gearStats().def;
    state.maxHp = 100 + def * 2;
    if (state.hp > state.maxHp) state.hp = state.maxHp;
    if (state.hp <= 0) state.hp = state.maxHp;
    $("hud-hp").textContent = `${Math.ceil(state.hp)}/${state.maxHp}`;
  }

  function updateDungeonUI() {
    const inD = !!(state.dungeon && state.dungeon.active);
    $("hud-floor-wrap").classList.toggle("hidden", !inD);
    $("combat-hint").classList.toggle("hidden", !inD);
    if (inD) $("hud-floor").textContent = `${state.dungeon.floor}/10`;
    if (inD) $("hud-biome").textContent = `${state.dungeon.name} · ${FLOOR_THEMES[state.dungeon.floor - 1].name}`;
    else $("hud-biome").textContent = BIOME_NAMES[biomeAt(Math.floor(state.player.x), Math.floor(state.player.y))] || "Grassland Ruins";
  }

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
    const floor = Math.min(4, diff.lootFloor + rank + (boss ? 1 : 0));
    const ceil = Math.min(4, Math.max(floor, diff.lootCeil + (boss ? 1 : 0)));
    for (let i = 0; i < count; i++) {
      const rarityIdx = floor + Math.floor(Math.random() * (ceil - floor + 1));
      const rarity = RARITY_ORDER[rarityIdx];
      const options = LOOT_TABLE.filter((l) => l.rarity === rarity);
      const base = options[Math.floor(Math.random() * options.length)] || LOOT_TABLE[0];
      const item = { ...base, uid: uid(), fromRank: rank };
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
    recalcHp();
  }

  function equipItem(itemUid) {
    const idx = state.inventory.findIndex((i) => i.uid === itemUid);
    if (idx < 0) return;
    const item = state.inventory[idx];
    const slot = item.slot;
    const prev = state.equipped[slot];
    state.inventory.splice(idx, 1);
    if (prev) state.inventory.push(prev);
    state.equipped[slot] = item;
    updateInventoryUI();
    updateEquipUI();
    recalcHp();
    showToast(`Equipped ${item.name}`);
  }

  function unequipSlot(slot) {
    const item = state.equipped[slot];
    if (!item) return;
    state.equipped[slot] = null;
    state.inventory.push(item);
    updateInventoryUI();
    updateEquipUI();
    recalcHp();
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
    recalcHp();
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
      li.innerHTML = `<span class="item-name rarity-${item.rarity}">${item.name}</span><span class="item-meta">${item.slot} · ${item.rarity} · DEF ${item.def} PWR ${item.pwr} KNOW ${item.know}</span><span class="item-actions"><button type="button" class="btn-equip" data-uid="${item.uid}">Equip</button></span>`;
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
    $("hud-study").textContent = `G${state.grade} · ${state.bookTitle}`;
    updateDungeonUI();
    recalcHp();
  }

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
    const handler = () => { btn.removeEventListener("click", handler); closeModal("result-modal"); };
    btn.addEventListener("click", handler);
  }

  function labelSubject() {
    return { math: "Mathematics", science: "Science", history: "History", english: "English", geography: "Geography" }[state.subject] || "your subject";
  }

  function gradeTierBoost() { return DIFFICULTY[state.difficulty].questTier; }

  function pickQuestion(extraTier = 0) {
    const pool = QUESTIONS[state.subject] || QUESTIONS.math;
    const g = state.grade;
    let eligible = pool.filter((q) => g >= q.g[0] && g <= q.g[1]);
    if (!eligible.length) eligible = pool.filter((q) => Math.abs(((q.g[0] + q.g[1]) / 2) - g) <= 3);
    if (!eligible.length) eligible = pool.slice();
    let unused = eligible.filter((q) => !state.usedQuestions.has(q.q));
    if (!unused.length) { eligible.forEach((q) => state.usedQuestions.delete(q.q)); unused = eligible; }
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
      setTimeout(() => { closeModal("quest-modal"); state.paused = false; showToast(`+${loot.map((l) => l.name).join(", ")}`); }, 1100);
    } else {
      fb.classList.add("bad");
      fb.textContent = "Wrong… the ruins reject you. Back to the beginning!";
      setTimeout(() => { closeModal("quest-modal"); respawnToBeginning(); state.paused = false; showToast("Respawned at the gate.", true); }, 1200);
    }
  }

  function respawnToBeginning() {
    state.player.x = state.spawn.x;
    state.player.y = state.spawn.y;
    state.player.facing = 0;
    state.hp = state.maxHp;
    if (state.dungeon?.active) leaveDungeon();
  }

  function goToPreviousLevel() {
    clearInventoryAndGear();
    state.level = Math.max(1, state.level - 1);
    const target = state.level <= 1 ? state.spawn : state.checkpoint;
    state.player.x = target.x;
    state.player.y = target.y;
    state.hp = state.maxHp;
    if (state.dungeon?.active) leaveDungeon();
    updateHUD();
  }

  function startBoss(structure) {
    if (structure && structure.done) { showToast("This guardian has already fallen."); return; }
    state.paused = true;
    const rank = (structure && structure.rank) || (state.dungeon ? state.dungeon.rank : 1);
    const boost = DIFFICULTY[state.difficulty].bossOffset + rank;
    const bossName = structure ? structure.name : `${state.dungeon.name} Guardian`;
    state.bossFight = {
      structure: structure || { name: bossName, rank, wx: 0, wy: 0, done: false, type: "boss" },
      phase: 0,
      questions: [pickQuestion(boost), pickQuestion(boost + 1), pickQuestion(boost + 2)],
      fromDungeon: !!(state.dungeon && state.dungeon.active),
    };
    $("boss-title").textContent = bossName;
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
        if (fight.fromDungeon && state.dungeon) {
          const bt = state.dungeon.bossTile;
          if (bt) { setTile(bt.x, bt.y, TILES.FLOOR); }
          state.dungeon = null;
          state.player.x = state.overworldReturn.x;
          state.player.y = state.overworldReturn.y;
          updateDungeonUI();
        } else if (fight.structure.wx != null) {
          setTile(fight.structure.wx, fight.structure.wy, TILES.FLOOR);
          if (getTile(fight.structure.wx + 1, fight.structure.wy) === TILES.BOSS) setTile(fight.structure.wx + 1, fight.structure.wy, TILES.FLOOR);
        }
        state.bossesDefeated++;
        state.level++;
        state.kp += 40 + rank * 15 + gearStats().know;
        state.checkpoint = { x: state.player.x, y: state.player.y };
        state.hp = state.maxHp;
        spawnParticles(state.player.x, state.player.y, 28);
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

  function openChest(chest) {
    if (chest.opened) { showToast("Chest already looted."); return; }
    chest.opened = true;
    const rank = chest.rank || 0;
    const loot = grantLoot({ count: 1 + (rank > 1 ? 1 : 0), rank, boss: false });
    if (!chest.dungeon) setTile(chest.wx, chest.wy, TILES.FLOOR);
    else {
      const d = state.dungeon;
      const ch = d.chests.find((c) => c.id === chest.id);
      if (ch) { setTile(ch.x, ch.y, TILES.FLOOR); }
    }
    showToast(`Chest: ${loot.map((l) => l.name).join(", ")}`);
    spawnParticles(chest.wx || chest.x, chest.wy || chest.y, 12);
  }

  function findInteractable() {
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    const near = [[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
    for (const [dx, dy] of near) {
      const wx = px + dx, wy = py + dy;
      const tile = getTile(wx, wy);
      if (tile === TILES.QUEST || tile === TILES.BOSS) {
        const s = state.structures.get(tileKey(wx, wy)) || state.structures.get(tileKey(wx - 1, wy));
        if (s && !s.done) return { type: s.type, data: s };
      }
      if (tile === TILES.DUNGEON) {
        const s = state.structures.get(tileKey(wx, wy)) || state.structures.get(tileKey(wx - 1, wy));
        if (s && s.type === "dungeon_entrance") return { type: "dungeon_entrance", data: s };
      }
      if (tile === TILES.CHEST) {
        const c = state.chests.get(tileKey(wx, wy));
        if (c && !c.opened) return { type: "chest", data: c };
      }
      if (state.dungeon?.active) {
        if (tile === TILES.STAIRS) return { type: "stairs", data: state.dungeon.stairs };
        if (tile === TILES.EXIT) return { type: "exit", data: state.dungeon.exit };
        if (tile === TILES.BOSS && state.dungeon.floor === 10) return { type: "boss_tile", data: state.dungeon.bossTile };
        const dc = state.dungeon.chests.find((c) => c.x === wx && c.y === wy && !c.opened);
        if (dc) return { type: "chest", data: dc };
      }
    }
    return null;
  }

  function tryInteract() {
    if (state.paused || !state.running) return;
    const target = findInteractable();
    if (!target) return;
    if (target.type === "quest") startQuest(target.data);
    else if (target.type === "boss") startBoss(target.data);
    else if (target.type === "dungeon_entrance") enterDungeon(target.data);
    else if (target.type === "chest") openChest(target.data);
    else if (target.type === "stairs") nextDungeonFloor();
    else if (target.type === "exit") leaveDungeon();
    else if (target.type === "boss_tile") {
      if (!state.dungeon.bossStarted) {
        state.dungeon.bossStarted = true;
        startBoss({ name: `${state.dungeon.name} Guardian`, rank: state.dungeon.rank, done: false });
      }
    }
  }

  function attackMonster(monster) {
    if (!monster || state.hitCd > 0 || state.paused) return;
    const dmg = 5 + gearStats().pwr;
    monster.hp -= dmg;
    state.hitCd = 0.25;
    spawnParticles(monster.x, monster.y, 6);
    if (monster.hp <= 0) {
      state.dungeon.monsters = state.dungeon.monsters.filter((m) => m.id !== monster.id);
      state.kp += 3 + state.dungeon.floor;
      showToast(`${monster.type} defeated! +${dmg} dmg`);
      if (state.dungeon.floor === 10 && state.dungeon.monsters.length === 0 && !state.dungeon.bossStarted) {
        state.dungeon.bossStarted = true;
        setTimeout(() => startBoss({ name: `${state.dungeon.name} Guardian`, rank: state.dungeon.rank, done: false }), 400);
      }
    } else {
      showToast(`Hit ${monster.type} for ${dmg}!`);
    }
  }

  function monsterAtWorld(wx, wy) {
    if (!state.dungeon?.active) return null;
    for (const m of state.dungeon.monsters) {
      if (Math.hypot(m.x - wx, m.y - wy) < 0.55) return m;
    }
    return null;
  }

  function handleCanvasClick(e) {
    if (!state.running || state.paused) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const fov = state.settings.fov;
    const w = canvas.width, h = canvas.height;
    const tileSize = Math.max(10, Math.floor(Math.min(w, h) / fov));
    const camX = state.player.x, camY = state.player.y;
    const wx = camX + (cx - w / 2) / tileSize;
    const wy = camY + (cy - h / 2) / tileSize;
    if (state.dungeon?.active) {
      const m = monsterAtWorld(wx, wy);
      if (m) { attackMonster(m); return; }
    }
    if (state.interactTarget) tryInteract();
  }

  function playerHurt(dmg) {
    const def = gearStats().def;
    const taken = Math.max(1, dmg - Math.floor(def * 0.5));
    state.hp -= taken;
    state.hurtCd = 0.8;
    recalcHp();
    if (state.hp <= 0) {
      state.hp = state.maxHp;
      respawnToBeginning();
      showToast("You fell in battle! Respawned at the gate — gear kept.", true);
    } else {
      showToast(`Took ${taken} damage!`, true);
    }
  }

  function updateMonsters(dt) {
    if (!state.dungeon?.active) return;
    const px = state.player.x, py = state.player.y;
    for (const m of state.dungeon.monsters) {
      const dx = px - m.x, dy = py - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8 && dist > 0.4) {
        const spd = m.spd * dt;
        const nx = m.x + (dx / dist) * spd;
        const ny = m.y + (dy / dist) * spd;
        if (!isSolidTile(getTile(Math.floor(nx), Math.floor(m.y)))) m.x = nx;
        if (!isSolidTile(getTile(Math.floor(m.x), Math.floor(ny)))) m.y = ny;
      }
      if (dist < 0.55 && state.hurtCd <= 0) playerHurt(m.dmg);
      if (m.hitCd > 0) m.hitCd -= dt;
    }
    if (state.dungeon.floor === 10 && state.dungeon.monsters.length === 0) {
      const bt = state.dungeon.bossTile;
      if (bt && Math.hypot(px - bt.x - 0.5, py - bt.y - 0.5) < 1.2 && !state.dungeon.bossStarted) {
        state.dungeon.bossStarted = true;
        startBoss({ name: `${state.dungeon.name} Guardian`, rank: state.dungeon.rank, done: false });
      }
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
    if (!state.dungeon?.active) {
      const { cx, cy } = worldToChunk(Math.floor(state.player.x), Math.floor(state.player.y));
      const rd = state.settings.renderDist;
      for (let y = -rd; y <= rd; y++) for (let x = -rd; x <= rd; x++) ensureChunk(cx + x, cy + y);
    }
    if (state.hitCd > 0) state.hitCd -= dt;
    if (state.hurtCd > 0) state.hurtCd -= dt;
    updateMonsters(dt);
    state.interactTarget = findInteractable();
    $("interact-prompt").classList.toggle("hidden", !state.interactTarget);
  }


  function pxRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }

  function drawTileArt(tile, px, py, ts, wx, wy) {
    const c = (wx + wy) & 1;
    const shade = (base, alt) => (c ? base : alt);
    switch (tile) {
      case TILES.GRASS:
        pxRect(px, py, ts, ts, shade("#3f6a38", "#356032"));
        pxRect(px + 1, py + ts * 0.25, 2, 4, "#5a8a42");
        pxRect(px + ts * 0.35, py + ts * 0.15, 2, 3, "#6a9a4a");
        pxRect(px + ts * 0.65, py + ts * 0.5, 2, 4, "#4a7838");
        pxRect(px + ts * 0.2, py + ts * 0.7, 3, 2, "#2a5028");
        break;
      case TILES.DIRT:
        pxRect(px, py, ts, ts, shade("#6b523c", "#5c4634"));
        pxRect(px + 2, py + 3, 3, 2, "#4a3828");
        pxRect(px + ts * 0.55, py + ts * 0.6, 4, 2, "#7a6048");
        pxRect(px + ts * 0.2, py + ts * 0.35, 2, 2, "#524030");
        break;
      case TILES.MOSS:
        pxRect(px, py, ts, ts, "#3a5030");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#4a7040");
        pxRect(px + 3, py + 4, ts - 6, 2, "#3a5830");
        pxRect(px + 4, py + ts * 0.6, 2, 3, "#5a8850");
        break;
      case TILES.STONE:
        pxRect(px, py, ts, ts, shade("#6a6660", "#5a5650"));
        pxRect(px, py, ts, 2, "#7a7670");
        pxRect(px + ts * 0.3, py + ts * 0.45, ts * 0.5, 1, "#4a4640");
        pxRect(px + 2, py + 2, 3, 2, "#8a8680");
        pxRect(px + ts * 0.55, py + ts * 0.2, 2, 4, "#3a3630");
        break;
      case TILES.COBBLE:
        pxRect(px, py, ts, ts, "#5a5248");
        pxRect(px + 1, py + 1, ts * 0.45, ts * 0.4, "#6a6258");
        pxRect(px + ts * 0.5, py + ts * 0.45, ts * 0.45, ts * 0.45, "#4a443c");
        pxRect(px + ts * 0.25, py + ts * 0.65, 3, 2, "#3a342c");
        break;
      case TILES.RUIN:
        pxRect(px, py, ts, ts, "#7a6a58");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#5a4a3a");
        pxRect(px + 3, py + 3, 2, ts - 6, "#3a3028");
        pxRect(px + ts * 0.6, py + 4, 2, ts - 8, "#4a4030");
        break;
      case TILES.WATER: {
        pxRect(px, py, ts, ts, "#1e4a60");
        const wave = Math.sin(state.animT * 3 + wx * 0.7 + wy * 0.4) > 0;
        pxRect(px + 1, py + ts * 0.3, ts - 2, 2, wave ? "#5a90a8" : "#3a7088");
        pxRect(px + 3, py + ts * 0.55, ts - 6, 1, "#7ab0c0");
        pxRect(px + ts * 0.5, py + ts * 0.15, 4, 2, "#2a6078");
        break;
      }
      case TILES.SAND:
        pxRect(px, py, ts, ts, shade("#d4b87a", "#c4a86a"));
        pxRect(px + 3, py + 5, 3, 1, "#e8cc90");
        pxRect(px + ts * 0.6, py + ts * 0.35, 2, 2, "#b8a060");
        break;
      case TILES.PATH:
        pxRect(px, py, ts, ts, shade("#9a8468", "#8a7458"));
        pxRect(px + 1, py + 1, 3, 2, "#b09a78");
        pxRect(px + ts * 0.55, py + ts * 0.5, 4, 2, "#7a6848");
        break;
      case TILES.FLOOR:
        pxRect(px, py, ts, ts, "#4a3828");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#5a4834");
        pxRect(px + 2, py + ts * 0.5, ts - 4, 1, "#3a2818");
        pxRect(px + ts * 0.3, py + 3, ts * 0.4, 1, "#6a5840");
        break;
      case TILES.WALL:
        pxRect(px, py, ts, ts, "#1a1410");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#2a241c");
        pxRect(px, py, 2, ts, "#0e0c0a");
        pxRect(px, py, ts, 2, "#3a342c");
        pxRect(px + ts * 0.25, py + ts * 0.35, 2, 3, "#14100c");
        pxRect(px + ts * 0.65, py + ts * 0.55, 3, 2, "#1e1a14");
        break;
      case TILES.LAVA: {
        const pulse = 0.5 + Math.sin(state.animT * 4 + wx + wy) * 0.5;
        pxRect(px, py, ts, ts, "#4a1008");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, pulse > 0.5 ? "#e06030" : "#b03018");
        pxRect(px + ts * 0.35, py + ts * 0.25, 4, 4, "#f0c060");
        pxRect(px + ts * 0.55, py + ts * 0.6, 3, 2, "#ff8040");
        break;
      }
      case TILES.TREE:
        pxRect(px, py, ts, ts, shade("#2a4828", "#244020"));
        pxRect(px + ts * 0.42, py + ts * 0.48, ts * 0.16, ts * 0.52, "#4a3020");
        pxRect(px + ts * 0.12, py + ts * 0.05, ts * 0.76, ts * 0.5, "#2e5a28");
        pxRect(px + ts * 0.25, py + ts * 0.15, ts * 0.5, ts * 0.32, "#3e7a38");
        pxRect(px + ts * 0.38, py + ts * 0.22, ts * 0.24, ts * 0.18, "#4a9040");
        break;
      case TILES.FLOWER:
        pxRect(px, py, ts, ts, "#356032");
        pxRect(px + ts * 0.46, py + ts * 0.42, 2, ts * 0.38, "#2a5020");
        pxRect(px + ts * 0.32, py + ts * 0.28, 6, 6, "#d07050");
        pxRect(px + ts * 0.44, py + ts * 0.36, 3, 3, "#f0d060");
        pxRect(px + ts * 0.58, py + ts * 0.3, 3, 3, "#c05040");
        break;
      case TILES.FENCE:
        pxRect(px, py, ts, ts, "#5a7848");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#8a7458");
        pxRect(px + ts * 0.18, py + 3, 3, ts - 6, "#5a4430");
        pxRect(px + ts * 0.62, py + 3, 3, ts - 6, "#5a4430");
        pxRect(px + 3, py + ts * 0.32, ts - 6, 3, "#c4a574");
        pxRect(px + 3, py + ts * 0.62, ts - 6, 2, "#a08050");
        break;
      case TILES.BANNER:
        pxRect(px, py, ts, ts, "#6b8f5a");
        pxRect(px + ts * 0.44, py + 2, 2, ts - 4, "#5a4430");
        pxRect(px + ts * 0.18, py + 3, ts * 0.55, ts * 0.42, "#c97852");
        pxRect(px + ts * 0.28, py + 6, ts * 0.35, ts * 0.22, "#f0c96a");
        pxRect(px + ts * 0.35, py + 8, 2, ts * 0.25, "#8a5030");
        break;
      case TILES.DOOR:
        pxRect(px, py, ts, ts, "#5c4634");
        pxRect(px + 2, py + 2, ts - 4, ts - 3, "#3a2818");
        pxRect(px + 3, py + 3, ts - 6, ts - 5, "#4a3420");
        pxRect(px + ts * 0.62, py + ts * 0.48, 2, 2, "#f0c96a");
        pxRect(px + ts * 0.35, py + 2, ts * 0.3, 2, "#6a5038");
        break;
      case TILES.VILLAGE:
        pxRect(px, py, ts, ts, "#7a6040");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#c4a574");
        pxRect(px + ts * 0.28, py + ts * 0.32, ts * 0.44, ts * 0.38, "#5a90c0");
        pxRect(px + ts * 0.44, py + ts * 0.32, 2, ts * 0.38, "#3a6080");
        pxRect(px + ts * 0.28, py + ts * 0.48, ts * 0.44, 2, "#3a6080");
        pxRect(px + 2, py + ts - 3, ts - 4, 2, "#8a6848");
        break;
      case TILES.DUNGEON:
        pxRect(px, py, ts, ts, "#120810");
        pxRect(px + 2, py + 2, ts - 4, ts - 4, "#3a1820");
        pxRect(px + ts * 0.22, py + ts * 0.15, ts * 0.56, ts * 0.6, "#060408");
        pxRect(px + ts * 0.32, py + ts * 0.3, 4, 4, "#e06a55");
        pxRect(px + ts * 0.56, py + ts * 0.3, 4, 4, "#e06a55");
        pxRect(px + ts * 0.38, py + ts * 0.55, ts * 0.24, 3, "#1a0808");
        pxRect(px + ts * 0.15, py + 2, 3, ts - 4, "#2a1018");
        pxRect(px + ts * 0.78, py + 2, 3, ts - 4, "#2a1018");
        break;
      case TILES.TORCH: {
        pxRect(px, py, ts, ts, "#2a2018");
        pxRect(px + ts * 0.38, py + ts * 0.32, 4, ts * 0.58, "#5a4030");
        const flicker = Math.sin(state.animT * 10 + wx * 3) > 0;
        pxRect(px + ts * 0.32, py + ts * 0.12, 6, 8, flicker ? "#f0c060" : "#e06030");
        pxRect(px + ts * 0.38, py + ts * 0.08, 4, 4, "#fff0a0");
        pxRect(px + ts * 0.1, py + ts * 0.2, ts * 0.8, ts * 0.7, "rgba(240,160,48,0.08)");
        break;
      }
      case TILES.CHEST: {
        const bob = Math.sin(state.animT * 3 + wx) * 1;
        pxRect(px, py, ts, ts, "#3a3028");
        pxRect(px + 2, py + 4 + bob, ts - 4, ts - 6, "#8a6030");
        pxRect(px + 2, py + 2 + bob, ts - 4, 4, "#a07038");
        pxRect(px + ts * 0.42, py + 5 + bob, 3, 3, "#f0c96a");
        pxRect(px + 3, py + 3 + bob, ts - 6, 2, "#6a4820");
        break;
      }
      case TILES.STAIRS:
        pxRect(px, py, ts, ts, "#3a3028");
        for (let i = 0; i < 4; i++) pxRect(px + 2 + i * 2, py + 2 + i * 3, ts - 4 - i * 2, 2, i % 2 ? "#6a5840" : "#5a4830");
        pxRect(px + ts * 0.35, py + ts * 0.2, 4, 4, "#40c0ff");
        break;
      case TILES.EXIT: {
        const pulse = 0.7 + Math.sin(state.animT * 4) * 0.3;
        pxRect(px, py, ts, ts, "#1a2838");
        pxRect(px + 3, py + 3, ts - 6, ts - 6, `rgba(80,180,255,${pulse})`);
        pxRect(px + ts * 0.35, py + ts * 0.2, ts * 0.3, ts * 0.6, "#60b0ff");
        break;
      }
      case TILES.QUEST: {
        const bob = Math.sin(state.animT * 4) * 2;
        pxRect(px, py, ts, ts, "#8a7458");
        pxRect(px + ts * 0.22, py + ts * 0.18 + bob, ts * 0.56, ts * 0.58, "#f0c96a");
        pxRect(px + ts * 0.32, py + ts * 0.32 + bob, ts * 0.36, ts * 0.28, "#1a1612");
        pxRect(px + ts * 0.4, py + ts * 0.4 + bob, 4, 4, "#f0c96a");
        break;
      }
      case TILES.BOSS: {
        const pulse = 0.85 + Math.sin(state.animT * 5) * 0.15;
        pxRect(px, py, ts, ts, "#1a0808");
        const s = ts * 0.72 * pulse;
        pxRect(px + (ts - s) / 2, py + (ts - s) / 2 - 2, s, s, "#b54a3c");
        pxRect(px + ts * 0.26, py + ts * 0.3, 4, 4, "#f0e0a0");
        pxRect(px + ts * 0.58, py + ts * 0.3, 4, 4, "#f0e0a0");
        pxRect(px + ts * 0.34, py + ts * 0.55, ts * 0.32, 3, "#1a0908");
        break;
      }
      default:
        pxRect(px, py, ts, ts, "#333");
    }
  }

  function drawRoof(px, py, ts, wx, wy) {
    pxRect(px, py, ts, ts, "rgba(0,0,0,0.15)");
    for (let i = 0; i < ts / 2; i++) {
      pxRect(px + i, py + ts / 2 - i, ts - i * 2, 2, i % 2 ? "#a65d3f" : "#8a4030");
    }
    pxRect(px + ts * 0.15, py + ts * 0.15, ts * 0.7, 2, "#c08050");
    pxRect(px + 2, py + ts - 3, ts - 4, 2, "#5a3828");
    pxRect(px + ts * 0.35, py + 4, 3, 3, "#4a3020");
  }

  function drawPlayer(ppx, ppy, ps) {
    const armor = state.equipped.armor;
    const weapon = state.equipped.weapon;
    const body = armor
      ? (armor.rarity === "legendary" ? "#d4a84b" : armor.rarity === "epic" ? "#a060c0" : armor.rarity === "rare" ? "#6a90c0" : "#6b8f5a")
      : "#6b8f5a";
    pxRect(ppx - ps / 2 + 1, ppy - ps / 2 + 2, ps, ps, "#0a0808");
    pxRect(ppx - ps / 2, ppy - ps / 2, ps, ps * 0.42, "#c4a574");
    pxRect(ppx - ps * 0.15, ppy - ps * 0.38, ps * 0.3, ps * 0.2, "#8a6848");
    pxRect(ppx - ps / 2, ppy - ps / 2 + ps * 0.38, ps, ps * 0.62, body);
    pxRect(ppx - ps * 0.35, ppy - ps * 0.05, ps * 0.7, 2, armor ? "#ffffff22" : "#00000022");
    const lookX = Math.cos(state.player.facing) * 2;
    const lookY = Math.sin(state.player.facing) * 1;
    pxRect(ppx - 3 + lookX, ppy - ps * 0.12 + lookY, 2, 2, "#1a1612");
    pxRect(ppx + 1 + lookX, ppy - ps * 0.12 + lookY, 2, 2, "#1a1612");
    pxRect(ppx - 2 + lookX, ppy - ps * 0.2 + lookY, 4, 1, "#8a6848");
    if (weapon) {
      const wx = ppx + ps / 2 - 1 + lookX;
      const wy = ppy - 2 + lookY;
      pxRect(wx, wy, 3, ps * 0.75, "#c8c8c8");
      pxRect(wx - 1, wy - 3, 5, 3, "#f0c96a");
      pxRect(wx, wy + ps * 0.5, 2, 3, "#a0a0a0");
    }
    if (state.hurtCd > 0) {
      ctx.globalAlpha = 0.35;
      pxRect(ppx - ps / 2, ppy - ps / 2, ps, ps, "#ff2020");
      ctx.globalAlpha = 1;
    }
  }

  function drawMonster(m, px, py, ts) {
    const bob = Math.sin(state.animT * 6 + m.x) * 1.5;
    const s = ts * 0.55;
    pxRect(px - s / 2, py - s / 2 + bob, s, s, m.body || m.color);
    pxRect(px - s * 0.3, py - s * 0.35 + bob, s * 0.22, s * 0.22, m.eye || "#fff");
    pxRect(px + s * 0.08, py - s * 0.35 + bob, s * 0.22, s * 0.22, m.eye || "#fff");
    if (m.type === "rat") pxRect(px - s * 0.4, py + s * 0.1 + bob, s * 0.8, s * 0.25, m.color);
    if (m.type === "spider") {
      pxRect(px - s * 0.45, py + bob, 3, 2, m.color);
      pxRect(px + s * 0.3, py + bob, 3, 2, m.color);
    }
    if (m.type === "bat") pxRect(px - s * 0.5, py - s * 0.1 + bob, s, s * 0.35, "#2a1830");
    const hpPct = m.hp / m.maxHp;
    pxRect(px - s / 2, py - s / 2 - 4 + bob, s, 3, "#1a1010");
    pxRect(px - s / 2, py - s / 2 - 4 + bob, s * hpPct, 3, hpPct > 0.4 ? "#40c060" : "#e04040");
  }

  function resizeCanvas() {
    const wrap = $("game-wrap");
    const w = Math.max(320, wrap.clientWidth || window.innerWidth);
    const h = Math.max(180, wrap.clientHeight || window.innerHeight - 52);
    const scale = Math.max(1, Math.floor(Math.min(w / 320, h / 180)));
    const tw = Math.max(320, Math.floor(w / scale));
    const th = Math.max(180, Math.floor(h / scale));
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
      ctx.imageSmoothingEnabled = false;
    }
  }

  function draw() {
    resizeCanvas();
    const w = canvas.width, h = canvas.height;
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = state.dungeon?.active ? "#0a0608" : "#0a0908";
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

    if (!state.dungeon?.active) {
      for (const b of state.buildings.values()) {
        if (playerInsideBuilding(b)) continue;
        for (const r of b.roof) {
          const px = Math.floor((r.wx - camX) * tileSize + w / 2);
          const py = Math.floor((r.wy - camY) * tileSize + h / 2);
          if (px > -tileSize && py > -tileSize && px < w + tileSize && py < h + tileSize) {
            drawRoof(px, py, tileSize, r.wx, r.wy);
          }
        }
      }
    }

    if (state.dungeon?.active) {
      for (const m of state.dungeon.monsters) {
        const px = Math.floor((m.x - camX) * tileSize + w / 2);
        const py = Math.floor((m.y - camY) * tileSize + h / 2);
        drawMonster(m, px, py, tileSize);
      }
    }

    const ppx = Math.floor(w / 2), ppy = Math.floor(h / 2);
    const ps = Math.max(8, tileSize * 0.55);
    drawPlayer(ppx, ppy, ps);

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
    grd.addColorStop(1, state.dungeon?.active ? "rgba(4,0,8,0.65)" : "rgba(8,6,4,0.55)");
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
    const range = state.dungeon?.active ? Math.max(state.dungeon.w, state.dungeon.h) / 2 : 40;
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        if ((x + y) % 2) continue;
        const wx = state.dungeon?.active
          ? Math.floor((x / s) * state.dungeon.w)
          : px + Math.floor((x / s) * range * 2) - range;
        const wy = state.dungeon?.active
          ? Math.floor((y / s) * state.dungeon.h)
          : py + Math.floor((y / s) * range * 2) - range;
        const tile = getTile(wx, wy);
        let c = "#3d5c32";
        if (tile === TILES.WATER) c = "#2a4a5c";
        else if (tile === TILES.LAVA) c = "#e06030";
        else if (tile === TILES.STONE || tile === TILES.WALL) c = "#5a5650";
        else if (tile === TILES.SAND) c = "#c4a86a";
        else if (tile === TILES.PATH || tile === TILES.FLOOR || tile === TILES.COBBLE) c = "#8a7458";
        else if (tile === TILES.QUEST) c = "#f0c96a";
        else if (tile === TILES.BOSS) c = "#e06a55";
        else if (tile === TILES.VILLAGE || tile === TILES.DOOR || tile === TILES.BANNER || tile === TILES.FENCE) c = "#d4a060";
        else if (tile === TILES.DUNGEON || tile === TILES.TORCH) c = "#8a2030";
        else if (tile === TILES.CHEST) c = "#c09030";
        else if (tile === TILES.STAIRS || tile === TILES.EXIT) c = "#40a0ff";
        else if (tile === TILES.TREE) c = "#2a4028";
        miniCtx.fillStyle = c;
        miniCtx.fillRect(x, y, 2, 2);
      }
    }
    if (state.dungeon?.active) {
      for (const m of state.dungeon.monsters) {
        const mx = Math.floor((m.x / state.dungeon.w) * s);
        const my = Math.floor((m.y / state.dungeon.h) * s);
        miniCtx.fillStyle = "#ff4040";
        miniCtx.fillRect(mx, my, 2, 2);
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
    state.hp = 100;
    state.maxHp = 100;
    state.inventory = [];
    state.equipped = { weapon: null, armor: null, tool: null, book: null };
    state.chunks.clear();
    state.structures.clear();
    state.buildings.clear();
    state.chests.clear();
    state.usedQuestions.clear();
    state.particles = [];
    state.dungeon = null;
    state.spawn = { x: 8.5, y: 8.5 };
    state.checkpoint = { ...state.spawn };
    state.overworldReturn = { ...state.spawn };
    state.player = { x: 8.5, y: 8.5, facing: 0 };
    state.paused = false;
    state.running = true;
    state.bossFight = null;
    state.hitCd = 0;
    state.hurtCd = 0;

    const starter = LOOT_TABLE.find((l) => l.key === "primer");
    if (starter) state.inventory.push({ ...starter, uid: "starter-book" });

    ensureChunk(0, 0);
    $("start-screen").classList.remove("active");
    $("game-screen").classList.add("active");
    updateInventoryUI();
    updateDungeonUI();
    recalcHp();
    updateHUD();
    applyMobileVisibility();

    requestAnimationFrame(() => {
      resizeCanvas();
      draw();
      showToast(`Grade ${state.grade} · ${state.bookTitle}. Gold roofs = villages, red = dungeons.`);
    });
  }

  function quitToMenu() {
    state.running = false;
    state.paused = false;
    state.dungeon = null;
    ["settings-modal", "inventory-modal", "quest-modal", "boss-modal", "result-modal"].forEach(closeModal);
    $("game-screen").classList.remove("active");
    $("start-screen").classList.add("active");
    $("combat-hint").classList.add("hidden");
    $("hud-floor-wrap").classList.add("hidden");
  }

  function applyMobileVisibility() {
    const force = state.settings.forceMobile;
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const narrow = window.innerWidth <= 640;
    $("mobile-controls").classList.toggle("visible", force || coarse || narrow);
  }

  $("subject-select").addEventListener("change", refreshBookSelect);
  $("grade-select").addEventListener("change", refreshBookSelect);
  refreshBookSelect();

  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("player-name").value.trim() || "Scholar";
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const book = selectedBook();
    if (!book) {
      alert("Please select a textbook.");
      return;
    }
    const difficulty = (document.querySelector('input[name="difficulty"]:checked') || {}).value || "easy";
    startGame({ name, subject, grade, bookId: book.id, bookTitle: book.title, difficulty });
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
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("resize", () => { applyMobileVisibility(); if (state.running) resizeCanvas(); });

  applyMobileVisibility();
  requestAnimationFrame(frame);
})();
