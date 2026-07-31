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
    { key: "wood_blade", name: "Wood Sword", slot: "weapon", rarity: "common", pwr: 1, def: 0, know: 0 },
    { key: "short_bow", name: "Short Bow", slot: "bow", rarity: "common", pwr: 2, def: 0, know: 0, range: 5.5 },
    { key: "wood_pick", name: "Wood Pickaxe", slot: "tool", rarity: "common", pwr: 0, def: 0, know: 0, mine: 1 },
    { key: "slate_chalk", name: "Slate & Chalk", slot: "tool", rarity: "common", pwr: 0, def: 0, know: 1 },
    { key: "linen_cloak", name: "Linen Cloak", slot: "armor", rarity: "common", pwr: 0, def: 1, know: 0 },
    { key: "wood_shield", name: "Wood Buckler", slot: "armor", rarity: "common", pwr: 0, def: 2, know: 0, shield: true },
    { key: "primer", name: "Pocket Primer", slot: "book", rarity: "common", pwr: 0, def: 0, know: 2 },
    { key: "iron_quill", name: "Iron Quill Blade", slot: "weapon", rarity: "uncommon", pwr: 3, def: 0, know: 1 },
    { key: "leather_vest", name: "Scholar's Leather", slot: "armor", rarity: "uncommon", pwr: 0, def: 3, know: 0 },
    { key: "iron_shield", name: "Iron Kite Shield", slot: "armor", rarity: "uncommon", pwr: 0, def: 5, know: 0, shield: true },
    { key: "compass", name: "Ruin Compass", slot: "tool", rarity: "uncommon", pwr: 1, def: 0, know: 2 },
    { key: "hunter_bow", name: "Hunter Bow", slot: "bow", rarity: "uncommon", pwr: 4, def: 0, know: 0, range: 6.5 },
    { key: "iron_pick", name: "Iron Pickaxe", slot: "tool", rarity: "uncommon", pwr: 1, def: 0, know: 0, mine: 2 },
    { key: "field_notes", name: "Field Notes", slot: "book", rarity: "uncommon", pwr: 0, def: 0, know: 4 },
    { key: "bronze_saber", name: "Bronze Saber", slot: "weapon", rarity: "rare", pwr: 5, def: 1, know: 0 },
    { key: "chain_hood", name: "Chain Hood", slot: "armor", rarity: "rare", pwr: 0, def: 5, know: 1 },
    { key: "tower_shield", name: "Tower Shield", slot: "armor", rarity: "rare", pwr: 0, def: 7, know: 0, shield: true },
    { key: "pick_lens", name: "Crystal Pick-Lens", slot: "tool", rarity: "rare", pwr: 3, def: 0, know: 3, mine: 3 },
    { key: "longbow", name: "Ruin Longbow", slot: "bow", rarity: "rare", pwr: 6, def: 0, know: 1, range: 7.5 },
    { key: "annotated", name: "Annotated Codex", slot: "book", rarity: "rare", pwr: 1, def: 0, know: 6 },
    { key: "runed_edge", name: "Runed Edge", slot: "weapon", rarity: "epic", pwr: 8, def: 2, know: 2 },
    { key: "guardian_plate", name: "Guardian Plate", slot: "armor", rarity: "epic", pwr: 1, def: 9, know: 1 },
    { key: "aegis_shield", name: "Aegis Shield", slot: "armor", rarity: "epic", pwr: 0, def: 11, know: 1, shield: true },
    { key: "aether_hammer", name: "Aether Hammer", slot: "tool", rarity: "epic", pwr: 6, def: 1, know: 4, mine: 4 },
    { key: "storm_bow", name: "Storm Bow", slot: "bow", rarity: "epic", pwr: 9, def: 1, know: 1, range: 8.5 },
    { key: "elder_tome", name: "Elder Tome", slot: "book", rarity: "epic", pwr: 2, def: 1, know: 10 },
    { key: "eclipse_blade", name: "Eclipse Blade", slot: "weapon", rarity: "legendary", pwr: 12, def: 3, know: 3 },
    { key: "starfall_mail", name: "Starfall Mail", slot: "armor", rarity: "legendary", pwr: 2, def: 14, know: 2 },
    { key: "eclipse_aegis", name: "Eclipse Aegis", slot: "armor", rarity: "legendary", pwr: 1, def: 16, know: 1, shield: true },
    { key: "world_spade", name: "Worldspade", slot: "tool", rarity: "legendary", pwr: 9, def: 2, know: 6, mine: 5 },
    { key: "eclipse_bow", name: "Eclipse Bow", slot: "bow", rarity: "legendary", pwr: 12, def: 2, know: 2, range: 10 },
    { key: "codex_eternity", name: "Codex of Eternity", slot: "book", rarity: "legendary", pwr: 4, def: 2, know: 16 },
  ];

  const POTION_TABLE = [
    { key: "heal_small", name: "Minor Healing Potion", type: "consumable", effect: "heal", amount: 30, rarity: "common" },
    { key: "heal_med", name: "Healing Potion", type: "consumable", effect: "heal", amount: 55, rarity: "uncommon" },
    { key: "heal_big", name: "Greater Healing Potion", type: "consumable", effect: "heal", amount: 90, rarity: "rare" },
    { key: "breath_vial", name: "Breath Vial", type: "consumable", effect: "breath", amount: 100, rarity: "uncommon" },
    { key: "might_draught", name: "Might Draught", type: "consumable", effect: "might", amount: 4, rarity: "rare" },
    { key: "elixir", name: "Scholar's Elixir", type: "consumable", effect: "heal", amount: 50, rarity: "epic", alsoBreath: true },
  ];

  const GATE_RANKS = ["E", "D", "C", "B", "A", "S"];

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
    { name: "Floor 1 · Rat Warren", monster: "rat", hp: 14, dmg: 6, spd: 1.6, color: "#8a6040", body: "#6a4830", eye: "#1a1008" },
    { name: "Floor 2 · Ossuary", monster: "skeleton", hp: 22, dmg: 8, spd: 1.4, color: "#d8d0c0", body: "#c0b8a8", eye: "#40c0ff" },
    { name: "Floor 3 · Spider Nest", monster: "spider", hp: 18, dmg: 7, spd: 2.0, color: "#3a2830", body: "#2a1820", eye: "#ff4040" },
    { name: "Floor 4 · Slime Pits", monster: "slime", hp: 26, dmg: 5, spd: 1.2, color: "#40c060", body: "#30a048", eye: "#102010" },
    { name: "Floor 5 · Bat Caverns", monster: "bat", hp: 16, dmg: 9, spd: 2.4, color: "#4a3858", body: "#3a2848", eye: "#f0c040" },
    { name: "Floor 6 · Cultist Sanctum", monster: "cultist", hp: 30, dmg: 10, spd: 1.5, color: "#6a2848", body: "#4a1838", eye: "#e060a0" },
    { name: "Floor 7 · Knight's Hall", monster: "knight", hp: 38, dmg: 12, spd: 1.3, color: "#708090", body: "#506070", eye: "#f0e0a0" },
    { name: "Floor 8 · Demon Forge", monster: "demon", hp: 44, dmg: 14, spd: 1.7, color: "#a03020", body: "#801810", eye: "#ff8040" },
    { name: "Floor 9 · Shadow Vault", monster: "shadow", hp: 36, dmg: 16, spd: 2.1, color: "#282030", body: "#181020", eye: "#a060ff" },
    { name: "Floor 10 · Monarch Throne", monster: "guardian", hp: 60, dmg: 18, spd: 1.2, color: "#c0a040", body: "#a08030", eye: "#ffffff" },
  ];

  const state = {
    running: false,
    paused: false,
    seed: (Date.now() ^ 0x9e3779b9) >>> 0,
    subject: "math",
    grade: 8,
    bookId: "",
    bookTitle: "",
    bookTopics: "",
    difficulty: "easy",
    playerName: "Scholar",
    dayTime: 0.22, // 0..1 — dawn→noon→dusk→night
    dayLength: 220, // seconds for a full day/night cycle
    nightMobs: [],
    nightSpawnCd: 0,
    wasNight: false,
    session: {
      totalSec: 25 * 60,
      remaining: 25 * 60,
      done: false,
      canLeave: false,
      notified: false,
      keepPlaying: false,
    },
    level: 1,
    kp: 0,
    questsDone: 0,
    bossesDefeated: 0,
    hp: 100,
    maxHp: 100,
    breath: 100,
    maxBreath: 100,
    swimming: false,
    footstepCd: 0,
    bubbleCd: 0,
    drownCd: 0,
    inventory: [],
    slots: Array(36).fill(null), // 0-8 hotbar, 9-35 bag (Minecraft-style)
    equipped: { weapon: null, armor: null, tool: null, book: null, bow: null },
    selectedItem: null,
    heldItem: null,
    hotbarSel: 0,
    spawn: { x: 8.5, y: 8.5 },
    checkpoint: { x: 8.5, y: 8.5 },
    overworldReturn: { x: 8.5, y: 8.5 },
    player: { x: 8.5, y: 8.5, facing: 0 },
    keys: Object.create(null),
    settings: { fov: 11, renderDist: 6, speed: 1, minimap: true, particles: true, sound: true, music: true, sfxVolume: 0.75, forceMobile: false },
    floatTexts: [],
    drinkSfxCd: 0,
    chunks: new Map(),
    structures: new Map(),
    buildings: new Map(),
    chests: new Map(),
    dungeon: null,
    pendingDungeon: null,
    interactTarget: null,
    particles: [],
    usedQuestions: new Set(),
    bossFight: null,
    animT: 0,
    hitCd: 0,
    hurtCd: 0,
    attackAnim: 0,
    attackArc: 0,
    swimAnim: 0,
    mineAnim: 0,
    mineTarget: null,
    drinkAnim: 0,
    drinkUid: null,
    drinkItem: null,
    drinkHealAmt: 0,
    lowHpWarned: false,
    blocking: false,
    blockFlash: 0,
    projectiles: [],
    nextId: 1,
  };


  const $ = (id) => document.getElementById(id);
  const canvas = $("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const miniCanvas = $("minimap-canvas");
  const miniCtx = miniCanvas.getContext("2d", { alpha: false });
  const fullMapCanvas = $("fullmap-canvas");
  const fullMapCtx = fullMapCanvas ? fullMapCanvas.getContext("2d", { alpha: false }) : null;
  ctx.imageSmoothingEnabled = false;
  miniCtx.imageSmoothingEnabled = false;
  if (fullMapCtx) fullMapCtx.imageSmoothingEnabled = false;

  /** Synthesized SFX + ambient beds via Web Audio (no external asset files). */
  const SFX = (() => {
    let ac = null;
    let master = null;
    let ambBus = null;
    let pendingVol = 0.75;
    let ambMode = null; // "dungeon" | "forest" | "none"
    let ambMoving = false;
    let ambNodes = [];
    let ambTimers = [];
    let ambGains = {};
    let forestRustleGain = null;
    let lastSyncKey = "";

    function applyMasterGain() {
      if (!master) return;
      const on = state.settings.sound !== false;
      const v = Math.max(0, Math.min(1, pendingVol));
      // Keep SFX punchy over ambient beds
      master.gain.value = on ? 0.9 * v : 0;
    }

    function ensure() {
      try {
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ac = new AC();
          master = ac.createGain();
          applyMasterGain();
          master.connect(ac.destination);
          ambBus = ac.createGain();
          ambBus.gain.value = 0.9;
          ambBus.connect(master);
        }
        if (ac.state === "suspended") {
          ac.resume().catch(() => {});
        }
        return ac;
      } catch (_) {
        return null;
      }
    }

    function unlock() { ensure(); }

    function enabled() {
      return !!(state.settings.sound && (state.settings.sfxVolume ?? pendingVol) > 0.01);
    }

    function musicOn() {
      return enabled() && state.settings.music !== false;
    }

    function level() {
      return Math.max(0, Math.min(1, state.settings.sfxVolume ?? pendingVol));
    }

    function setVolume(v) {
      pendingVol = Math.max(0, Math.min(1, Number(v) || 0));
      state.settings.sfxVolume = pendingVol;
      applyMasterGain();
    }

    function setEnabled(on) {
      state.settings.sound = !!on;
      applyMasterGain();
      if (!on) stopAmbience(true);
      else lastSyncKey = "";
    }

    function setMusicEnabled(on) {
      state.settings.music = !!on;
      lastSyncKey = "";
      if (!on) stopAmbience(true);
    }

    function tone(freq, dur, type, gain, delay = 0, freqEnd = null, dest = null) {
      try {
        const ctx = ensure();
        if (!ctx || !enabled() || !master) return;
        const t0 = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type || "square";
        o.frequency.setValueAtTime(Math.max(1, freq), t0);
        if (freqEnd != null) {
          o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + Math.max(0.01, dur));
        }
        const v = Math.max(0.0001, gain * level());
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g);
        g.connect(dest || master);
        o.start(t0);
        o.stop(t0 + dur + 0.03);
      } catch (_) { /* never break gameplay for audio */ }
    }

    function noiseBurst(dur, gain, filterFreq = 1800, delay = 0, dest = null) {
      try {
        const ctx = ensure();
        if (!ctx || !enabled() || !master) return;
        const n = Math.max(1, Math.floor(ctx.sampleRate * Math.max(0.01, dur)));
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "bandpass";
        filt.frequency.value = filterFreq;
        filt.Q.value = 1.1;
        const g = ctx.createGain();
        const t0 = ctx.currentTime + delay;
        g.gain.setValueAtTime(Math.max(0.0001, gain * level()), t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.01, dur));
        src.connect(filt);
        filt.connect(g);
        g.connect(dest || master);
        src.start(t0);
        src.stop(t0 + Math.max(0.01, dur) + 0.02);
      } catch (_) { /* never break gameplay for audio */ }
    }

    function makeNoiseBuffer(seconds, color = "white") {
      const ctx = ensure();
      if (!ctx) return null;
      const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        const white = Math.random() * 2 - 1;
        if (color === "brown") {
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.5;
        } else if (color === "pink") {
          last = 0.97 * last + 0.03 * white;
          data[i] = last * 2.2;
        } else {
          data[i] = white;
        }
      }
      return buf;
    }

    function startLoopNoise({ color, filterType, filterFreq, q, gain, dest }) {
      const ctx = ensure();
      if (!ctx || !ambBus) return null;
      const buf = makeNoiseBuffer(2.5, color);
      if (!buf) return null;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = filterType || "lowpass";
      filt.frequency.value = filterFreq || 800;
      filt.Q.value = q || 0.7;
      const g = ctx.createGain();
      g.gain.value = Math.max(0.0001, gain * level());
      src.connect(filt);
      filt.connect(g);
      g.connect(dest || ambBus);
      src.start();
      ambNodes.push(src);
      return { src, filt, g };
    }

    function startDrone(freq, type, gain) {
      const ctx = ensure();
      if (!ctx || !ambBus) return null;
      const o = ctx.createOscillator();
      o.type = type || "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = Math.max(0.0001, gain * level());
      o.connect(g);
      g.connect(ambBus);
      o.start();
      ambNodes.push(o);
      return { o, g };
    }

    function clearAmbTimers() {
      for (const t of ambTimers) clearTimeout(t);
      ambTimers = [];
    }

    function stopAmbience(force) {
      clearAmbTimers();
      for (const n of ambNodes) {
        try { if (n.stop) n.stop(); } catch (_) {}
        try { if (n.disconnect) n.disconnect(); } catch (_) {}
      }
      ambNodes = [];
      ambGains = {};
      forestRustleGain = null;
      ambMode = null;
      lastSyncKey = "";
    }

    function schedule(fn, ms) {
      const id = setTimeout(() => {
        ambTimers = ambTimers.filter((x) => x !== id);
        try { fn(); } catch (_) {}
      }, ms);
      ambTimers.push(id);
      return id;
    }

    function startDungeonMusic() {
      const ctx = ensure();
      if (!ctx || !musicOn()) return;
      // Dark drones
      startDrone(49, "sine", 0.07);
      startDrone(73.5, "triangle", 0.035);
      startDrone(98, "sine", 0.02);
      // Cave air / rumble
      startLoopNoise({ color: "brown", filterType: "lowpass", filterFreq: 180, gain: 0.045 });
      // Sparse dripping
      const drip = () => {
        if (ambMode !== "dungeon") return;
        const f = 700 + Math.random() * 900;
        tone(f, 0.12, "sine", 0.035, 0, f * 0.4, ambBus);
        schedule(drip, 1400 + Math.random() * 2200);
      };
      schedule(drip, 800);
      // Minor-ish ambient motif (procedural “music”)
      const motif = [110, 130.81, 146.83, 164.81, 146.83, 123.47, 110, 98];
      let i = 0;
      const playMotif = () => {
        if (ambMode !== "dungeon") return;
        const f = motif[i % motif.length];
        i += 1;
        tone(f, 0.85, "triangle", 0.045, 0, f * 0.92, ambBus);
        tone(f * 1.5, 0.7, "sine", 0.018, 0.05, f * 1.4, ambBus);
        schedule(playMotif, 820 + (i % 4 === 0 ? 400 : 0));
      };
      schedule(playMotif, 400);
    }

    function birdChirp() {
      if (ambMode !== "forest" || !musicOn()) return;
      const base = 1800 + Math.random() * 1400;
      tone(base, 0.07, "sine", 0.045, 0, base * 1.25, ambBus);
      tone(base * 1.15, 0.08, "sine", 0.035, 0.06, base * 0.9, ambBus);
      if (Math.random() < 0.45) {
        tone(base * 0.95, 0.06, "triangle", 0.03, 0.14, base * 1.2, ambBus);
      }
    }

    function startForestNature() {
      const ctx = ensure();
      if (!ctx || !musicOn()) return;
      // Wind / canopy
      const wind = startLoopNoise({ color: "pink", filterType: "bandpass", filterFreq: 650, q: 0.6, gain: 0.04 });
      if (wind) ambGains.wind = wind.g;
      // Leaf bed
      const leaves = startLoopNoise({ color: "brown", filterType: "bandpass", filterFreq: 1200, q: 0.9, gain: 0.028 });
      if (leaves) {
        ambGains.leaves = leaves.g;
        forestRustleGain = leaves.g;
      }
      // Soft forest pad
      startDrone(174.61, "sine", 0.012);
      startDrone(220, "triangle", 0.008);
      // Birds
      const birds = () => {
        if (ambMode !== "forest") return;
        birdChirp();
        const wait = ambMoving ? (700 + Math.random() * 1100) : (1600 + Math.random() * 2800);
        schedule(birds, wait);
      };
      schedule(birds, 500 + Math.random() * 800);
    }

    function setForestMoving(moving) {
      ambMoving = !!moving;
      if (ambMode !== "forest" || !forestRustleGain) return;
      try {
        const ctx = ensure();
        if (!ctx) return;
        const target = (moving ? 0.055 : 0.028) * level();
        forestRustleGain.gain.cancelScheduledValues(ctx.currentTime);
        forestRustleGain.gain.linearRampToValueAtTime(Math.max(0.0001, target), ctx.currentTime + 0.12);
      } catch (_) {}
    }

    function forestStepRustle() {
      if (ambMode !== "forest" || !musicOn()) return;
      noiseBurst(0.09, 0.1, 1400, 0, ambBus);
      noiseBurst(0.06, 0.06, 2400, 0.02, ambBus);
      if (Math.random() < 0.22) birdChirp();
    }

    function syncAmbience({ running, dungeon, biome, moving }) {
      try {
        const want = !running || !musicOn()
          ? "none"
          : dungeon
            ? "dungeon"
            : (biome === "forest" ? "forest" : "none");
        const key = `${want}|${musicOn() ? 1 : 0}|${enabled() ? 1 : 0}`;
        if (key !== lastSyncKey) {
          lastSyncKey = key;
          if (want !== ambMode) {
            stopAmbience(false);
            ambMode = want;
            if (want === "dungeon") startDungeonMusic();
            else if (want === "forest") startForestNature();
          }
        }
        if (want === "forest") setForestMoving(moving);
      } catch (_) {}
    }

    function swordSlash() {
      // Loud whoosh + metallic “SHING” — unmistakable on every swing
      noiseBurst(0.14, 0.55, 1800);
      noiseBurst(0.1, 0.35, 3200, 0.02);
      tone(1400, 0.18, "sawtooth", 0.28, 0.01, 320);
      tone(2200, 0.22, "triangle", 0.24, 0.02, 480);
      tone(3400, 0.16, "sine", 0.18, 0.03, 800);
      tone(4800, 0.12, "sine", 0.12, 0.04, 1200);
    }

    function swordHit() {
      noiseBurst(0.09, 0.55, 900);
      tone(180, 0.12, "square", 0.28, 0, 60);
      tone(900, 0.14, "triangle", 0.2, 0.01, 200);
    }

    function fist() {
      noiseBurst(0.08, 0.4, 420);
      tone(110, 0.1, "sine", 0.3, 0, 45);
    }

    function bow() {
      // Bowstring pull + sharp twang + arrow whoosh
      tone(140, 0.08, "triangle", 0.22, 0, 90);
      noiseBurst(0.1, 0.5, 2400, 0.02);
      tone(520, 0.14, "sine", 0.32, 0.03, 180);
      tone(980, 0.12, "triangle", 0.22, 0.06, 360);
      noiseBurst(0.12, 0.35, 1400, 0.05);
    }

    function bowDry() {
      // Soft misfire / out-of-range cue so bow still “makes sound”
      tone(200, 0.08, "triangle", 0.16, 0, 120);
      noiseBurst(0.06, 0.2, 1800);
    }

    function footstep(surface) {
      // Clear heel–toe walking thuds (much louder than ambience)
      const jit = 0.88 + Math.random() * 0.28;
      const heel = (surface === "stone" ? 85 : surface === "sand" ? 60 : 72) * jit;
      if (surface === "water") {
        noiseBurst(0.12 * jit, 0.42, 700);
        tone(190 * jit, 0.1, "sine", 0.22, 0, 70);
        tone(120 * jit, 0.08, "triangle", 0.14, 0.04, 50);
      } else if (surface === "stone") {
        noiseBurst(0.07 * jit, 0.45, 1100);
        tone(heel, 0.1, "triangle", 0.34, 0, heel * 0.4);
        tone(heel * 1.8, 0.06, "sine", 0.16, 0.035, heel);
      } else if (surface === "sand") {
        noiseBurst(0.11 * jit, 0.4, 850);
        tone(heel, 0.09, "sine", 0.26, 0, heel * 0.45);
      } else if (surface === "forest") {
        noiseBurst(0.09 * jit, 0.42, 950);
        tone(heel, 0.1, "sine", 0.3, 0, heel * 0.4);
        tone(heel * 1.5, 0.06, "triangle", 0.14, 0.03, heel * 0.7);
        forestStepRustle();
      } else {
        // grass / dirt — classic walking footsteps
        noiseBurst(0.08 * jit, 0.48, 600);
        tone(heel, 0.11, "sine", 0.36, 0, heel * 0.42);
        tone(heel * 1.7, 0.07, "triangle", 0.18, 0.04, heel * 0.75);
        noiseBurst(0.05 * jit, 0.22, 1200, 0.05);
      }
    }

    function shieldRaise() {
      noiseBurst(0.08, 0.3, 900);
      tone(220, 0.1, "triangle", 0.22, 0, 140);
      tone(360, 0.08, "sine", 0.14, 0.04, 220);
    }

    function drinkGulp() {
      // Clear liquid gulps while the bottle is at the mouth
      tone(340, 0.09, "sine", 0.2, 0, 150);
      tone(220, 0.11, "sine", 0.16, 0.08, 120);
      tone(280, 0.1, "triangle", 0.14, 0.18, 160);
      noiseBurst(0.05, 0.08, 900, 0.02);
    }

    function healChime() {
      // Bright, unmistakable heal flourish
      noiseBurst(0.12, 0.14, 2400);
      tone(523.25, 0.18, "sine", 0.22, 0);
      tone(659.25, 0.2, "triangle", 0.2, 0.06);
      tone(783.99, 0.26, "sine", 0.2, 0.12);
      tone(1046.5, 0.34, "triangle", 0.18, 0.18);
      tone(1318.5, 0.28, "sine", 0.12, 0.26);
      // Soft sparkle trail
      tone(1568, 0.2, "sine", 0.08, 0.32, 2100);
    }

    function potionPop() {
      // Cork / bottle uncork when drinking starts
      tone(820, 0.08, "triangle", 0.18, 0, 380);
      tone(520, 0.1, "sine", 0.12, 0.03, 260);
      noiseBurst(0.07, 0.18, 1800);
    }

    function healBurst() {
      // Extra HP-restore sting used on successful heal
      tone(392, 0.12, "sine", 0.14, 0, 523);
      tone(523.25, 0.16, "triangle", 0.18, 0.05);
      tone(659.25, 0.22, "sine", 0.16, 0.12);
      noiseBurst(0.1, 0.12, 2800, 0.04);
    }

    function hurt() {
      tone(240, 0.11, "sawtooth", 0.14, 0, 70);
      noiseBurst(0.09, 0.22, 480);
    }

    function mine() {
      noiseBurst(0.04, 0.14, 900);
      tone(140, 0.05, "square", 0.08, 0, 60);
    }

    function ui() {
      tone(700, 0.04, "square", 0.05);
    }

    function chestOpen() {
      // Wooden creak + lid lift
      noiseBurst(0.18, 0.28, 380);
      tone(160, 0.16, "sawtooth", 0.09, 0, 70);
      tone(240, 0.12, "triangle", 0.08, 0.08, 420);
      noiseBurst(0.1, 0.16, 1600, 0.14);
      tone(520, 0.08, "sine", 0.07, 0.18, 900);
    }

    function chestLoot() {
      // Sparkly loot jingle
      tone(880, 0.1, "sine", 0.12, 0);
      tone(1174.7, 0.12, "triangle", 0.1, 0.07);
      tone(1568, 0.16, "sine", 0.11, 0.14);
      tone(2093, 0.2, "sine", 0.07, 0.22);
      noiseBurst(0.12, 0.1, 3200, 0.05);
    }

    function block() {
      noiseBurst(0.1, 0.45, 1200);
      tone(180, 0.12, "triangle", 0.28, 0, 90);
      tone(420, 0.1, "square", 0.16, 0.02, 200);
      tone(800, 0.08, "sine", 0.12, 0.04, 400);
    }

    function questOk() {
      tone(523.25, 0.12, "sine", 0.14, 0);
      tone(659.25, 0.14, "triangle", 0.14, 0.08);
      tone(783.99, 0.22, "sine", 0.16, 0.16);
      tone(1046.5, 0.28, "sine", 0.12, 0.24);
    }

    function questFail() {
      tone(300, 0.18, "sawtooth", 0.14, 0, 120);
      tone(180, 0.22, "triangle", 0.12, 0.1, 80);
      noiseBurst(0.12, 0.16, 400, 0.05);
    }

    function portalEnter() {
      noiseBurst(0.25, 0.22, 600);
      tone(110, 0.3, "sine", 0.14, 0, 220);
      tone(220, 0.35, "triangle", 0.1, 0.08, 440);
      tone(440, 0.28, "sine", 0.08, 0.18, 880);
    }

    function portalExit() {
      tone(440, 0.18, "sine", 0.1, 0, 220);
      tone(330, 0.22, "triangle", 0.1, 0.08, 165);
      noiseBurst(0.15, 0.14, 500, 0.05);
    }

    function levelUp() {
      tone(392, 0.12, "sine", 0.14, 0);
      tone(523.25, 0.14, "sine", 0.14, 0.08);
      tone(659.25, 0.16, "triangle", 0.16, 0.16);
      tone(783.99, 0.2, "sine", 0.14, 0.24);
      tone(1046.5, 0.32, "sine", 0.12, 0.32);
    }

    function equip() {
      tone(480, 0.07, "triangle", 0.12, 0, 320);
      noiseBurst(0.05, 0.1, 1600);
    }

    function monsterDie() {
      noiseBurst(0.12, 0.22, 500);
      tone(140, 0.14, "sawtooth", 0.12, 0, 60);
    }

    function stairs() {
      tone(260, 0.08, "square", 0.08, 0, 200);
      tone(200, 0.08, "square", 0.08, 0.09, 160);
      tone(300, 0.1, "triangle", 0.09, 0.18, 240);
    }

    return {
      unlock, setVolume, setEnabled, setMusicEnabled, syncAmbience, stopAmbience,
      swordSlash, swordHit, fist, bow,
      footstep, drinkGulp, healChime, healBurst, potionPop, hurt, mine, ui,
      chestOpen, chestLoot, block, shieldRaise, bowDry, questOk, questFail,
      portalEnter, portalExit, levelUp, equip, monsterDie, stairs,
    };
  })();

  function unlockAudio() { try { SFX.unlock(); } catch (_) {} }

  const mapView = {
    zoom: "mid",
    ranges: { near: 48, mid: 96, far: 160 },
    panX: 0,
    panY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

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
    const custom = ($("custom-book") && $("custom-book").value.trim()) || "";
    const id = $("book-select").value;
    const preset = booksFor(subject, grade).find((b) => b.id === id) || null;
    const typedTopics = ($("book-topics") && $("book-topics").value.trim()) || "";
    if (custom) {
      return {
        id: preset && preset.title === custom ? preset.id : "custom",
        title: custom,
        grades: [grade],
        topics: typedTopics || (preset && preset.title === custom ? preset.topics : "your study book"),
      };
    }
    if (preset) return { ...preset, topics: typedTopics || preset.topics };
    return booksFor(subject, grade)[0] || null;
  }

  function selectBook(bookId) {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const list = booksFor(subject, grade);
    const book = list.find((b) => b.id === bookId) || list[0];
    if (!book) return;
    $("book-select").value = book.id;
    if ($("custom-book")) $("custom-book").value = book.title;
    if ($("book-topics")) $("book-topics").value = book.topics;
    $("book-list").querySelectorAll(".book-option").forEach((btn) => {
      const on = btn.getAttribute("data-book-id") === book.id;
      btn.classList.toggle("selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    $("book-hint").textContent = `Book: ${book.title}. Studying: ${book.topics}. Quests will use this.`;
  }

  function refreshBookSelect() {
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const list = booksFor(subject, grade);
    const box = $("book-list");
    const prev = $("book-select").value;
    const typed = $("custom-book") ? $("custom-book").value.trim() : "";
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
    if (typed) {
      // Keep their typed book; only highlight if it matches a suggestion
      const match = list.find((b) => b.title === typed);
      $("book-select").value = match ? match.id : "";
      $("book-list").querySelectorAll(".book-option").forEach((btn) => {
        const on = match && btn.getAttribute("data-book-id") === match.id;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
      $("book-hint").textContent = `Book: ${typed}. Grade ${grade}.`;
    } else {
      const keep = list.some((b) => b.id === prev) ? prev : list[0].id;
      selectBook(keep);
    }
    if ($("timer-auto") && $("timer-auto").checked) suggestSessionMinutes(true);
  }

  function formatClock(totalSec) {
    const s = Math.max(0, Math.ceil(totalSec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function suggestedMinutesForSetup() {
    const grade = parseInt(($("grade-select") || {}).value || "8", 10);
    const difficulty = (document.querySelector('input[name="difficulty"]:checked') || {}).value || "easy";
    let mins = 25;
    if (grade <= 5) mins = 15;
    else if (grade <= 8) mins = 25;
    else if (grade <= 10) mins = 45;
    else mins = 60;
    if (difficulty === "hard") mins = Math.min(180, mins + 10);
    if (difficulty === "raid") mins = Math.min(180, mins + 15);
    // Sometimes auto-pick a nearby preset for variety
    const presets = [15, 25, 45, 60];
    if (Math.random() < 0.35) {
      const nearby = presets.filter((p) => Math.abs(p - mins) <= 20);
      mins = nearby[Math.floor(Math.random() * nearby.length)] || mins;
    }
    return mins;
  }

  function setTimerMinutes(mins, { fromAuto = false } = {}) {
    mins = Math.max(1, Math.min(180, Math.round(Number(mins) || 25)));
    if ($("timer-minutes")) $("timer-minutes").value = String(mins);
    document.querySelectorAll(".timer-preset").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.getAttribute("data-mins"), 10) === mins);
    });
    if ($("timer-hint")) {
      $("timer-hint").textContent = fromAuto
        ? `Auto-suggested: ${mins} minutes — change it anytime.`
        : `Study session: ${mins} minutes. Leave unlocks when time is up.`;
    }
  }

  function suggestSessionMinutes(force = false) {
    if (!force && $("timer-auto") && !$("timer-auto").checked) return;
    setTimerMinutes(suggestedMinutesForSetup(), { fromAuto: true });
  }

  function updateLeaveControls() {
    const canLeave = !!(state.session && state.session.canLeave);
    const quit = $("btn-quit");
    const hint = $("quit-timer-hint");
    if (quit) {
      quit.disabled = !canLeave;
      quit.textContent = canLeave ? "Leave to Menu" : "Leave (locked)";
      quit.title = canLeave ? "Study timer finished — you can leave" : "Finish your study timer first";
    }
    if (hint) {
      if (canLeave) {
        hint.textContent = "Timer complete — you can leave whenever you want.";
        hint.classList.add("ready");
      } else if (state.session) {
        hint.textContent = `Study timer still running — ${formatClock(state.session.remaining)} left.`;
        hint.classList.remove("ready");
      }
    }
  }

  function updateSessionTimerUI() {
    const el = $("hud-timer");
    if (!el || !state.session) return;
    el.textContent = state.session.done ? "DONE" : formatClock(state.session.remaining);
    el.classList.toggle("timer-low", !state.session.done && state.session.remaining <= 60);
    el.classList.toggle("timer-done", !!state.session.done);
    updateLeaveControls();
  }

  function onSessionTimerComplete() {
    if (!state.session || state.session.notified) return;
    state.session.done = true;
    state.session.canLeave = true;
    state.session.remaining = 0;
    state.session.notified = true;
    updateSessionTimerUI();
    showToast("Study time complete! You can leave now.");
    if (!state.session.keepPlaying) {
      state.paused = true;
      if ($("session-body")) {
        $("session-body").textContent =
          `Nice work, ${state.playerName}! You studied ${state.bookTitle} for ${Math.round(state.session.totalSec / 60)} minutes. Leave to the menu, or keep exploring.`;
      }
      openModal("session-modal");
    }
  }

  function tickSessionTimer(dt) {
    if (!state.running || !state.session || state.session.done) return;
    // Pause timer during quizzes / menus
    if (state.paused) return;
    if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal") || modalIsOpen("dungeon-modal") || modalIsOpen("map-modal") || modalIsOpen("inventory-modal") || modalIsOpen("settings-modal") || modalIsOpen("session-modal")) {
      return;
    }
    state.session.remaining -= dt;
    if (state.session.remaining <= 0) {
      state.session.remaining = 0;
      onSessionTimerComplete();
    } else if (Math.floor(state.session.remaining) !== Math.floor(state.session.remaining + dt)) {
      updateSessionTimerUI();
    }
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

  /** Distance to winding river centerline (smaller = wetter). */
  function riverDist(wx, wy) {
    const bend = Math.sin(wx * 0.045) * 10 + Math.sin(wx * 0.012 + 1.7) * 22;
    const branch = Math.sin(wy * 0.04) * 8 + Math.cos(wy * 0.018) * 14;
    const d1 = Math.abs(wy - (bend + 40));
    const d2 = Math.abs(wx - (branch - 25));
    return Math.min(d1, d2);
  }

  /** Soft lake field — blobs of open water. */
  function lakeField(wx, wy) {
    return fbm(wx * 0.55 + 900, wy * 0.55 - 400);
  }

  function waterKindAt(wx, wy) {
    const biome = biomeAt(wx, wy);
    const lake = lakeField(wx, wy);
    const rd = riverDist(wx, wy);
    // Mountain cascades / highland streams
    if (biome === "mountain" && rd < 1.6 && lake > 0.42) return "waterfall";
    if (biome === "mountain" && rd < 1.15) return "stream";
    // Lakes
    if (lake > 0.78) return "deep";
    if (lake > 0.72) return "lake";
    // Rivers through plains / forest / swamp
    if (biome !== "desert" && rd < 1.35) return "river";
    if (biome !== "desert" && rd < 2.35) return "shore";
    // Swamp pools
    if (biome === "swamp" && fbm(wx, wy) < 0.38) return "marsh";
    if (lake > 0.68 && biome !== "desert") return "shore";
    return null;
  }

  function baseTile(wx, wy) {
    const biome = biomeAt(wx, wy);
    const n = fbm(wx, wy);
    const detail = hash2(wx, wy);
    const water = waterKindAt(wx, wy);

    if (water === "deep" || water === "lake" || water === "river" || water === "marsh" || water === "waterfall" || water === "stream") {
      return TILES.WATER;
    }
    if (water === "shore") {
      if (biome === "desert") return TILES.SAND;
      if (biome === "mountain") return TILES.COBBLE;
      return detail < 0.45 ? TILES.SAND : TILES.DIRT;
    }

    if (biome === "swamp") {
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
    return [TILES.WALL, TILES.TREE, TILES.LAVA, TILES.FENCE, TILES.VILLAGE].includes(tile);
  }

  function isWaterAt(x, y) {
    return getTile(Math.floor(x), Math.floor(y)) === TILES.WATER;
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

  function rankLabel(r) { return ["C", "B", "A", "S"][Math.max(0, Math.min(3, r | 0))] || "C"; }

  function gateRankLabel(structureRank, dungeonDiff) {
    const bump = { easy: 0, medium: 1, hard: 2, raid: 3 }[dungeonDiff] || 0;
    const idx = Math.max(0, Math.min(5, (structureRank | 0) + bump));
    return GATE_RANKS[idx];
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
    // Flatten any leftover water under the village to solid ground first
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const i = (oy + y) * CHUNK + (ox + x);
        tiles[i] = TILES.GRASS;
      }
    }
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
    // Village well / fountain pool (swimable water feature)
    const wellX = ox + 5, wellY = oy + 5;
    tiles[wellY * CHUNK + wellX] = TILES.WATER;
    tiles[wellY * CHUNK + (wellX + 1)] = TILES.WATER;
    tiles[(wellY + 1) * CHUNK + wellX] = TILES.WATER;
    tiles[(wellY + 1) * CHUNK + (wellX + 1)] = TILES.WATER;
    tiles[(wellY - 1) * CHUNK + wellX] = TILES.COBBLE;
    tiles[(wellY - 1) * CHUNK + (wellX + 1)] = TILES.COBBLE;
    tiles[(wellY + 2) * CHUNK + wellX] = TILES.COBBLE;
    tiles[(wellY + 2) * CHUNK + (wellX + 1)] = TILES.COBBLE;
    // Outdoor village chests so loot is easy to find
    registerChest(cx * CHUNK + ox + 3, cy * CHUNK + oy + 5, questRank(Math.abs(cx) + Math.abs(cy)), false, tiles, cx, cy);
    registerChest(cx * CHUNK + ox + 8, cy * CHUNK + oy + 6, questRank(Math.abs(cx) + Math.abs(cy)), false, tiles, cx, cy);
    const qx = ox + 9, qy = oy + 5;
    tiles[qy * CHUNK + qx] = TILES.QUEST;
    const dist = Math.abs(cx) + Math.abs(cy);
    registerStructure(cx * CHUNK + qx, cy * CHUNK + qy, "quest", "Village Trial", questRank(dist), { village: true });
  }

  function placeDungeon(tiles, cx, cy) {
    const ox = 1, oy = 1;
    // Ensure dungeon sits on land (wipe water under footprint)
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 14; x++) {
        tiles[(oy + y) * CHUNK + (ox + x)] = TILES.STONE;
      }
    }
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

  function isLandTileType(t) {
    return t !== TILES.WATER && t !== TILES.LAVA;
  }

  /** True if a structure footprint would sit mostly on dry land (grass/sand/stone/etc). */
  function chunkFootprintIsLand(cx, cy, ox, oy, w, h) {
    let land = 0, total = 0;
    for (let ly = oy; ly < oy + h; ly++) {
      for (let lx = ox; lx < ox + w; lx++) {
        total++;
        const t = baseTile(cx * CHUNK + lx, cy * CHUNK + ly);
        if (isLandTileType(t)) land++;
      }
    }
    return total > 0 && land / total >= 0.82;
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
    // Villages / dungeons only on solid land — never floating on water
    if (r > 0.91 && dist > 1 && chunkFootprintIsLand(cx, cy, 2, 2, 12, 12)) {
      placeVillage(tiles, cx, cy);
    } else if (r2 > 0.925 && dist > 2 && chunkFootprintIsLand(cx, cy, 1, 1, 14, 14)) {
      placeDungeon(tiles, cx, cy);
    } else if (r > 0.76 && r < 0.84) {
      const lx = 4 + Math.floor(hash2(cx, cy, 11) * 8);
      const ly = 4 + Math.floor(hash2(cx, cy, 22) * 8);
      if (isLandTileType(tiles[ly * CHUNK + lx])) {
        tiles[ly * CHUNK + lx] = TILES.QUEST;
        registerStructure(cx * CHUNK + lx, cy * CHUNK + ly, "quest", randomQuestName(cx * CHUNK + lx, cy * CHUNK + ly), questRank(dist));
      }
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


  function generateDungeonFloor(floor, rank, name, monsterMult = 1, diffKey = "medium") {
    const theme = FLOOR_THEMES[floor - 1];
    const w = 56 + floor * 2, h = 40 + floor;
    const tiles = Array.from({ length: h }, () => Array(w).fill(TILES.WALL));
    const rooms = [];
    // Harder gates carve a few extra rooms so there is space for denser packs
    const extraRooms = { easy: 0, medium: 2, hard: 4, raid: 7 }[diffKey] || 2;
    const tries = 30 + floor * 2 + extraRooms * 3;
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
    const perRoom = dungeonMobsPerRoom(diffKey) + (floor >= 7 ? 1 : 0);
    const roomChance = dungeonRoomSpawnChance(diffKey);
    const offsets = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0],
    ];
    rooms.forEach((room, idx) => {
      if (idx === 0) return;
      const cx = Math.floor(room.x + room.w / 2);
      const cy = Math.floor(room.y + room.h / 2);
      // Higher difficulty = more rooms get packs, and each pack is larger
      if (hash2(cx, cy, floor * 991 + rank) < (1 - roomChance)) {
        // skip this room
      } else {
        let placed = 0;
        for (let n = 0; n < perRoom && placed < perRoom; n++) {
          const [ox, oy] = offsets[n % offsets.length];
          const mx = Math.min(room.x + room.w - 2, Math.max(room.x + 1, cx + ox));
          const my = Math.min(room.y + room.h - 2, Math.max(room.y + 1, cy + oy));
          const tile = tiles[my] && tiles[my][mx];
          if (tile !== TILES.FLOOR && tile !== TILES.COBBLE) continue;
          if (monsters.some((m) => Math.floor(m.x) === mx && Math.floor(m.y) === my)) continue;
          const mhp = Math.floor(theme.hp * (1 + rank * 0.15 + floor * 0.08) * monsterMult);
          monsters.push({
            id: uid(), x: mx + 0.5, y: my + 0.5, hp: mhp, maxHp: mhp,
            type: theme.monster, dmg: Math.floor((theme.dmg + Math.floor(floor / 2)) * monsterMult),
            spd: theme.spd, color: theme.color, body: theme.body, eye: theme.eye,
            hitCd: 0,
          });
          placed += 1;
        }
      }
      // Always at least one chest chance high — guarantee chest in many rooms
      if (hash2(cx + 3, cy + 1, floor * 313) > 0.15 || idx === rooms.length - 1 || idx === 1) {
        const chx = Math.min(room.x + room.w - 2, Math.max(room.x + 1, cx + (idx % 2)));
        const chy = Math.min(room.y + room.h - 2, Math.max(room.y + 1, cy));
        if (tiles[chy][chx] === TILES.FLOOR || tiles[chy][chx] === TILES.COBBLE) {
          const ch = { id: uid(), x: chx, y: chy, wx: chx, wy: chy, opened: false, rank, dungeon: true };
          chests.push(ch);
          tiles[chy][chx] = TILES.CHEST;
        }
      }
      if (hash2(cx, cy, floor * 77) > 0.82 && floor < 10) {
        const tx = room.x + 1, ty = room.y + 1;
        if (tiles[ty][tx] === TILES.FLOOR) tiles[ty][tx] = TILES.TORCH;
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

  function setPortalDifficulty(diff) {
    const val = diff || "easy";
    $("portal-diff-value").value = val;
    document.querySelectorAll(".diff-pick").forEach((btn) => {
      btn.classList.toggle("selected", btn.getAttribute("data-diff") === val);
    });
  }

  function openDungeonPortal(structure) {
    state.paused = true;
    state.pendingDungeon = structure;
    const previewRank = gateRankLabel(structure.rank || 0, $("portal-diff-value").value || state.difficulty || "easy");
    $("dungeon-portal-title").textContent = `${previewRank}-Rank Gate`;
    $("dungeon-portal-name").textContent = `⚔ ${structure.name} · ${previewRank}-Rank Gate · 10 Floors`;
    $("dungeon-portal-flavor").textContent =
      `A magical gate tears open — Solo-Leveling style. Pick gate difficulty (more monsters + higher damage), then enter Floor 1 of 10.`;
    setPortalDifficulty(state.difficulty || "easy");
    // live-update title when picking difficulty
    document.querySelectorAll(".diff-pick").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        setPortalDifficulty(btn.getAttribute("data-diff"));
        const gr = gateRankLabel(structure.rank || 0, btn.getAttribute("data-diff"));
        $("dungeon-portal-title").textContent = `${gr}-Rank Gate`;
        $("dungeon-portal-name").textContent = `⚔ ${structure.name} · ${gr}-Rank Gate · 10 Floors`;
      };
    });
    openModal("dungeon-modal");
  }

  function confirmEnterPortal() {
    const structure = state.pendingDungeon;
    if (!structure) return;
    const dungeonDiff = $("portal-diff-value").value || "easy";
    closeModal("dungeon-modal");
    state.paused = false;
    state.pendingDungeon = null;
    enterDungeon(structure, dungeonDiff);
  }

  function cancelPortal() {
    closeModal("dungeon-modal");
    state.pendingDungeon = null;
    state.paused = false;
  }

  function dungeonDiffMult(diff) {
    // Solo-Leveling style: higher gate difficulty = much deadlier mobs
    return { easy: 0.7, medium: 1.15, hard: 1.7, raid: 2.4 }[diff] || 1;
  }

  /** How many monsters to pack into each populated dungeon room. */
  function dungeonMobsPerRoom(diff) {
    return { easy: 1, medium: 2, hard: 3, raid: 5 }[diff] || 2;
  }

  /** Chance a non-start room gets a monster pack. */
  function dungeonRoomSpawnChance(diff) {
    return { easy: 0.48, medium: 0.72, hard: 0.9, raid: 0.98 }[diff] || 0.7;
  }

  function enterDungeon(structure, dungeonDiff = "medium") {
    state.overworldReturn = { x: state.player.x, y: state.player.y };
    const floor = 1;
    const diffKey = dungeonDiff || "medium";
    const mult = dungeonDiffMult(diffKey);
    const baseRank = structure.rank || 0;
    const rank = Math.min(3, baseRank + ({ easy: 0, medium: 0, hard: 1, raid: 2 }[diffKey] || 0));
    const gateRank = gateRankLabel(baseRank, diffKey);
    const gen = generateDungeonFloor(floor, rank, structure.name, mult, diffKey);
    state.dungeon = {
      active: true,
      floor,
      name: structure.name,
      rank,
      gateRank,
      dungeonDiff: diffKey,
      monsterMult: mult,
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
    state.hp = state.maxHp;
    updateDungeonUI();
    showToast(`${gateRank}-Rank Gate entered [${DIFFICULTY[diffKey].label}] · ${gen.monsters.length} foes · ${gen.theme.name}`);
    SFX.unlock();
    SFX.portalEnter();
    SFX.syncAmbience({ running: true, dungeon: true, biome: "dungeon", moving: false });
  }

  function leaveDungeon() {
    if (!state.dungeon?.active) return;
    state.dungeon = null;
    state.player.x = state.overworldReturn.x;
    state.player.y = state.overworldReturn.y;
    state.wasNight = isNight();
    if (!isNight()) state.nightMobs = [];
    updateDungeonUI();
    showToast(isNight() ? "Returned under the night sky…" : "Returned to the overworld.");
    SFX.portalExit();
    const biome = biomeAt(Math.floor(state.player.x), Math.floor(state.player.y));
    SFX.syncAmbience({ running: true, dungeon: false, biome, moving: false });
  }

  function nextDungeonFloor() {
    const d = state.dungeon;
    if (!d || !d.stairs) return;
    const next = d.floor + 1;
    const gen = generateDungeonFloor(next, d.rank, d.name, d.monsterMult || 1, d.dungeonDiff || "medium");
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
    SFX.stairs();
    showToast(`Descended to Floor ${next}: ${gen.theme.name} · ${gen.monsters.length} foes`);
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
    if ($("combat-hint") && state.running) $("combat-hint").classList.remove("hidden");
    if (inD) {
      const gr = state.dungeon.gateRank || "E";
      $("hud-floor").textContent = `${state.dungeon.floor}/10`;
      $("hud-biome").textContent = `${gr}-Rank · ${state.dungeon.name} · ${FLOOR_THEMES[state.dungeon.floor - 1].name}`;
      $("combat-hint").textContent = `${gr}-Rank · Fl.${state.dungeon.floor}/10 · Sword:LMB · Pick:click stone · Shield:HOLD F / 🛡 BLOCK`;
    } else {
      $("hud-biome").textContent = BIOME_NAMES[biomeAt(Math.floor(state.player.x), Math.floor(state.player.y))] || "Grassland Ruins";
      if ($("combat-hint")) {
        $("combat-hint").textContent = "1 Sword · 2 Bow · 3 Pickaxe · HOLD F or top-right 🛡 BLOCK to raise shield";
      }
    }
    updateBlockUI();
  }

  const HOTBAR_SIZE = 9;
  const BAG_SIZE = 27;
  const INV_SIZE = 36; // hotbar + bag

  function getHandItem() {
    return state.slots[state.hotbarSel] || null;
  }

  function getActiveGear(slot) {
    if (state.equipped[slot]) return state.equipped[slot];
    const hand = getHandItem();
    if (hand && hand.slot === slot && hand.type !== "consumable" && hand.type !== "material") return hand;
    return null;
  }

  // Hotbar hand wins for combat: holding a sword never shoots, holding a bow never swings far
  function getCombatWeapon() {
    const hand = getHandItem();
    if (hand) {
      if (hand.slot === "weapon") return hand;
      if (hand.slot === "bow" || hand.slot === "tool" || hand.type === "consumable" || hand.type === "material") return null;
    }
    return state.equipped.weapon || null;
  }

  function getCombatBow() {
    const hand = getHandItem();
    if (hand) {
      if (hand.slot === "bow") return hand;
      if (hand.slot === "weapon" || hand.slot === "tool" || hand.type === "consumable" || hand.type === "material") return null;
    }
    return state.equipped.bow || null;
  }

  function isMineTool(it) {
    if (!it) return false;
    return !!(it.mine || /pick|hammer|spade|lens/i.test(it.key || "") || /pick/i.test(it.name || ""));
  }

  function getCombatPick() {
    const hand = getHandItem();
    if (hand) {
      if (isMineTool(hand)) return hand;
      if (hand.slot === "weapon" || hand.slot === "bow" || hand.type === "consumable" || hand.type === "material") return null;
    }
    const tool = state.equipped.tool;
    return isMineTool(tool) ? tool : null;
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
    // Hotbar hand contributes if that gear isn't already in an equip slot
    const hand = getHandItem();
    if (hand && hand.slot && hand.type !== "consumable" && hand.type !== "material") {
      const eq = state.equipped[hand.slot];
      if (!eq || eq.uid !== hand.uid) {
        def += hand.def || 0;
        pwr += hand.pwr || 0;
        know += hand.know || 0;
      }
    }
    if ((state.tempPwrT || 0) > 0) pwr += state.tempPwr || 0;
    return { def, pwr, know };
  }

  function getBlockArmor() {
    const eq = state.equipped.armor;
    if (eq && (eq.def || 0) > 0) return eq;
    const hand = getHandItem();
    if (hand && hand.slot === "armor" && (hand.def || 0) > 0) return hand;
    return eq || null;
  }

  function canBlock() {
    if (!state.running || state.paused || state.drinkAnim > 0 || state.swimming) return false;
    return gearStats().def > 0 && !!getBlockArmor();
  }

  function isBlocking() {
    return !!(state.blocking && canBlock());
  }

  function updateBlockUI() {
    const banner = $("block-banner");
    const hudBtn = $("btn-hud-block");
    const mobBtn = $("btn-block");
    const tip = $("shield-tip");
    const tipText = $("shield-tip-text");
    const on = isBlocking();
    const ready = !!(state.running && canBlock());
    if (banner) banner.classList.toggle("hidden", !on);
    if (hudBtn) {
      hudBtn.classList.toggle("active", on);
      hudBtn.classList.toggle("ready-pulse", ready && !on);
      hudBtn.title = on
        ? "Release to lower shield"
        : ready
          ? "HOLD this button (or F / Shift) to raise your shield"
          : "Equip a shield/armor in Inventory (I) first";
    }
    if (mobBtn) {
      mobBtn.classList.toggle("active", on);
      mobBtn.classList.toggle("ready-pulse", ready && !on);
    }
    if (tip) {
      tip.classList.toggle("hidden", !state.running);
      tip.classList.toggle("blocking", on);
      tip.classList.toggle("ready", ready && !on);
    }
    if (tipText) {
      if (on) tipText.innerHTML = "<strong>BLOCKING</strong> — release <kbd>F</kbd> / <kbd>Shift</kbd> / top-right <strong>🛡 BLOCK</strong>";
      else if (ready) tipText.innerHTML = "Your shield is equipped — <strong>HOLD F</strong> or the top-right <strong>🛡 BLOCK</strong> button";
      else tipText.innerHTML = "No shield equipped — open <kbd>I</kbd> Inventory → put a 🛡 in the Armor slot";
    }
  }

  function setBlocking(on) {
    const want = !!on;
    if (want && !canBlock()) {
      if (on && state.running && !state.paused) {
        showToast("Equip a shield/armor in Inventory (I), then hold F / Shift / 🛡 to block!", true);
      }
      state.blocking = false;
      updateBlockUI();
      return;
    }
    if (want && !state.blocking) {
      SFX.unlock();
      SFX.shieldRaise();
      showToast("Shield up! Hold F / Shift / 🛡 — release to lower.");
    }
    state.blocking = want;
    updateBlockUI();
  }


  function syncInventoryMirror() {
    state.inventory = state.slots.filter(Boolean);
  }

  function addItem(item) {
    if (!item) return false;
    for (let i = 0; i < INV_SIZE; i++) {
      if (!state.slots[i]) {
        state.slots[i] = item;
        syncInventoryMirror();
        updateHotbarUI();
        return true;
      }
    }
    showToast("Inventory full!", true);
    return false;
  }

  function removeItemByUid(uid) {
    for (let i = 0; i < INV_SIZE; i++) {
      if (state.slots[i] && state.slots[i].uid === uid) {
        const it = state.slots[i];
        state.slots[i] = null;
        syncInventoryMirror();
        return it;
      }
    }
    return null;
  }

  function findItemByUid(uid) {
    for (const it of state.slots) if (it && it.uid === uid) return it;
    for (const k of Object.keys(state.equipped)) {
      if (state.equipped[k] && state.equipped[k].uid === uid) return state.equipped[k];
    }
    return null;
  }

  function renderSlotButton(el, item, { selected = false, ghost = "" } = {}) {
    if (!el) return;
    el.classList.toggle("filled", !!item);
    el.classList.toggle("selected", selected);
    el.classList.toggle("empty", !item);
    ["common", "uncommon", "rare", "epic", "legendary"].forEach((r) => el.classList.remove(`rarity-${r}`));
    let stack = el.querySelector(".mc-stack");
    if (!stack) {
      stack = document.createElement("span");
      stack.className = "mc-stack";
      el.appendChild(stack);
    }
    if (item) {
      stack.innerHTML = `<span class="mc-ico">${item.type === "material" ? "🪨" : itemIcon(item)}</span>`;
      el.title = item.name + (item.rarity ? ` (${item.rarity})` : "");
      el.classList.add(`rarity-${item.rarity || "common"}`);
    } else {
      stack.innerHTML = "";
      el.title = ghost || "Empty";
    }
  }

  function updateHotbarUI() {
    const row = $("hotbar-slots");
    if (!row) return;
    row.innerHTML = "";
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mc-slot" + (state.hotbarSel === i ? " active" : "");
      btn.setAttribute("data-hotbar", String(i));
      const item = state.slots[i];
      btn.innerHTML = `<span class="mc-key">${i + 1}</span><span class="mc-stack"></span>`;
      renderSlotButton(btn, item);
      if (state.hotbarSel === i) btn.classList.add("active");
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (!$("inventory-modal").classList.contains("hidden")) {
          clickInvSlot(i);
          return;
        }
        state.hotbarSel = i;
        updateHotbarUI();
        const it = state.slots[i];
        if (it) showToast(`Hand: ${it.name}`);
      });
      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const it = state.slots[i];
        if (!it) return;
        if (it.type === "consumable") useItem(it.uid);
        else if (it.slot) equipItem(it.uid);
      });
      row.appendChild(btn);
    }
    updateHeldCursor();
  }

  function updateHeldCursor() {
    const cur = $("held-cursor");
    if (!cur) return;
    if (!state.heldItem) {
      cur.classList.add("hidden");
      cur.innerHTML = "";
      return;
    }
    cur.classList.remove("hidden");
    cur.innerHTML = `<span class="mc-ico">${state.heldItem.type === "material" ? "🪨" : itemIcon(state.heldItem)}</span>`;
  }

  function clickInvSlot(index) {
    const inSlot = state.slots[index];
    if (state.heldItem) {
      // place / swap
      state.slots[index] = state.heldItem;
      state.heldItem = inSlot || null;
    } else if (inSlot) {
      state.heldItem = inSlot;
      state.slots[index] = null;
    }
    syncInventoryMirror();
    updateInventoryUI();
    updateHotbarUI();
  }

  function clickEquipSlot(slot) {
    const equipped = state.equipped[slot];
    if (state.heldItem) {
      if (state.heldItem.type === "consumable" || state.heldItem.type === "material" || state.heldItem.slot !== slot) {
        showToast(`That goes in a ${state.heldItem.slot || "bag"} slot.`);
        return;
      }
      state.equipped[slot] = state.heldItem;
      state.heldItem = equipped || null;
      showToast(`Equipped ${state.equipped[slot].name}`);
    } else if (equipped) {
      state.heldItem = equipped;
      state.equipped[slot] = null;
      showToast(`Unequipped ${state.heldItem.name}`);
    }
    syncInventoryMirror();
    updateInventoryUI();
    updateHotbarUI();
    recalcHp();
  }

  function grantLoot({ count = 1, rank = 0, boss = false, preferPotion = false } = {}) {
    const diff = DIFFICULTY[state.difficulty];
    const gained = [];
    const n = Math.max(1, count | 0);
    const floor = Math.min(4, Math.max(0, (diff.lootFloor | 0) + (rank | 0) + (boss ? 1 : 0)));
    const ceil = Math.min(4, Math.max(floor, (diff.lootCeil | 0) + (boss ? 1 : 0)));
    for (let i = 0; i < n; i++) {
      const wantPotion = preferPotion || Math.random() < (0.28 + (boss ? 0.15 : 0));
      if (wantPotion) {
        const rarityIdx = Math.min(4, floor + Math.floor(Math.random() * (ceil - floor + 1)));
        const rarity = RARITY_ORDER[Math.min(rarityIdx, 3)] || "common";
        let options = POTION_TABLE.filter((l) => l.rarity === rarity);
        if (!options.length) options = POTION_TABLE.filter((l) => l.rarity === "common");
        const base = options[Math.floor(Math.random() * options.length)] || POTION_TABLE[0];
        const item = { ...base, uid: uid(), fromRank: rank, slot: null };
        addItem(item);
        gained.push(item);
        continue;
      }
      const rarityIdx = Math.min(4, floor + Math.floor(Math.random() * (ceil - floor + 1)));
      const rarity = RARITY_ORDER[rarityIdx] || "common";
      let options = LOOT_TABLE.filter((l) => l.rarity === rarity);
      if (!options.length) options = LOOT_TABLE.filter((l) => l.rarity === "common");
      const base = options[Math.floor(Math.random() * options.length)] || LOOT_TABLE[0];
      const item = { ...base, uid: uid(), fromRank: rank };
      addItem(item);
      gained.push(item);
    }
    updateInventoryUI();
    updateHotbarUI();
    return gained;
  }

  function canUseConsumablesNow() {
    if (!state.running) return false;
    if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal") || modalIsOpen("dungeon-modal") || modalIsOpen("session-modal")) {
      return false;
    }
    return true;
  }

  function potionColor(item) {
    if (!item) return "#e06070";
    if (item.effect === "breath") return "#60c8f0";
    if (item.effect === "might") return "#e0a040";
    if (item.alsoBreath) return "#c080e0";
    if ((item.amount || 0) >= 70) return "#ff5060";
    if ((item.amount || 0) >= 40) return "#e04070";
    return "#f07090";
  }

  function spawnFloatText(x, y, text, color = "#ffe080") {
    state.floatTexts.push({
      x, y, text, color,
      life: 1.05,
      max: 1.05,
      vy: -0.85,
    });
  }

  function applyConsumableEffects(item) {
    if (!item) return;
    if (item.effect === "heal") {
      const before = state.hp;
      const amt = item.amount || 25;
      state.hp = Math.min(state.maxHp, state.hp + amt);
      const gained = Math.ceil(state.hp - before);
      state.drinkHealAmt = gained;
      showToast(`Drank ${item.name} · +${gained} HP`);
      spawnParticles(state.player.x, state.player.y, 22, "heal");
      if (gained > 0) spawnFloatText(state.player.x, state.player.y - 0.6, `+${gained}`, "#ff90a8");
      SFX.unlock();
      SFX.healBurst();
      SFX.healChime();
      state.lowHpWarned = false;
    } else if (item.effect === "breath") {
      state.breath = state.maxBreath;
      updateBreathUI();
      showToast(`Drank ${item.name} · breath restored!`);
      spawnParticles(state.player.x, state.player.y, 10, "bubble");
      spawnFloatText(state.player.x, state.player.y - 0.55, "AIR!", "#80d8ff");
      SFX.healChime();
    } else if (item.effect === "might") {
      state.tempPwr = (state.tempPwr || 0) + (item.amount || 4);
      state.tempPwrT = Math.max(state.tempPwrT || 0, 18);
      showToast(`Drank ${item.name} · Might +${item.amount || 4}!`);
      spawnParticles(state.player.x, state.player.y, 12, "spark");
      spawnFloatText(state.player.x, state.player.y - 0.55, `PWR+${item.amount || 4}`, "#ffc060");
      SFX.healChime();
    }
    if (item.alsoBreath) {
      state.breath = state.maxBreath;
      updateBreathUI();
    }
    recalcHp();
    updateHUD();
  }

  function finishDrink() {
    const uid = state.drinkUid;
    const fallback = state.drinkItem;
    const item = (uid && findItemByUid(uid)) || fallback;
    state.drinkAnim = 0;
    state.drinkUid = null;
    state.drinkItem = null;
    if (!item) return;
    // Item may have been removed already — still apply from snapshot
    applyConsumableEffects(item);
    if (uid) {
      removeItemByUid(uid);
      if (state.heldItem && state.heldItem.uid === uid) state.heldItem = null;
    }
    updateInventoryUI();
    updateHotbarUI();
    updateHUD();
  }

  function startDrink(itemUid) {
    if (!canUseConsumablesNow()) {
      showToast("Finish this screen first, then drink.", true);
      return false;
    }
    if (state.drinkAnim > 0) {
      showToast("Already drinking…");
      return false;
    }
    const item = findItemByUid(itemUid);
    if (!item) return false;
    if (item.type !== "consumable") {
      showToast("That item must be equipped, not used.");
      return false;
    }
    if (item.effect === "heal") {
      if (state.hp >= state.maxHp && !item.alsoBreath) {
        showToast("Already at full HP.");
        return false;
      }
    }
    // Close inventory/map/settings so the drink anim is visible
    if (modalIsOpen("inventory-modal")) {
      if (state.heldItem) { addItem(state.heldItem); state.heldItem = null; }
      closeModal("inventory-modal");
      state.paused = false;
    }
    if (modalIsOpen("map-modal")) closeFullMap();
    if (modalIsOpen("settings-modal")) { closeModal("settings-modal"); state.paused = false; }

    state.drinkAnim = 0.9;
    state.drinkUid = item.uid;
    state.drinkItem = { ...item };
    state.drinkHealAmt = 0;
    state.drinkSfxCd = 0.12;
    state.hitCd = Math.max(state.hitCd, 0.9);
    state.mineTarget = null;
    showToast(`Drinking ${item.name}…`);
    spawnParticles(state.player.x, state.player.y - 0.2, 6, item.effect === "breath" ? "bubble" : "heal");
    SFX.unlock();
    SFX.potionPop();
    // First gulp slightly delayed so the bottle pop is clear
    setTimeout(() => {
      if (state.drinkAnim > 0) SFX.drinkGulp();
    }, 90);
    return true;
  }

  function useItem(itemUid) {
    const item = findItemByUid(itemUid);
    if (!item) return;
    if (item.type !== "consumable") {
      showToast("That item must be equipped, not used.");
      return;
    }
    startDrink(itemUid);
  }

  function useBestHeal() {
    if (!state.running) return;
    if (!canUseConsumablesNow()) {
      showToast("Can't drink during this screen.", true);
      return;
    }
    if (state.drinkAnim > 0) {
      showToast("Already drinking…");
      return;
    }
    const missing = state.maxHp - state.hp;
    if (missing <= 0) {
      // Still allow breath/might from hand if heal not needed
      const hand = getHandItem();
      if (hand && hand.type === "consumable" && hand.effect !== "heal") {
        startDrink(hand.uid);
        return;
      }
      showToast("Already at full HP.");
      return;
    }
    // Prefer selected hotbar heal potion, then best-fit heal in bag/hotbar
    const hand = getHandItem();
    if (hand && hand.type === "consumable" && (hand.effect === "heal" || hand.alsoBreath)) {
      startDrink(hand.uid);
      return;
    }
    const all = [];
    for (let i = 0; i < INV_SIZE; i++) {
      const it = state.slots[i];
      if (it && it.type === "consumable" && it.effect === "heal") all.push(it);
    }
    all.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    if (!all.length) {
      showToast("No healing potions! Loot chests or quests.", true);
      return;
    }
    // Prefer smallest potion that covers the missing HP (don't waste big ones)
    const fit = all.find((p) => (p.amount || 0) >= missing) || all[all.length - 1];
    startDrink(fit.uid);
  }

  function drinkHandPotion() {
    // Drink whatever consumable is selected on the hotbar (heal / breath / might)
    if (!state.running) return;
    const hand = getHandItem();
    if (hand && hand.type === "consumable") {
      startDrink(hand.uid);
      return;
    }
    useBestHeal();
  }

  function clearInventoryAndGear() {
    state.slots = Array(INV_SIZE).fill(null);
    state.inventory = [];
    state.heldItem = null;
    state.equipped = { weapon: null, armor: null, tool: null, book: null, bow: null };
    state.selectedItem = null;
    updateInventoryUI();
    updateHotbarUI();
    updateEquipUI();
    recalcHp();
  }

  function equipItem(itemUid) {
    const item = findItemByUid(itemUid);
    if (!item) return;
    if (item.type === "consumable" || item.type === "material" || !item.slot) {
      showToast(item.type === "material" ? "Materials can't be equipped." : "Potions are used, not equipped.");
      return;
    }
    // Move from bag/hotbar into equip
    removeItemByUid(itemUid);
    const prev = state.equipped[item.slot];
    state.equipped[item.slot] = item;
    if (prev) addItem(prev);
    state.heldItem = null;
    updateInventoryUI();
    updateHotbarUI();
    updateEquipUI();
    recalcHp();
    SFX.equip();
    const stats = [];
    if (item.def) stats.push(`DEF ${item.def}`);
    if (item.pwr) stats.push(`PWR ${item.pwr}`);
    if (item.shield || (item.slot === "armor" && item.def)) stats.push("hold F / 🛡 BLOCK");
    showToast(`Equipped ${item.name}${stats.length ? ` · ${stats.join(" · ")}` : ""}`);
  }

  function tryPlaceInSlot(slot) {
    clickEquipSlot(slot);
  }

  function selectBagItem(itemUid) {
    // legacy no-op — Minecraft click handles selection via heldItem
    const item = findItemByUid(itemUid);
    if (!item) return;
    if (item.type === "consumable") useItem(item.uid);
  }

  function unequipSlot(slot) {
    const item = state.equipped[slot];
    if (!item) return;
    state.equipped[slot] = null;
    addItem(item);
    updateInventoryUI();
    updateHotbarUI();
    updateEquipUI();
    recalcHp();
    SFX.equip();
    showToast(`Unequipped ${item.name}`);
  }

  function shortName(name) {
    if (!name) return "—";
    return name.length > 16 ? name.slice(0, 14) + "…" : name;
  }

  function itemIcon(item) {
    if (!item) return "·";
    if (item.type === "consumable") {
      if (item.effect === "breath") return "🫧";
      if (item.effect === "might") return "💪";
      return "🧪";
    }
    if (item.type === "material") return "🪨";
    return { weapon: "⚔", armor: "🛡", tool: "⛏", book: "📖", bow: "🏹" }[item.slot] || "•";
  }

  function updateEquipUI() {
    const e = state.equipped;
    ["weapon", "bow", "armor", "tool", "book"].forEach((slot) => {
      const btn = $(`slot-${slot}`);
      const item = e[slot];
      if (btn) {
        renderSlotButton(btn, item, { ghost: { weapon: "⚔", bow: "🏹", armor: "🛡", tool: "⛏", book: "📖" }[slot] });
        btn.classList.toggle("slot-pulse", !!(state.heldItem && state.heldItem.slot === slot && !item));
      }
      const chip = $(`eq-${slot}`);
      if (chip) chip.textContent = shortName(item && item.name);
      const nameEl = $(`slot-${slot}-name`);
      if (nameEl) nameEl.textContent = item ? item.name : "Empty";
    });
    const s = gearStats();
    if ($("hud-def")) $("hud-def").textContent = String(s.def);
    if ($("hud-pwr")) $("hud-pwr").textContent = String(s.pwr);
    if ($("inv-def")) {
      $("inv-def").textContent = String(s.def);
      $("inv-pwr").textContent = String(s.pwr);
      $("inv-know").textContent = String(s.know);
    }
    recalcHp();
  }

  function updateInventoryUI() {
    syncInventoryMirror();
    const grid = $("inventory-grid");
    const hot = $("inv-hotbar-grid");
    const empty = $("inventory-empty");
    if (!grid) return;
    grid.innerHTML = "";
    if (hot) hot.innerHTML = "";

    // Bag slots 9..35
    for (let i = HOTBAR_SIZE; i < INV_SIZE; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mc-slot";
      btn.innerHTML = `<span class="mc-stack"></span>`;
      renderSlotButton(btn, state.slots[i]);
      const idx = i;
      btn.addEventListener("click", (ev) => { ev.preventDefault(); clickInvSlot(idx); });
      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const it = state.slots[idx];
        if (it && it.type === "consumable") useItem(it.uid);
        else if (it && it.slot && !state.heldItem) equipItem(it.uid);
      });
      grid.appendChild(btn);
    }

    // Hotbar row inside inventory modal
    if (hot) {
      for (let i = 0; i < HOTBAR_SIZE; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mc-slot" + (state.hotbarSel === i ? " active" : "");
        btn.innerHTML = `<span class="mc-key">${i + 1}</span><span class="mc-stack"></span>`;
        renderSlotButton(btn, state.slots[i]);
        const idx = i;
        btn.addEventListener("click", (ev) => { ev.preventDefault(); clickInvSlot(idx); });
        btn.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
          const it = state.slots[idx];
          if (!it) return;
          if (it.type === "consumable") useItem(it.uid);
          else if (it.slot) equipItem(it.uid);
        });
        hot.appendChild(btn);
      }
    }

    if (empty) empty.classList.toggle("hidden", state.inventory.length > 0 || !!state.heldItem);
    const hint = $("inv-select-hint");
    if (hint) {
      hint.textContent = state.heldItem
        ? `Holding ${state.heldItem.name} — click a slot to place`
        : "Click to pick up · place · right-click potion to drink · right-click gear to equip";
    }
    updateEquipUI();
    updateHotbarUI();
    updateHeldCursor();
  }

  function updateHUD() {
    $("hud-level").textContent = String(state.level);
    $("hud-kp").textContent = String(state.kp);
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    $("hud-coords").textContent = `${px}, ${py}`;
    const topicShort = bookTopicList()[0] || "";
    $("hud-study").textContent = topicShort
      ? `${state.playerName} · ${state.bookTitle} · ${topicShort}`
      : `${state.playerName} · G${state.grade} · ${state.bookTitle}`;
    updateDayNightUI();
    updateSessionTimerUI();
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
    state.paused = true;
    openModal("result-modal");
    const btn = $("btn-result-ok");
    const handler = () => {
      btn.removeEventListener("click", handler);
      closeModal("result-modal");
      state.paused = false;
    };
    btn.addEventListener("click", handler);
  }

  function labelSubject() {
    return { math: "Mathematics", science: "Science", history: "History", english: "English", geography: "Geography" }[state.subject] || "your subject";
  }

  function gradeTierBoost() { return DIFFICULTY[state.difficulty].questTier; }

  function bookTopicList() {
    return String(state.bookTopics || "")
      .split(/[,;/|]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function questionMatchesBook(q) {
    const topics = bookTopicList().map((t) => t.toLowerCase());
    if (!topics.length) return 0;
    const hay = `${q.q} ${(q.a || []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of topics) {
      const words = t.split(/\s+/).filter((w) => w.length > 2);
      for (const w of words) {
        if (hay.includes(w)) score += 2;
      }
      if (hay.includes(t)) score += 3;
    }
    return score;
  }

  function makeBookTopicQuestions() {
    const topics = bookTopicList();
    const book = state.bookTitle || "your book";
    const subject = labelSubject();
    const out = [];
    if (topics.length) {
      const focus = topics[0];
      const distractors = topics.slice(1, 4);
      while (distractors.length < 3) {
        distractors.push(["review chapter", "vocabulary list", "practice set", "summary notes"][distractors.length]);
      }
      const opts = [focus, ...distractors.slice(0, 3)];
      // shuffle but track correct
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const a = order.map((i) => opts[i]);
      const c = order.indexOf(0);
      out.push({
        q: `In your book "${book}", which topic are you focusing on right now?`,
        a, c, g: [state.grade, state.grade], bookQ: true,
      });
      if (topics.length > 1) {
        out.push({
          q: `Your study plan for "${book}" includes all EXCEPT:`,
          a: [topics[1], topics[0], "random unrelated trivia", topics[Math.min(2, topics.length - 1)]],
          c: 2, g: [state.grade, state.grade], bookQ: true,
        });
      }
      out.push({
        q: `True or related: "${focus}" is a key idea from "${book}" (${subject}). Best next study step?`,
        a: [
          `Review ${focus} examples in the book`,
          "Ignore the book and guess",
          "Skip straight to a final exam only",
          "Study a different subject entirely",
        ],
        c: 0, g: [state.grade, state.grade], bookQ: true,
      });
    }
    out.push({
      q: `Which resource should guide this Grade ${state.grade} ${subject} trial?`,
      a: [book, "A random comic", "An unrelated cookbook", "A blank notebook with no notes"],
      c: 0, g: [state.grade, state.grade], bookQ: true,
    });
    return out;
  }

  function wrapQuestionForBook(q) {
    if (!q || q.bookQ) return q;
    const book = state.bookTitle || "your book";
    const topics = bookTopicList();
    const topicBit = topics.length ? ` (topic: ${topics[0]})` : "";
    return {
      ...q,
      q: `From "${book}"${topicBit}: ${q.q}`,
      displayTopics: topics.join(", "),
    };
  }

  function pickQuestion(extraTier = 0) {
    const pool = QUESTIONS[state.subject] || QUESTIONS.math;
    const g = state.grade;
    let eligible = pool.filter((q) => g >= q.g[0] && g <= q.g[1]);
    if (!eligible.length) eligible = pool.filter((q) => Math.abs(((q.g[0] + q.g[1]) / 2) - g) <= 3);
    if (!eligible.length) eligible = pool.slice();

    // Prefer questions that match the player's described book topics
    const scored = eligible.map((q) => ({ q, s: questionMatchesBook(q) }));
    scored.sort((a, b) => b.s - a.s);
    const matched = scored.filter((x) => x.s > 0).map((x) => x.q);
    if (matched.length >= 2) eligible = matched.concat(eligible.filter((q) => !matched.includes(q)));

    // Mix in book-specific prompts from their description
    const bookQs = makeBookTopicQuestions();
    let combined = bookQs.concat(eligible);

    let unused = combined.filter((q) => !state.usedQuestions.has(q.q));
    if (!unused.length) {
      combined.forEach((q) => state.usedQuestions.delete(q.q));
      unused = combined.slice();
    }

    // Bias toward book questions + topic matches
    const bookFirst = unused.filter((q) => q.bookQ || questionMatchesBook(q) > 0);
    const poolUse = bookFirst.length ? bookFirst.concat(unused.filter((q) => !bookFirst.includes(q))) : unused;

    if (extraTier > 0 || state.difficulty === "hard" || state.difficulty === "raid") {
      const ranked = poolUse.slice().sort((a, b) => {
        const tb = (b.bookQ ? 5 : 0) + questionMatchesBook(b) - ((a.bookQ ? 5 : 0) + questionMatchesBook(a));
        if (tb) return tb;
        return (b.g?.[1] || 0) - (a.g?.[1] || 0);
      });
      const top = ranked.slice(0, Math.max(4, Math.ceil(ranked.length * 0.55)));
      const q = wrapQuestionForBook(top[Math.floor(Math.random() * top.length)]);
      state.usedQuestions.add(q.q);
      return q;
    }
    // ~45% chance to pull a book-specific question when available
    let pickPool = poolUse;
    const onlyBook = poolUse.filter((q) => q.bookQ);
    if (onlyBook.length && Math.random() < 0.45) pickPool = onlyBook;
    const q = wrapQuestionForBook(pickPool[Math.floor(Math.random() * pickPool.length)]);
    state.usedQuestions.add(q.q);
    return q;
  }


  function startQuest(structure) {
    if (structure.done) { showToast("This trial is already complete."); return; }
    state.paused = true;
    const rank = structure.rank || 0;
    const question = pickQuestion(rank + gradeTierBoost());
    const topics = bookTopicList().join(", ") || "your listed topics";
    $("quest-title").textContent = structure.name || "Trial";
    $("quest-rank").textContent = `Rank ${rankLabel(rank)}`;
    $("quest-flavor").textContent = structure.village
      ? `"${state.playerName}, open ${state.bookTitle} — this trial covers: ${topics}."`
      : `The pedestal reads from your book "${state.bookTitle}". Focus: ${topics}.`;
    $("quest-book-tag").textContent = `📖 ${state.bookTitle} · ${topics} · Grade ${state.grade}`;
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
      SFX.questOk();
      updateHUD();
      setTimeout(() => { closeModal("quest-modal"); state.paused = false; showToast(`+${loot.map((l) => l.name).join(", ")}`); }, 1100);
    } else {
      fb.classList.add("bad");
      fb.textContent = "Wrong… the ruins reject you. Back to the beginning!";
      SFX.questFail();
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
    const topics = bookTopicList().join(", ") || "your study topics";
    $("boss-flavor").textContent = `Dungeon guardian of Rank ${rankLabel(rank)}. Three questions from "${state.bookTitle}" (${topics}). Fail one → lose all gear & drop a level.`;
    $("boss-book-tag").textContent = `📖 ${state.bookTitle} · ${topics} · Grade ${state.grade} · ${DIFFICULTY[state.difficulty].label}`;
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
        SFX.levelUp();
        showResult("Guardian Vanquished!", `Level ${state.level}! Epic loot: ${loot.map((l) => l.name).join(", ")}. Equip from Inventory (I).`);
      }, 800);
    } else {
      setTimeout(showBossQuestion, 750);
    }
  }

  function findAnyChestAt(wx, wy) {
    if (state.dungeon?.active) {
      const dc = (state.dungeon.chests || []).find((c) => (c.x === wx && c.y === wy) || (c.wx === wx && c.wy === wy));
      if (dc) return dc;
    }
    return state.chests.get(tileKey(wx, wy)) || null;
  }

  function findChestAt(wx, wy) {
    const c = findAnyChestAt(wx, wy);
    if (c && !c.opened && !c.looted) return c;
    return null;
  }

  function clearChestTile(chest) {
    const cx = chest.wx != null ? chest.wx : chest.x;
    const cy = chest.wy != null ? chest.wy : chest.y;
    if (cx == null || cy == null) return;
    // Loot collected → chest vanishes from the world
    const replace = state.dungeon?.active ? TILES.FLOOR : TILES.PATH;
    if (getTile(cx, cy) === TILES.CHEST) setTile(cx, cy, replace);
    chest.wx = cx;
    chest.wy = cy;
    chest.x = cx;
    chest.y = cy;
    if (!state.dungeon?.active) state.chests.set(tileKey(cx, cy), chest);
  }

  function finalizeChestLoot(chest) {
    if (!chest || chest.looted) return;
    chest.looted = true;
    chest.opened = true;
    chest.opening = false;
    const rank = Math.max(
      chest.rank || 0,
      state.dungeon?.rank || 0,
      ({ easy: 0, medium: 1, hard: 2, raid: 3 }[state.dungeon?.dungeonDiff] || 0)
    );
    const count = Math.max(1, 1 + (rank > 0 ? 1 : 0) + (state.dungeon?.active ? 1 : 0));
    const loot = [];
    if (state.dungeon?.active) {
      loot.push(...grantLoot({ count: 1, rank, preferPotion: true }));
      if (count > 1) loot.push(...grantLoot({ count: count - 1, rank, boss: rank >= 2 }));
    } else {
      loot.push(...grantLoot({ count, rank, boss: false }));
    }
    const cx = chest.wx != null ? chest.wx : chest.x;
    const cy = chest.wy != null ? chest.wy : chest.y;
    spawnParticles(cx + 0.5, cy + 0.5, 18, "spark");
    clearChestTile(chest);
    updateHUD();
    updateInventoryUI();
    updateHotbarUI();
    const names = loot.map((l) => l.name).join(", ");
    showToast(`Loot collected! +${names} · Equip in Inventory (I)`);
    SFX.chestLoot();
  }

  function openChest(chest) {
    if (!chest || chest.opened || chest.looted || chest.opening) {
      if (chest && (chest.opened || chest.looted)) showToast("Chest already looted.");
      return;
    }
    // Require intentional open (E / tap) — play lid animation first
    chest.opening = true;
    chest.openT = 0;
    spawnParticles((chest.wx ?? chest.x) + 0.5, (chest.wy ?? chest.y) + 0.35, 6, "spark");
    showToast("Opening chest…");
    SFX.unlock();
    SFX.chestOpen();
  }

  function updateChests(dt) {
    const list = [];
    if (state.dungeon?.active) list.push(...(state.dungeon.chests || []));
    for (const c of state.chests.values()) list.push(c);
    for (const chest of list) {
      if (!chest.opening || chest.looted) continue;
      chest.openT = (chest.openT || 0) + dt;
      if (chest.openT >= 0.55) {
        chest.opening = false;
        finalizeChestLoot(chest);
      }
    }
  }

  function findInteractable() {
    const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
    const near = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];

    // Chests first so loot is never blocked by other prompts
    for (const [dx, dy] of near) {
      const wx = px + dx, wy = py + dy;
      const any = findAnyChestAt(wx, wy);
      if (any && (any.opened || any.looted)) {
        // Safety: remove leftover chest tiles after loot
        if (getTile(wx, wy) === TILES.CHEST) clearChestTile(any);
        continue;
      }
      const chest = findChestAt(wx, wy);
      if (chest && !chest.opening) return { type: "chest", data: chest, label: "Open chest (E)" };
      if (getTile(wx, wy) === TILES.CHEST && !any) {
        const orphan = { id: uid(), wx, wy, x: wx, y: wy, opened: false, looted: false, rank: state.dungeon?.rank || 0, dungeon: !!state.dungeon?.active };
        if (state.dungeon?.active) state.dungeon.chests.push(orphan);
        else state.chests.set(tileKey(wx, wy), orphan);
        return { type: "chest", data: orphan, label: "Open chest (E)" };
      }
    }

    for (const [dx, dy] of near) {
      const wx = px + dx, wy = py + dy;
      const tile = getTile(wx, wy);
      if (tile === TILES.QUEST) {
        const s = state.structures.get(tileKey(wx, wy));
        if (s && !s.done) return { type: "quest", data: s, label: "Start trial" };
      }
      if (tile === TILES.DUNGEON) {
        const s = state.structures.get(tileKey(wx, wy)) || state.structures.get(tileKey(wx - 1, wy));
        if (s && s.type === "dungeon_entrance") return { type: "dungeon_entrance", data: s, label: "Enter portal" };
      }
      if (state.dungeon?.active) {
        if (tile === TILES.STAIRS) return { type: "stairs", data: state.dungeon.stairs, label: "Go deeper" };
        if (tile === TILES.EXIT) return { type: "exit", data: state.dungeon.exit, label: "Leave dungeon" };
        if (tile === TILES.BOSS && state.dungeon.floor === 10) {
          return { type: "boss_tile", data: state.dungeon.bossTile, label: "Face the Guardian" };
        }
      }
      if (tile === TILES.BOSS && !state.dungeon?.active) {
        const s = state.structures.get(tileKey(wx, wy)) || state.structures.get(tileKey(wx - 1, wy));
        if (s && !s.done) return { type: s.type, data: s, label: "Challenge" };
      }
    }
    // Mineable stone with pickaxe in hand or tool slot
    const pick = getCombatPick();
    if (pick) {
      for (const [dx, dy] of near) {
        const wx = px + dx, wy = py + dy;
        const tile = getTile(wx, wy);
        if (tile === TILES.STONE || tile === TILES.COBBLE || tile === TILES.RUIN) {
          return { type: "mine", data: { wx, wy, tile }, label: "Mine stone (E)" };
        }
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
    else if (target.type === "dungeon_entrance") openDungeonPortal(target.data);
    else if (target.type === "chest") openChest(target.data);
    else if (target.type === "mine") startMining(target.data.wx, target.data.wy);
    else if (target.type === "stairs") nextDungeonFloor();
    else if (target.type === "exit") leaveDungeon();
    else if (target.type === "boss_tile") {
      if (!state.dungeon.bossStarted) {
        state.dungeon.bossStarted = true;
        startBoss({ name: `${state.dungeon.name} Guardian`, rank: state.dungeon.rank, done: false });
      }
    }
  }

  // Close-range only — Minecraft-ish reach (~1 tile), not bow distance
  const MELEE_RANGE = 1.05;
  const FIST_RANGE = 0.7;
  const MELEE_ARC = 1.15; // ~66° each side of facing (~132° cone)

  function meleeRange() {
    return getCombatWeapon() ? MELEE_RANGE : FIST_RANGE;
  }

  function overworldDiffMult() {
    return { easy: 0.75, medium: 1.15, hard: 1.7, raid: 2.35 }[state.difficulty] || 1;
  }

  function nightMobBaseDmg() {
    return { easy: 4, medium: 7, hard: 11, raid: 16 }[state.difficulty] || 6;
  }

  function isNight() {
    // Night window: evening through late night
    return state.dayTime >= 0.62 && state.dayTime < 0.92;
  }

  function dayPhaseLabel() {
    const t = state.dayTime;
    if (t < 0.18) return "Dawn";
    if (t < 0.45) return "Day";
    if (t < 0.62) return "Dusk";
    if (t < 0.92) return "Night";
    return "Dawn";
  }

  /** Map dayTime → clock minutes. Midnight sits at mid-night (dayTime ≈ 0.77). */
  function gameClockMinutes() {
    const hours = ((state.dayTime - 0.77 + 1) % 1) * 24;
    return Math.floor(hours * 60) % (24 * 60);
  }

  function formatGameClock() {
    const total = gameClockMinutes();
    let h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function updateDayNightUI() {
    const label = dayPhaseLabel();
    const night = label === "Night";
    const timeStr = formatGameClock();
    const el = $("hud-tod");
    if (el) {
      el.textContent = state.dungeon?.active ? "Dungeon" : label;
      el.classList.toggle("night", night && !state.dungeon?.active);
      el.classList.toggle("dusk", label === "Dusk" && !state.dungeon?.active);
      el.classList.toggle("dawn", label === "Dawn" && !state.dungeon?.active);
    }
    const clock = $("hud-clock");
    if (clock) clock.textContent = timeStr;
    const clockCenter = $("hud-clock-center");
    if (clockCenter) {
      clockCenter.textContent = timeStr;
      clockCenter.classList.toggle("night", night && !state.dungeon?.active);
    }
    const clockStat = document.querySelector(".hud-clock-stat");
    if (clockStat) clockStat.classList.toggle("night", night && !state.dungeon?.active);
  }

  function updateDayNight(dt) {
    if (state.dungeon?.active) {
      updateDayNightUI();
      return;
    }
    state.dayTime = (state.dayTime + dt / Math.max(60, state.dayLength)) % 1;
    const night = isNight();
    if (night && !state.wasNight) {
      const burst = { easy: 1, medium: 2, hard: 4, raid: 6 }[state.difficulty] || 2;
      showToast(`Night falls… ${burst > 1 ? burst + " " : ""}monsters stir in the ruins!`, true);
      state.nightSpawnCd = 0.25;
      for (let i = 0; i < burst; i++) {
        const m = spawnOneNightMob();
        if (m) state.nightMobs.push(m);
      }
    }
    if (!night && state.wasNight) {
      showToast("Dawn breaks — night beasts flee.");
      // Burn remaining night mobs in sunlight
      for (const m of state.nightMobs) spawnParticles(m.x, m.y, 6, "spark");
      state.nightMobs = [];
    }
    state.wasNight = night;
    updateDayNightUI();
    if (night) updateNightSpawns(dt);
    else state.nightSpawnCd = 0;
  }

  function canSpawnNightAt(wx, wy) {
    const tile = getOverworldTile(wx, wy);
    if ([TILES.WATER, TILES.LAVA, TILES.WALL, TILES.VILLAGE, TILES.DOOR, TILES.ROOF].includes(tile)) return false;
    if (isSolidTile(tile)) return false;
    // Stay out of village cores a bit
    for (const s of state.structures.values()) {
      if ((s.village || s.type === "quest") && Math.hypot(wx - s.wx, wy - s.wy) < 4) return false;
    }
    return true;
  }

  function spawnOneNightMob() {
    const types = [
      { type: "shadow", color: "#282030", body: "#181020", eye: "#a060ff", hp: 18, spd: 1.7 },
      { type: "wolf", color: "#5a5a68", body: "#3a3a48", eye: "#ffe080", hp: 22, spd: 2.0 },
      { type: "bat", color: "#4a3858", body: "#3a2848", eye: "#f0c040", hp: 14, spd: 2.3 },
      { type: "wraith", color: "#405878", body: "#304060", eye: "#c0e0ff", hp: 26, spd: 1.4 },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    const mult = overworldDiffMult();
    const ang = Math.random() * Math.PI * 2;
    const dist = 7 + Math.random() * 6;
    const x = state.player.x + Math.cos(ang) * dist;
    const y = state.player.y + Math.sin(ang) * dist;
    const wx = Math.floor(x), wy = Math.floor(y);
    if (!canSpawnNightAt(wx, wy)) return null;
    return {
      id: uid(),
      x: wx + 0.5,
      y: wy + 0.5,
      type: t.type,
      hp: Math.floor(t.hp * mult),
      maxHp: Math.floor(t.hp * mult),
      dmg: Math.max(1, Math.floor(nightMobBaseDmg() * (0.85 + Math.random() * 0.3))),
      spd: t.spd * (0.9 + mult * 0.08),
      color: t.color,
      body: t.body,
      eye: t.eye,
      hitFlash: 0,
      night: true,
    };
  }

  function updateNightSpawns(dt) {
    if (state.dungeon?.active || state.paused) return;
    // Harder study difficulty = denser night packs and faster respawns
    const cap = { easy: 2, medium: 5, hard: 9, raid: 14 }[state.difficulty] || 5;
    const batch = { easy: 1, medium: 1, hard: 2, raid: 3 }[state.difficulty] || 1;
    const cd = { easy: 4.0, medium: 2.4, hard: 1.35, raid: 0.7 }[state.difficulty] || 2.5;
    state.nightSpawnCd -= dt;
    if (state.nightSpawnCd <= 0 && state.nightMobs.length < cap) {
      let added = 0;
      for (let i = 0; i < batch && state.nightMobs.length < cap; i++) {
        const m = spawnOneNightMob();
        if (m) {
          state.nightMobs.push(m);
          added += 1;
        }
      }
      state.nightSpawnCd = added ? cd : cd * 0.45;
    }
  }

  function damageMonster(monster, dmg) {
    if (!monster) return;
    monster.hp -= dmg;
    monster.hitFlash = 0.2;
    spawnParticles(monster.x, monster.y, 8, "spark");
    if (monster.hp <= 0) {
      SFX.monsterDie();
      spawnParticles(monster.x, monster.y, 12, "spark");
      if (monster.night) {
        state.nightMobs = state.nightMobs.filter((m) => m.id !== monster.id);
        state.kp += 2 + ({ easy: 1, medium: 2, hard: 3, raid: 4 }[state.difficulty] || 1);
        showToast(`Night ${monster.type} defeated!`);
        updateHUD();
        return;
      }
      if (!state.dungeon?.active) return;
      state.dungeon.monsters = state.dungeon.monsters.filter((m) => m.id !== monster.id);
      state.kp += 3 + state.dungeon.floor;
      showToast(`${monster.type} defeated!`);
      if (state.dungeon.floor === 10 && state.dungeon.monsters.length === 0 && !state.dungeon.bossStarted) {
        state.dungeon.bossStarted = true;
        setTimeout(() => startBoss({ name: `${state.dungeon.name} Guardian`, rank: state.dungeon.rank, done: false }), 400);
      }
    } else {
      showToast(`Hit ${monster.type} for ${dmg}!`);
    }
  }

  function iterCombatMobs() {
    if (state.dungeon?.active) return state.dungeon.monsters;
    return state.nightMobs;
  }

  function performMeleeSwing() {
    if (state.drinkAnim > 0) { showToast("Drinking…"); return false; }
    if (isBlocking()) { showToast("Lower your shield first (release F / Shift / 🛡)"); return false; }
    if (state.hitCd > 0 || state.paused) return false;
    const weapon = getCombatWeapon();
    const hasWeapon = !!weapon;
    const range = meleeRange();
    const base = hasWeapon ? (5 + (weapon.pwr || 0) + Math.floor(gearStats().pwr * 0.25)) : 2;
    state.hitCd = hasWeapon ? 0.38 : 0.32;
    state.attackAnim = 0.32;
    state.attackArc = range;
    SFX.unlock();
    // Always play a clear swing sound
    if (hasWeapon) SFX.swordSlash();
    else SFX.fist();
    let hitAny = false;
    const mobs = iterCombatMobs();
    for (const m of mobs) {
      const dist = Math.hypot(m.x - state.player.x, m.y - state.player.y);
      if (dist > range) continue;
      const ang = Math.atan2(m.y - state.player.y, m.x - state.player.x);
      let diff = Math.abs(((ang - state.player.facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (diff > MELEE_ARC / 2 && dist > 0.55) continue;
      damageMonster(m, base);
      hitAny = true;
    }
    if (hitAny) {
      if (hasWeapon) SFX.swordHit();
      spawnParticles(state.player.x + Math.cos(state.player.facing) * 0.45, state.player.y + Math.sin(state.player.facing) * 0.45, 8, "spark");
    } else {
      spawnParticles(state.player.x + Math.cos(state.player.facing) * 0.45, state.player.y + Math.sin(state.player.facing) * 0.45, 5, "spark");
      if (mobs.length) showToast(hasWeapon ? "Swing missed — step closer!" : "Fists miss — get closer!");
    }
    return true;
  }

  function shootBow(tx, ty) {
    const bow = getCombatBow();
    if (state.drinkAnim > 0) { showToast("Drinking…"); return false; }
    if (isBlocking()) { showToast("Lower shield to shoot (release F / 🛡)"); return false; }
    if (!bow || state.paused) return false;
    SFX.unlock();
    if (state.hitCd > 0) {
      SFX.bowDry();
      return false;
    }
    const dx = tx - state.player.x, dy = ty - state.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const range = bow.range || 6;
    state.player.facing = Math.atan2(dy, dx);
    if (dist > range + 0.5) {
      showToast("Out of bow range — click farther / closer target!");
      SFX.bowDry();
      return false;
    }
    state.hitCd = 0.45;
    state.attackAnim = 0.3;
    const spd = 9;
    state.projectiles.push({
      x: state.player.x, y: state.player.y,
      vx: (dx / dist) * spd, vy: (dy / dist) * spd,
      life: 1.2, dmg: 4 + (bow.pwr || 0) + Math.floor(gearStats().pwr * 0.35),
      kind: "arrow",
    });
    spawnParticles(state.player.x, state.player.y, 4, "spark");
    SFX.bow();
    return true;
  }

  function startMining(wx, wy) {
    if (state.drinkAnim > 0) { showToast("Drinking…"); return; }
    if (isBlocking()) { showToast("Can't mine while blocking."); return; }
    const pick = getCombatPick();
    if (!pick) { showToast("Hold a pickaxe on the hotbar (1–9) or equip Tool!", true); return; }
    const minePow = pick.mine || 1;
    const tile = getTile(wx, wy);
    if (![TILES.STONE, TILES.COBBLE, TILES.RUIN].includes(tile)) return;
    if (state.mineTarget && state.mineTarget.wx === wx && state.mineTarget.wy === wy) return;
    state.mineTarget = { wx, wy, progress: 0, need: Math.max(0.55, 1.4 - minePow * 0.18) };
    state.mineAnim = 0.01;
    showToast("Mining…");
  }

  function updateMining(dt) {
    if (!state.mineTarget) {
      if (state.mineAnim > 0) state.mineAnim = Math.max(0, state.mineAnim - dt);
      return;
    }
    const pick = getCombatPick();
    if (!pick) { state.mineTarget = null; return; }
    const { wx, wy } = state.mineTarget;
    if (Math.hypot(state.player.x - wx - 0.5, state.player.y - wy - 0.5) > 2.2) {
      state.mineTarget = null;
      showToast("Too far to mine.", true);
      return;
    }
    state.mineAnim = 0.25;
    state.mineTarget.progress += dt;
    if (Math.random() < 0.08) spawnParticles(wx + 0.5, wy + 0.5, 2, "dust");
    state.mineSfxCd = (state.mineSfxCd || 0) - dt;
    if (state.mineSfxCd <= 0) {
      SFX.mine();
      state.mineSfxCd = 0.18;
    }
    if (state.mineTarget.progress >= state.mineTarget.need) {
      const tile = getTile(wx, wy);
      setTile(wx, wy, tile === TILES.RUIN ? TILES.DIRT : TILES.DIRT);
      spawnParticles(wx + 0.5, wy + 0.5, 14, "dust");
      // Stone drop — craftable-feel loot
      const stone = { key: "stone_chunk", name: "Stone Chunk", type: "consumable", effect: "heal", amount: 5, rarity: "common", uid: uid(), slot: null };
      // Keep as material-ish: just inventory junk that heals tiny? Better as non-consumable material
      const mat = { key: "stone_chunk", name: "Stone Chunk", slot: "tool", rarity: "common", pwr: 0, def: 0, know: 0, uid: uid(), material: true };
      // Actually put as simple bag item without equip — use consumable false material
      addItem({ key: "stone_chunk", name: "Stone Chunk", type: "material", rarity: "common", uid: uid(), slot: null });
      updateInventoryUI();
      updateHotbarUI();
      showToast("Mined stone! +Stone Chunk");
      state.mineTarget = null;
      state.mineAnim = 0;
      state.kp += 1;
      updateHUD();
    }
  }

  function updateProjectiles(dt) {
    if (!state.projectiles.length) return;
    state.projectiles = state.projectiles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) return false;
      if (isSolidTile(getTile(Math.floor(p.x), Math.floor(p.y)))) return false;
      for (const m of iterCombatMobs()) {
        if (Math.hypot(m.x - p.x, m.y - p.y) < 0.45) {
          damageMonster(m, p.dmg);
          spawnParticles(p.x, p.y, 6, "spark");
          return false;
        }
      }
      return true;
    });
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
    const dist = Math.hypot(wx - state.player.x, wy - state.player.y);

    // Face click
    state.player.facing = Math.atan2(wy - state.player.y, wx - state.player.x);

    // Mining click on stone (pick in hand or tool slot)
    const ttile = getTile(Math.floor(wx), Math.floor(wy));
    const handPick = getCombatPick();
    if (handPick && [TILES.STONE, TILES.COBBLE, TILES.RUIN].includes(ttile) && dist < 2.4) {
      startMining(Math.floor(wx), Math.floor(wy));
      return;
    }

    // Hotbar hand wins: bow in hand always shoots (twang/dry-fire always plays)
    const hand = getHandItem();
    if (hand && hand.slot === "bow") {
      shootBow(wx, wy);
      return;
    }
    if (getCombatBow() && !getCombatWeapon()) {
      shootBow(wx, wy);
      return;
    }

    // Melee: sword/fists — slash SFX always plays
    performMeleeSwing();
  }

  function attackFacing() {
    if (!state.running || state.paused) return;
    const hand = getHandItem();
    if (hand && hand.slot === "bow") {
      const ang = state.player.facing || 0;
      shootBow(state.player.x + Math.cos(ang) * 3.5, state.player.y + Math.sin(ang) * 3.5);
      return;
    }
    if (getCombatBow() && !getCombatWeapon()) {
      const ang = state.player.facing || 0;
      shootBow(state.player.x + Math.cos(ang) * 3.5, state.player.y + Math.sin(ang) * 3.5);
      return;
    }
    performMeleeSwing();
  }

  function playerHurt(dmg) {
    const def = gearStats().def;
    let taken;
    if (isBlocking()) {
      // Active shield / armor block — much stronger than passive DEF
      const blockPower = 0.6 + Math.min(0.35, def * 0.035);
      const mitigated = Math.floor(dmg * blockPower) + Math.floor(def * 0.9);
      taken = Math.max(0, dmg - mitigated);
      state.blockFlash = 0.25;
      state.hurtCd = 0.55;
      SFX.block();
      spawnParticles(state.player.x + Math.cos(state.player.facing) * 0.4, state.player.y + Math.sin(state.player.facing) * 0.4, 8, "spark");
      if (taken <= 0) {
        spawnFloatText(state.player.x, state.player.y - 0.5, "BLOCK", "#90d0ff");
        showToast("Blocked with your shield/armor!");
        return;
      }
      spawnFloatText(state.player.x, state.player.y - 0.5, `-${taken}`, "#a0c8ff");
      showToast(`Blocked! Only ${taken} damage got through.`);
    } else {
      taken = Math.max(1, dmg - Math.floor(def * 0.5));
      state.hurtCd = 0.8;
      SFX.hurt();
      spawnFloatText(state.player.x, state.player.y - 0.45, `-${taken}`, "#ff6060");
      showToast(`Took ${taken} damage!`, true);
    }
    state.hp -= taken;
    recalcHp();
    if (state.hp <= 0) {
      state.hp = state.maxHp;
      respawnToBeginning();
      showToast("You fell in battle! Respawned at the gate — gear kept.", true);
    }
  }

  function updateMonsters(dt) {
    const px = state.player.x, py = state.player.y;
    if (state.dungeon?.active) {
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
      return;
    }
    // Overworld night mobs
    state.nightMobs = state.nightMobs.filter((m) => {
      const dx = px - m.x, dy = py - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 28) return false; // despawn far away
      if (dist < 9 && dist > 0.4) {
        const spd = m.spd * dt;
        const nx = m.x + (dx / dist) * spd;
        const ny = m.y + (dy / dist) * spd;
        if (!isSolidTile(getOverworldTile(Math.floor(nx), Math.floor(m.y)))) m.x = nx;
        if (!isSolidTile(getOverworldTile(Math.floor(m.x), Math.floor(ny)))) m.y = ny;
      }
      if (dist < 0.55 && state.hurtCd <= 0) playerHurt(m.dmg);
      return true;
    });
  }

  function spawnParticles(x, y, n, kind = "spark") {
    if (!state.settings.particles) return;
    for (let i = 0; i < n; i++) {
      let color, vx, vy, life, size;
      if (kind === "bubble") {
        color = Math.random() > 0.5 ? "#c8f0ff" : "#8ad0f0";
        vx = (Math.random() - 0.5) * 0.6;
        vy = -0.4 - Math.random() * 0.9;
        life = 0.5 + Math.random() * 0.7;
        size = 2 + Math.floor(Math.random() * 3);
      } else if (kind === "splash") {
        color = Math.random() > 0.4 ? "#a8e0f8" : "#ffffff";
        vx = (Math.random() - 0.5) * 2.2;
        vy = -1.2 - Math.random() * 1.5;
        life = 0.35 + Math.random() * 0.35;
        size = 2;
      } else if (kind === "dust") {
        color = Math.random() > 0.5 ? "#8a7458" : "#6a5840";
        vx = (Math.random() - 0.5) * 1.2;
        vy = -0.15 - Math.random() * 0.4;
        life = 0.25 + Math.random() * 0.35;
        size = 2;
      } else if (kind === "drown") {
        color = "#4080a0";
        vx = (Math.random() - 0.5) * 1.5;
        vy = -0.2 - Math.random() * 0.8;
        life = 0.6 + Math.random() * 0.5;
        size = 3;
      } else if (kind === "heal") {
        color = Math.random() > 0.45 ? "#ff8090" : "#ffe0a0";
        vx = (Math.random() - 0.5) * 1.4;
        vy = -0.8 - Math.random() * 1.2;
        life = 0.55 + Math.random() * 0.45;
        size = 2 + Math.floor(Math.random() * 2);
      } else {
        color = Math.random() > 0.5 ? "#f0c96a" : "#e06a55";
        vx = (Math.random() - 0.5) * 2;
        vy = (Math.random() - 0.5) * 2 - 0.5;
        life = 0.6 + Math.random() * 0.5;
        size = 3;
      }
      state.particles.push({ x, y, vx, vy, life, color, kind, size });
    }
  }

  function updateBreathUI() {
    const wrap = $("hud-breath-wrap");
    const barWrap = $("breath-bar-wrap");
    const fill = $("breath-bar-fill");
    if (state.swimming) {
      wrap.classList.remove("hidden");
      barWrap.classList.remove("hidden");
      $("hud-breath").textContent = String(Math.ceil(state.breath));
      const pct = Math.max(0, Math.min(100, (state.breath / state.maxBreath) * 100));
      fill.style.width = `${pct}%`;
      fill.classList.toggle("low", state.breath < 30);
    } else {
      wrap.classList.add("hidden");
      barWrap.classList.add("hidden");
    }
  }

  function updatePlayer(dt) {
    let mx = 0, my = 0;
    if (state.keys.ArrowUp || state.keys.w || state.keys.W) my -= 1;
    if (state.keys.ArrowDown || state.keys.s || state.keys.S) my += 1;
    if (state.keys.ArrowLeft || state.keys.a || state.keys.A) mx -= 1;
    if (state.keys.ArrowRight || state.keys.d || state.keys.D) mx += 1;
    const moving = !!(mx || my);
    if (moving) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      state.player.facing = Math.atan2(my, mx);
    }

    const wasSwimming = state.swimming;
    state.swimming = isWaterAt(state.player.x, state.player.y);

    // Enter/exit splash
    if (state.swimming && !wasSwimming) {
      spawnParticles(state.player.x, state.player.y, 14, "splash");
      SFX.footstep("water");
      showToast("You wade into the water… hold your breath!");
    } else if (!state.swimming && wasSwimming) {
      spawnParticles(state.player.x, state.player.y, 10, "splash");
      SFX.footstep("water");
      state.breath = state.maxBreath;
    }

    const baseSpeed = state.swimming ? 2.1 : 3.2;
    const drinkSlow = state.drinkAnim > 0 ? 0.35 : 1;
    const blockSlow = isBlocking() ? 0.55 : 1;
    const speed = (baseSpeed + gearStats().pwr * 0.04) * state.settings.speed * drinkSlow * blockSlow;
    const nx = state.player.x + mx * speed * dt;
    const ny = state.player.y + my * speed * dt;
    if (!collides(nx, state.player.y)) state.player.x = nx;
    if (!collides(state.player.x, ny)) state.player.y = ny;

    // Footsteps / swim particles
    if (state.footstepCd > 0) state.footstepCd -= dt;
    if (state.bubbleCd > 0) state.bubbleCd -= dt;
    if (state.drownCd > 0) state.drownCd -= dt;

    const biome = state.dungeon?.active
      ? "dungeon"
      : biomeAt(Math.floor(state.player.x), Math.floor(state.player.y));

    if (moving && state.footstepCd <= 0) {
      SFX.unlock();
      if (state.swimming) {
        spawnParticles(state.player.x, state.player.y + 0.15, 3, "splash");
        SFX.footstep("water");
        state.footstepCd = 0.34;
      } else {
        const ground = getTile(Math.floor(state.player.x), Math.floor(state.player.y));
        let surface = "grass";
        if (state.dungeon?.active || ground === TILES.STONE || ground === TILES.COBBLE || ground === TILES.FLOOR || ground === TILES.WALL || ground === TILES.RUIN) {
          surface = "stone";
        } else if (biome === "forest") {
          surface = "forest";
        } else if (ground === TILES.SAND) {
          surface = "sand";
        } else if (ground === TILES.DIRT || ground === TILES.PATH) {
          surface = "dirt";
        }
        if (ground === TILES.SAND || ground === TILES.DIRT || ground === TILES.PATH || ground === TILES.GRASS || ground === TILES.TREE) {
          spawnParticles(state.player.x, state.player.y + 0.35, 2, "dust");
        }
        SFX.footstep(surface);
        // Natural walking cadence
        state.footstepCd = 0.38 / Math.max(0.75, state.settings.speed || 1);
      }
    }

    SFX.syncAmbience({
      running: state.running,
      dungeon: !!state.dungeon?.active,
      biome,
      moving,
    });

    // Breath + bubbles while swimming
    if (state.swimming) {
      state.breath = Math.max(0, state.breath - 12 * dt); // ~8s of air
      if (state.bubbleCd <= 0) {
        spawnParticles(state.player.x + (Math.random() - 0.5) * 0.3, state.player.y - 0.2, 2, "bubble");
        state.bubbleCd = 0.2 + Math.random() * 0.15;
      }
      if (state.breath <= 0 && state.drownCd <= 0) {
        spawnParticles(state.player.x, state.player.y, 10, "drown");
        playerHurt(12);
        state.drownCd = 0.7;
        showToast("Drowning! Get to shore!", true);
        if (state.hp <= 0) {
          // playerHurt already handles death respawn; reset breath after
          state.breath = state.maxBreath;
          state.swimming = false;
        }
      }
    } else {
      state.breath = Math.min(state.maxBreath, state.breath + 35 * dt);
    }
    updateBreathUI();

    // Ambient shore mist / river spray near water
    if (!state.dungeon?.active && state.settings.particles && Math.random() < 0.08) {
      const px = Math.floor(state.player.x), py = Math.floor(state.player.y);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (getTile(px + dx, py + dy) === TILES.WATER && Math.random() < 0.2) {
            const kind = waterKindAt(px + dx, py + dy);
            spawnParticles(px + dx + 0.5, py + dy + 0.5, kind === "waterfall" ? 3 : 1, kind === "waterfall" ? "splash" : "bubble");
          }
        }
      }
    }

    if (!state.dungeon?.active) {
      const { cx, cy } = worldToChunk(Math.floor(state.player.x), Math.floor(state.player.y));
      const rd = state.settings.renderDist;
      for (let y = -rd; y <= rd; y++) for (let x = -rd; x <= rd; x++) ensureChunk(cx + x, cy + y);
    }
    if (state.hitCd > 0) state.hitCd -= dt;
    if (state.hurtCd > 0) state.hurtCd -= dt;
    if (state.blockFlash > 0) state.blockFlash = Math.max(0, state.blockFlash - dt);
    // Keep block state honest if armor was unequipped
    if (state.blocking && !canBlock()) state.blocking = false;
    if ((state.tempPwrT || 0) > 0) {
      state.tempPwrT -= dt;
      if (state.tempPwrT <= 0) {
        state.tempPwrT = 0;
        state.tempPwr = 0;
        showToast("Might buff faded.");
      }
    }
    updateDayNight(dt);
    updateMonsters(dt);
    updateChests(dt);
    updateMining(dt);
    updateProjectiles(dt);
    if (state.attackAnim > 0) state.attackAnim = Math.max(0, state.attackAnim - dt);
    if (state.drinkAnim > 0) {
      state.drinkAnim -= dt;
      state.drinkSfxCd = (state.drinkSfxCd || 0) - dt;
      if (state.drinkSfxCd <= 0 && state.drinkAnim > 0.12) {
        SFX.drinkGulp();
        state.drinkSfxCd = 0.22;
      }
      if (Math.random() < 0.4) {
        spawnParticles(state.player.x, state.player.y - 0.4, 1, state.drinkItem?.effect === "breath" ? "bubble" : "heal");
      }
      if (state.drinkAnim <= 0) finishDrink();
    }
    // Floating combat / heal numbers
    state.floatTexts = state.floatTexts.filter((ft) => {
      ft.life -= dt;
      ft.y += ft.vy * dt;
      ft.vy *= 0.96;
      return ft.life > 0;
    });
    // Low HP tip — remind them they can drink
    if (state.hp / Math.max(1, state.maxHp) <= 0.35 && !state.lowHpWarned && state.drinkAnim <= 0) {
      const hasHeal = state.slots.some((it) => it && it.type === "consumable" && it.effect === "heal");
      if (hasHeal) {
        state.lowHpWarned = true;
        showToast("Low HP! Press H or hold a potion & drink.", true);
      }
    }
    if (state.swimming) state.swimAnim = (state.swimAnim || 0) + dt; else state.swimAnim = 0;

    state.interactTarget = findInteractable();
    const prompt = $("interact-prompt");
    if (state.interactTarget) {
      prompt.classList.remove("hidden");
      prompt.innerHTML = `${state.interactTarget.label || "Interact"} — press <kbd>E</kbd> / Tap`;
    } else {
      prompt.classList.add("hidden");
    }
  }


  function pxRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
  }

  function pxDot(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  function n01(x, y, s = 1) {
    return hash2(Math.floor(x * s), Math.floor(y * s), 7771);
  }

  function mixHex(a, b, t) {
    const parse = (h) => {
      const n = h.replace("#", "");
      return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
    };
    const A = parse(a), B = parse(b);
    const r = Math.round(A[0] + (B[0] - A[0]) * t);
    const g = Math.round(A[1] + (B[1] - A[1]) * t);
    const bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function fillNoise(px, py, ts, wx, wy, c1, c2, dens = 0.45) {
    pxRect(px, py, ts, ts, c1);
    const step = Math.max(2, Math.floor(ts / 10));
    for (let y = 0; y < ts; y += step) {
      for (let x = 0; x < ts; x += step) {
        if (n01(wx * 10 + x, wy * 10 + y) < dens) pxRect(px + x, py + y, step, step, c2);
      }
    }
  }

  function outlineRect(x, y, w, h, fill, line = "#0a0a0a") {
    pxRect(x, y, w, h, line);
    pxRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), fill);
  }

  function gearMetal(item, kind) {
    if (!item) return kind === "wood" ? "#8a6030" : "#c0c8d0";
    const r = item.rarity || "common";
    if (kind === "blade") {
      if (r === "legendary") return "#e8f0ff";
      if (r === "epic") return "#d0a0ff";
      if (r === "rare") return "#c8a050";
      if (r === "uncommon") return "#b0b8c8";
      return "#d8c090"; // wood sword
    }
    if (kind === "pick") {
      if (r === "legendary") return "#ffe060";
      if (r === "epic") return "#a0e0ff";
      if (r === "rare") return "#90c0e0";
      if (r === "uncommon") return "#c0c8d0";
      return "#c4a060"; // wood pick head
    }
    return "#c0a878";
  }

  /** Draw a recognizable sword (handle + guard + tapered blade) along angle. */
  function drawSwordArt(cx, cy, ang, len, item) {
    const blade = gearMetal(item, "blade");
    const edge = "#ffffffaa";
    const guard = item && item.rarity === "legendary" ? "#f0d060" : "#c8a040";
    const grip = "#6a4020";
    ctx.save();
    ctx.translate(Math.floor(cx), Math.floor(cy));
    ctx.rotate(ang);
    // pommel
    outlineRect(-2, len * 0.38, 4, 4, "#8a6820");
    // grip
    outlineRect(-2, len * 0.08, 4, len * 0.32, grip);
    pxRect(-1, len * 0.12, 2, len * 0.24, "#8a5830");
    // crossguard
    outlineRect(-7, len * 0.02, 14, 4, guard);
    pxRect(-5, len * 0.04, 10, 1, "#ffe8a0");
    // blade body
    outlineRect(-3, -len * 0.55, 6, len * 0.58, blade);
    // center fuller / shine
    pxRect(-1, -len * 0.5, 2, len * 0.45, edge);
    // tip
    outlineRect(-2, -len * 0.62, 4, 5, blade);
    outlineRect(-1, -len * 0.68, 2, 5, blade);
    ctx.restore();
  }

  /** Draw a recognizable pickaxe (haft + dual pointed head). */
  function drawPickaxeArt(cx, cy, ang, len, item) {
    const head = gearMetal(item, "pick");
    const haft = "#7a4a22";
    ctx.save();
    ctx.translate(Math.floor(cx), Math.floor(cy));
    ctx.rotate(ang);
    // haft
    outlineRect(-2, -len * 0.15, 4, len * 0.7, haft);
    pxRect(-1, -len * 0.1, 2, len * 0.55, "#9a6838");
    // head bar
    outlineRect(-10, -len * 0.28, 20, 6, head);
    pxRect(-8, -len * 0.25, 16, 2, "#ffffff66");
    // pointed tips (left & right)
    outlineRect(-14, -len * 0.26, 5, 4, head);
    outlineRect(-16, -len * 0.22, 4, 3, head);
    outlineRect(9, -len * 0.26, 5, 4, head);
    outlineRect(12, -len * 0.22, 4, 3, head);
    // binding
    outlineRect(-3, -len * 0.2, 6, 4, "#5a3818");
    ctx.restore();
  }

  /** Draw a round / kite shield facing the camera plane. */
  function drawShieldArt(cx, cy, w, h, item, raised) {
    const face = item && item.shield
      ? (item.rarity === "legendary" ? "#f0d060" : item.rarity === "epic" ? "#b070e0" : item.rarity === "rare" ? "#6088c8" : item.rarity === "uncommon" ? "#9098a8" : "#c8a878")
      : "#a09070";
    const rim = "#3a2810";
    const boss = "#ffe060";
    const x = Math.floor(cx - w / 2);
    const y = Math.floor(cy - h / 2);
    // outer rim
    outlineRect(x, y, w, h, face, rim);
    // inner panel
    pxRect(x + 2, y + 2, w - 4, h - 4, face);
    pxRect(x + 3, y + 3, w - 6, Math.max(2, Math.floor(h * 0.35)), "#ffffff33");
    // vertical / cross straps
    pxRect(x + Math.floor(w / 2) - 1, y + 3, 2, h - 6, "#5a3820");
    pxRect(x + 3, y + Math.floor(h / 2) - 1, w - 6, 2, "#5a3820");
    // boss / gem
    outlineRect(x + Math.floor(w / 2) - 2, y + Math.floor(h / 2) - 2, 5, 5, boss);
    if (raised) {
      pxRect(x - 1, y - 1, w + 2, 2, "#a0d0ff88");
    }
  }

  /** Pixel-Dungeons silhouette + realistic light/AO rim */
  function shadeTile(px, py, ts) {
    pxRect(px, py, ts, 1, "rgba(255,255,255,0.12)");
    pxRect(px, py, 1, ts, "rgba(255,255,255,0.08)");
    pxRect(px, py + ts - 1, ts, 1, "rgba(0,0,0,0.28)");
    pxRect(px + ts - 1, py, 1, ts, "rgba(0,0,0,0.22)");
  }

  function drawTileArt(tile, px, py, ts, wx, wy) {
    const c = (wx + wy) & 1;
    const inD = !!(state.dungeon && state.dungeon.active);
    switch (tile) {
      case TILES.GRASS: {
        // Pixel Dungeons base + realistic blades / soil
        const base = c ? "#2f9a3c" : "#288834";
        const lit = c ? "#3cbc48" : "#34a840";
        fillNoise(px, py, ts, wx, wy, base, lit, 0.4);
        // soil patches
        if (n01(wx, wy, 3) > 0.68) pxRect(px + ts * 0.5, py + ts * 0.65, 4, 2, "#6a4a28");
        // grass blades with lit tips
        for (let i = 0; i < 6; i++) {
          const gx = 2 + Math.floor(n01(wx + i, wy + 9) * (ts - 5));
          const gh = 3 + Math.floor(n01(wx + i, wy + 2) * (ts * 0.4));
          pxRect(px + gx, py + ts - gh - 1, 1, gh, mixHex("#1e6028", "#48c058", n01(wx, i)));
          pxDot(px + gx, py + ts - gh - 1, "#a8ff90");
        }
        if (n01(wx * 3, wy * 5) > 0.82) pxDot(px + ts * 0.4, py + ts * 0.3, "#d0ffb0");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.DIRT: {
        fillNoise(px, py, ts, wx, wy, c ? "#9a6e42" : "#8a5e38", "#6a4428", 0.45);
        pxRect(px + 2, py + 3, 3, 2, "#4a2e18");
        pxRect(px + ts * 0.55, py + ts * 0.5, 4, 2, "#b88858");
        pxDot(px + ts * 0.3, py + ts * 0.35, "#3a2010");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.MOSS: {
        fillNoise(px, py, ts, wx, wy, "#2a6834", "#3a8844", 0.5);
        for (let i = 0; i < 5; i++) pxDot(px + 2 + i * 2, py + 4 + (i % 3), "#58b060");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.STONE: {
        const a = inD ? "#3a3648" : "#6e6e76";
        const b = inD ? "#4a4660" : "#86868e";
        fillNoise(px, py, ts, wx, wy, a, b, 0.35);
        pxRect(px, py, ts, 2, inD ? "#6a6680" : "#a8a8b0");
        pxRect(px + ts * 0.2, py + ts * 0.4, ts * 0.5, 1, inD ? "#2a2838" : "#4a4a52");
        pxRect(px + 2, py + 2, 3, 2, inD ? "#7a76a0" : "#c0c0c8");
        // crack
        pxRect(px + ts * 0.4, py + ts * 0.25, 1, ts * 0.35, "#1a1820");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.COBBLE: {
        fillNoise(px, py, ts, wx, wy, "#524c58", "#3a3440", 0.3);
        outlineRect(px + 1, py + 1, ts * 0.42, ts * 0.4, "#7a7480");
        outlineRect(px + ts * 0.5, py + ts * 0.48, ts * 0.42, ts * 0.42, "#6a6470");
        pxRect(px + 2, py + 2, ts * 0.3, 1, "#9a94a0");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.RUIN: {
        fillNoise(px, py, ts, wx, wy, "#6a5a4a", "#4a3a2c", 0.4);
        outlineRect(px + 2, py + 2, ts - 4, ts - 4, "#3a2a1c");
        pxRect(px + 3, py + 3, 2, ts - 6, "#1a1008");
        pxRect(px + ts * 0.55, py + 4, 2, ts - 8, "#5a4a38");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.WATER: {
        const kind = waterKindAt(wx, wy) || "lake";
        const t = state.animT * 2.2 + wx * 0.55 + wy * 0.4;
        const wave = Math.sin(t);
        const wave2 = Math.sin(t * 1.6 + 2);
        const deep = kind === "deep" || kind === "waterfall";
        // Depth layers (realistic) on Pixel-Quest cyan palette
        pxRect(px, py, ts, ts, deep ? "#0e3a80" : "#1868b8");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, kind === "marsh" ? "#1a7888" : "#2890d8");
        pxRect(px + 1, py + ts * 0.55, ts - 2, ts * 0.45 - 1, deep ? "#0a2860" : "#1460a0");
        const ry1 = ts * (0.22 + wave * 0.05);
        const ry2 = ts * (0.48 + wave2 * 0.04);
        pxRect(px + 2, py + ry1, ts - 4, 2, "#68c0f0");
        pxRect(px + 3, py + ry1 - 1, ts - 6, 1, "#c0ecff");
        pxRect(px + 2, py + ry2, ts - 4, 1, "#48a0d0");
        pxRect(px + ts * 0.55, py + ts * 0.12, 3, 2, "rgba(220,245,255,0.55)");
        if (wave > 0.55) pxDot(px + ts * 0.28, py + ts * 0.35, "#ffffff");
        [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => {
          const nt = getTile(wx + dx, wy + dy);
          if (nt !== TILES.WATER && nt !== TILES.LAVA) {
            if (dy === -1) pxRect(px + 1, py, ts - 2, 2, "rgba(255,255,255,0.5)");
            if (dy === 1) pxRect(px + 1, py + ts - 2, ts - 2, 2, "rgba(180,220,255,0.35)");
            if (dx === -1) pxRect(px, py + 1, 2, ts - 2, "rgba(200,230,255,0.3)");
            if (dx === 1) pxRect(px + ts - 2, py + 1, 2, ts - 2, "rgba(200,230,255,0.3)");
          }
        });
        if (kind === "marsh" && n01(wx, wy, 8) > 0.55) {
          outlineRect(px + ts * 0.25, py + ts * 0.35, 5, 3, "#2e8840");
          pxRect(px + ts * 0.28, py + ts * 0.36, 3, 2, "#48b058");
          pxDot(px + ts * 0.45, py + ts * 0.3, "#ff70a0");
        }
        if (kind === "waterfall" || kind === "stream") {
          const fall = (state.animT * 12 + wx * 3) % ts;
          pxRect(px + ts * 0.3, py + fall, 2, 6, "rgba(255,255,255,0.75)");
          pxRect(px + ts * 0.55, py + (fall + ts * 0.4) % ts, 2, 5, "rgba(180,230,255,0.55)");
          pxRect(px + 2, py + ts - 3, ts - 4, 2, "rgba(255,255,255,0.35)");
        }
        if (kind === "river") {
          const flow = (state.animT * 10 + wy) % (ts - 4);
          pxRect(px + flow, py + ts * 0.4, 5, 2, "rgba(220,245,255,0.4)");
        }
        pxRect(px, py + ts - 2, ts, 2, "rgba(0,20,50,0.35)");
        break;
      }
      case TILES.SAND: {
        fillNoise(px, py, ts, wx, wy, c ? "#dcc890" : "#d0bc80", "#b8a468", 0.3);
        pxRect(px + 3, py + 5, 4, 1, "#ece0b0");
        pxDot(px + ts * 0.25, py + ts * 0.55, "#f0e8c0");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.PATH: {
        fillNoise(px, py, ts, wx, wy, c ? "#b89868" : "#a88858", "#786038", 0.35);
        pxRect(px + 1, py + 1, 3, 2, "#d4b888");
        pxRect(px + ts * 0.5, py + ts * 0.55, 4, 2, "#5a4428");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.FLOOR: {
        if (inD) {
          fillNoise(px, py, ts, wx, wy, c ? "#2a2438" : "#221e30", "#34304a", 0.35);
          if (n01(wx, wy, 5) > 0.65) pxRect(px + ts * 0.35, py + ts * 0.4, 3, 2, "#4a4460");
          // worn tile seams
          pxRect(px, py + ts * 0.5, ts, 1, "rgba(0,0,0,0.25)");
          pxRect(px + ts * 0.5, py, 1, ts, "rgba(0,0,0,0.2)");
        } else {
          fillNoise(px, py, ts, wx, wy, "#5a4028", "#4a3018", 0.25);
          pxRect(px + 1, py + 1, ts - 2, Math.floor(ts / 3) - 1, "#7a5838");
          pxRect(px + 1, py + Math.floor(ts / 3), ts - 2, Math.floor(ts / 3), "#6a4828");
          pxRect(px + 1, py + Math.floor((ts * 2) / 3), ts - 2, Math.floor(ts / 3) - 1, "#5a3820");
          pxRect(px + 2, py + 2, ts - 4, 1, "#9a7850");
          pxRect(px + 2, py + ts * 0.5, ts - 4, 1, "#2a1808");
        }
        shadeTile(px, py, ts);
        break;
      }
      case TILES.WALL: {
        if (inD) {
          fillNoise(px, py, ts, wx, wy, "#1a1628", "#2e2a48", 0.4);
          outlineRect(px + 1, py + 1, ts - 2, ts - 2, "#3a3458");
          pxRect(px + 2, py + 2, ts - 4, 2, "#5a5480");
          pxRect(px, py + ts * 0.33, ts, 1, "#0a0810");
          pxRect(px, py + ts * 0.66, ts, 1, "#0a0810");
          pxRect(px + ts * 0.5, py, 1, ts * 0.33, "#0a0810");
        } else {
          fillNoise(px, py, ts, wx, wy, "#2a221a", "#3a3228", 0.4);
          outlineRect(px + 1, py + 1, ts - 2, ts - 2, "#4a4034");
          pxRect(px + 2, py + 2, ts - 4, 2, "#6a6050");
          pxRect(px, py + ts * 0.45, ts, 1, "#120e0a");
        }
        shadeTile(px, py, ts);
        break;
      }
      case TILES.LAVA: {
        const pulse = 0.5 + Math.sin(state.animT * 4.5 + wx * 1.2 + wy) * 0.5;
        pxRect(px, py, ts, ts, "#2a0600");
        outlineRect(px + 1, py + 1, ts - 2, ts - 2, mixHex("#c03010", "#ff7020", pulse));
        pxRect(px + ts * 0.25, py + ts * 0.2, 4, 4, mixHex("#e05020", "#ffe060", pulse));
        if (pulse > 0.7) pxDot(px + ts * 0.45, py + ts * 0.35, "#fff8c0");
        pxRect(px, py + ts - 2, ts, 2, "#1a0400");
        break;
      }
      case TILES.TREE: {
        fillNoise(px, py, ts, wx, wy, "#1e6a28", "#288034", 0.25);
        outlineRect(px + ts * 0.38, py + ts * 0.48, ts * 0.24, ts * 0.48, "#6a4020");
        pxRect(px + ts * 0.42, py + ts * 0.55, 1, ts * 0.35, "#3a2010");
        pxRect(px + ts * 0.52, py + ts * 0.6, 1, ts * 0.25, "#8a5830");
        outlineRect(px + ts * 0.1, py + ts * 0.06, ts * 0.8, ts * 0.42, "#1e7030");
        outlineRect(px + ts * 0.2, py + 2, ts * 0.6, ts * 0.34, "#34a844");
        pxRect(px + ts * 0.32, py + ts * 0.1, ts * 0.22, ts * 0.14, "#58d068");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.FLOWER: {
        fillNoise(px, py, ts, wx, wy, "#2f9a3c", "#288834", 0.3);
        pxRect(px + ts * 0.46, py + ts * 0.4, 2, ts * 0.4, "#1e5018");
        outlineRect(px + ts * 0.28, py + ts * 0.22, 5, 5, "#e04050");
        outlineRect(px + ts * 0.48, py + ts * 0.18, 5, 5, "#ff7090");
        outlineRect(px + ts * 0.38, py + ts * 0.14, 5, 5, "#d03040");
        pxRect(px + ts * 0.42, py + ts * 0.26, 3, 3, "#ffe060");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.FENCE: {
        fillNoise(px, py, ts, wx, wy, "#2f9a3c", "#288834", 0.25);
        outlineRect(px + ts * 0.15, py + 2, 3, ts - 4, "#a87840");
        outlineRect(px + ts * 0.7, py + 2, 3, ts - 4, "#a87840");
        outlineRect(px + 2, py + ts * 0.3, ts - 4, 3, "#d4b070");
        outlineRect(px + 2, py + ts * 0.55, ts - 4, 2, "#8a6030");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.BANNER: {
        fillNoise(px, py, ts, wx, wy, "#2f9a3c", "#288834", 0.2);
        outlineRect(px + ts * 0.45, py + 1, 2, ts - 2, "#6a4020");
        outlineRect(px + ts * 0.15, py + 2, ts * 0.5, ts * 0.42, "#e04040");
        pxRect(px + ts * 0.22, py + 5, ts * 0.35, ts * 0.2, "#ff6060");
        pxRect(px + ts * 0.3, py + 8, ts * 0.22, ts * 0.12, "#ffe060");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.DOOR: {
        fillNoise(px, py, ts, wx, wy, "#4a3018", "#3a2008", 0.25);
        outlineRect(px + 2, py + 1, ts - 4, ts - 2, "#6a4020");
        pxRect(px + 4, py + 3, ts * 0.28, ts * 0.35, "#5a3418");
        pxRect(px + ts * 0.52, py + 3, ts * 0.28, ts * 0.35, "#5a3418");
        pxRect(px + 4, py + ts * 0.5, ts * 0.28, ts * 0.35, "#5a3418");
        pxRect(px + ts * 0.52, py + ts * 0.5, ts * 0.28, ts * 0.35, "#5a3418");
        pxRect(px + ts * 0.7, py + ts * 0.48, 2, 2, "#ffe060");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.VILLAGE: {
        // Timber-frame + plaster, Pixel Dungeons outline, realistic beams
        fillNoise(px, py, ts, wx, wy, "#c8b890", "#b8a880", 0.2);
        pxRect(px, py, ts, ts, "#0a0a0a");
        pxRect(px + 1, py + 1, ts - 2, ts - 2, "#e0d0a8");
        pxRect(px + 2, py + 2, ts - 4, 2, "#f4e8c8");
        pxRect(px + 1, py + 1, 2, ts - 2, "#2a1a10");
        pxRect(px + ts - 3, py + 1, 2, ts - 2, "#2a1a10");
        pxRect(px + 1, py + 1, ts - 2, 2, "#2a1a10");
        pxRect(px + 1, py + ts - 3, ts - 2, 2, "#2a1a10");
        pxRect(px + ts * 0.45, py + 1, 2, ts - 2, "#2a1a10");
        // glass with reflection
        outlineRect(px + ts * 0.18, py + ts * 0.28, ts * 0.26, ts * 0.3, "#2890c8");
        outlineRect(px + ts * 0.55, py + ts * 0.28, ts * 0.26, ts * 0.3, "#2890c8");
        pxRect(px + ts * 0.2, py + ts * 0.3, 2, 2, "#a0e0ff");
        pxRect(px + ts * 0.57, py + ts * 0.3, 2, 2, "#a0e0ff");
        shadeTile(px, py, ts);
        break;
      }
      case TILES.DUNGEON: {
        const t = state.animT * 4 + wx + wy;
        fillNoise(px, py, ts, wx, wy, "#0a0610", "#140818", 0.3);
        outlineRect(px + 1, py + 1, ts - 2, ts - 2, "#2a1a38");
        const cx0 = px + ts / 2, cy0 = py + ts / 2;
        const r = ts * 0.38;
        pxRect(cx0 - r - 1, cy0 - r - 1, r * 2 + 2, r * 2 + 2, "rgba(120,60,220,0.4)");
        pxRect(cx0 - r, cy0 - r, r * 2, r * 2, mixHex("#5018a0", "#2080ff", 0.4 + Math.sin(t) * 0.2));
        pxRect(cx0 - r * 0.7, cy0 - r * 0.7, r * 1.4, r * 1.4, mixHex("#9030ff", "#40e0ff", 0.5 + Math.cos(t * 1.3) * 0.25));
        pxRect(cx0 - r * 0.35, cy0 - r * 0.35, r * 0.7, r * 0.7, "#f0e8ff");
        for (let i = 0; i < 6; i++) {
          const a = t + i * 1.05;
          pxRect(cx0 + Math.cos(a) * r * 0.55 - 1, cy0 + Math.sin(a) * r * 0.55 - 1, 2, 2, i % 2 ? "#60e0ff" : "#e080ff");
        }
        break;
      }
      case TILES.TORCH: {
        fillNoise(px, py, ts, wx, wy, inD ? "#2a2438" : "#2f9a3c", inD ? "#34304a" : "#288834", 0.25);
        outlineRect(px + ts * 0.4, py + ts * 0.35, 3, ts * 0.5, "#8a5030");
        const flicker = 0.5 + Math.sin(state.animT * 14 + wx) * 0.5;
        outlineRect(px + ts * 0.3, py + ts * 0.1, 7, 7, mixHex("#ff5010", "#ffe060", flicker));
        pxRect(px + ts * 0.4, py + ts * 0.14, 3, 3, "#fff8c0");
        // glow wash
        pxRect(px + 2, py + 2, ts - 4, ts - 4, `rgba(255,160,40,${0.08 + flicker * 0.08})`);
        break;
      }
      case TILES.CHEST: {
        fillNoise(px, py, ts, wx, wy, inD ? "#2a2438" : "#2f9a3c", inD ? "#34304a" : "#288834", 0.2);
        const ch = findAnyChestAt(wx, wy);
        // Looted chests are removed from the map; if still here, show opening lid
        if (ch && (ch.opened || ch.looted)) {
          clearChestTile(ch);
          fillNoise(px, py, ts, wx, wy, inD ? "#2a2438" : "#2f9a3c", inD ? "#34304a" : "#288834", 0.2);
          shadeTile(px, py, ts);
          break;
        }
        const openAmt = ch ? (ch.opening ? Math.min(1, (ch.openT || 0) / 0.55) : 0) : 0;
        // body
        outlineRect(px + ts * 0.12, py + ts * 0.38, ts * 0.76, ts * 0.42, "#c08030");
        pxRect(px + ts * 0.18, py + ts * 0.55, ts * 0.64, 1, "#8a5020");
        outlineRect(px + ts * 0.42, py + ts * 0.52, 4, 4, openAmt > 0.5 ? "#ffe060" : "#d4a84b");
        // lid — lifts / tilts open
        const lidY = py + ts * 0.28 - openAmt * ts * 0.35;
        const lidH = Math.max(4, ts * 0.22);
        outlineRect(px + ts * 0.1, lidY, ts * 0.8, lidH, "#e0a050");
        pxRect(px + ts * 0.16, lidY + 2, ts * 0.68, 2, "#f0c070");
        if (openAmt > 0.2) {
          // gold glow from inside
          pxRect(px + ts * 0.3, py + ts * 0.4, ts * 0.4, ts * 0.15, `rgba(255,220,80,${0.25 + openAmt * 0.45})`);
        }
        shadeTile(px, py, ts);
        break;
      }
      case TILES.STAIRS: {
        fillNoise(px, py, ts, wx, wy, "#1a1628", "#2e2a40", 0.3);
        outlineRect(px + 2, py + 2, ts - 4, ts - 4, "#4a4468");
        for (let i = 0; i < 4; i++) {
          pxRect(px + 4, py + 4 + i * (ts / 5), ts - 8, 2, "#7a74a0");
          pxRect(px + 4, py + 5 + i * (ts / 5), ts - 8, 1, "#3a3450");
        }
        pxRect(px + ts * 0.4, py + ts * 0.12, ts * 0.2, 2, "#ffe060");
        break;
      }
      case TILES.EXIT: {
        fillNoise(px, py, ts, wx, wy, "#1a1628", "#243050", 0.3);
        outlineRect(px + 2, py + 2, ts - 4, ts - 4, "#3868b0");
        pxRect(px + ts * 0.35, py + ts * 0.25, ts * 0.3, ts * 0.5, "#60a0ff");
        pxRect(px + ts * 0.4, py + ts * 0.3, ts * 0.2, 2, "#c0e0ff");
        break;
      }
      case TILES.QUEST: {
        fillNoise(px, py, ts, wx, wy, "#2f9a3c", "#288834", 0.25);
        const bob = Math.sin(state.animT * 4 + wx) * 2;
        outlineRect(px + ts * 0.22, py + ts * 0.12 + bob, ts * 0.56, ts * 0.58, "#ffe060");
        pxRect(px + ts * 0.35, py + ts * 0.28 + bob, ts * 0.3, ts * 0.28, "#c08020");
        pxRect(px + ts * 0.4, py + ts * 0.35 + bob, ts * 0.2, 2, "#fff0a0");
        break;
      }
      case TILES.BOSS: {
        const pulse = 0.85 + Math.sin(state.animT * 5) * 0.15;
        fillNoise(px, py, ts, wx, wy, "#1a0808", "#100404", 0.3);
        const s = ts * 0.7 * pulse;
        outlineRect(px + (ts - s) / 2, py + (ts - s) / 2 - 1, s, s, "#e04048");
        pxRect(px + ts * 0.3, py + ts * 0.3, 3, 3, "#ffe060");
        pxRect(px + ts * 0.58, py + ts * 0.3, 3, 3, "#ffe060");
        pxRect(px + ts * 0.35, py + ts * 0.55, ts * 0.3, 2, "#1a0808");
        break;
      }
      case TILES.ROOF: {
        pxRect(px, py, ts, ts, "#a04030");
        break;
      }
      default:
        pxRect(px, py, ts, ts, "#333");
    }
  }

  function drawBuildingRoof(b, camX, camY, tileSize, sw, sh) {
    // Pixel Dungeons outline + realistic pitched clay shingles
    const ox = Math.floor((b.x - camX) * tileSize + sw / 2);
    const oy = Math.floor((b.y - camY) * tileSize + sh / 2);
    const rw = b.w * tileSize;
    const rh = b.h * tileSize;
    if (ox + rw < -4 || oy + rh < -4 || ox > sw + 4 || oy > sh + 4) return;
    const seed = n01(b.x, b.y, 7);

    pxRect(ox + 2, oy + rh, rw, 4, "rgba(0,0,0,0.35)");
    // black outline shell
    pxRect(ox - 3, oy - 3, rw + 6, rh + 5, "#0a0a0a");

    const rows = Math.max(7, Math.floor(rh / 2));
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1 || 1);
      const y = oy + Math.floor(t * (rh - 2));
      const over = Math.floor(1 + t * 2);
      const x = ox - over;
      const w = rw + over * 2;
      const mid = Math.floor(w / 2);
      const left = t < 0.12 ? "#7a3020" : (row % 2 ? "#b04838" : "#9a3830");
      const right = t < 0.12 ? "#c05840" : (row % 2 ? "#e06850" : "#d05040");
      pxRect(x, y, mid, 3, left);
      pxRect(x + mid, y, w - mid, 3, right);
      for (let sx = 0; sx < w; sx += 4) {
        const seamX = x + sx + (row % 2) * 2;
        if (seamX < x || seamX > x + w - 2) continue;
        pxRect(seamX, y, 2, 2, sx < mid ? "#c06048" : "#f08060");
        pxRect(seamX + 1, y + 1, 1, 1, "#501810");
      }
      if (seed > 0.55 && row % 5 === 3) pxRect(x + w * 0.22, y, 4, 2, "#3a6838");
      if (seed > 0.7 && row % 6 === 2) pxRect(x + w * 0.7, y, 3, 2, "#4a7848");
    }
    // ridge
    pxRect(ox + rw * 0.18, oy - 2, rw * 0.64, 4, "#0a0a0a");
    pxRect(ox + rw * 0.22, oy - 1, rw * 0.56, 2, "#e88860");
    pxRect(ox + rw * 0.48, oy, 2, Math.max(4, rh * 0.18), "rgba(0,0,0,0.3)");
    // gables
    for (let i = 0; i < Math.floor(rh * 0.4); i++) {
      const inset = Math.floor(i * 0.85);
      pxRect(ox - 2 + inset, oy + 2 + i, 2, 2, "#3a1810");
      pxRect(ox + rw - inset, oy + 2 + i, 2, 2, "#3a1810");
    }
    // chimney
    const chx = ox + Math.floor(rw * (0.58 + seed * 0.15));
    const chy = oy + Math.floor(rh * 0.1);
    outlineRect(chx, chy, Math.max(5, tileSize * 0.28), Math.max(9, rh * 0.32), "#7a7a82");
    pxRect(chx + 1, chy + 3, Math.max(2, tileSize * 0.16), 1, "#4a4a52");
    pxRect(chx - 1, chy - 2, Math.max(7, tileSize * 0.36), 3, "#9a9aa2");
    if (seed > 0.35) {
      const smokeY = chy - 4 - Math.floor((state.animT * 6 + b.x) % 5);
      pxRect(chx + 1, smokeY, 2, 3, "rgba(200,200,200,0.4)");
      pxRect(chx + 2, smokeY - 3, 2, 2, "rgba(220,220,220,0.22)");
    }
    pxRect(ox + rw * 0.55, oy + rh * 0.15, 2, rh * 0.4, "rgba(255,210,150,0.16)");
    pxRect(ox - 2, oy + rh - 1, rw + 4, 2, "rgba(0,0,0,0.4)");
  }

  function drawPlayer(ppx, ppy, ps) {
    const armor = state.equipped.armor;
    const weapon = getCombatWeapon();
    const tool = getCombatPick() || (getHandItem() && getHandItem().slot === "tool" ? getHandItem() : state.equipped.tool);
    const book = state.equipped.book || getActiveGear("book");
    const bow = getCombatBow();
    const body = armor
      ? (armor.rarity === "legendary" ? "#f0c050" : armor.rarity === "epic" ? "#c060ff" : armor.rarity === "rare" ? "#50a0ff" : armor.rarity === "uncommon" ? "#50d060" : "#a09070")
      : "#40c050";
    const swim = state.swimming;
    const swimKick = swim ? Math.sin((state.swimAnim || 0) * 10) * 3 : 0;
    const bob = swim ? Math.sin((state.swimAnim || 0) * 6) * 1.5 : 0;
    const sub = swim ? ps * 0.28 : 0;
    const face = state.player.facing || 0;
    const lookX = Math.cos(face) * 2;
    const lookY = Math.sin(face) * 1;
    const right = Math.cos(face) >= 0 ? 1 : -1;
    const s = Math.max(10, ps * 1.12);
    const swingT = state.attackAnim > 0 ? (state.attackAnim / 0.35) : 0;
    const mineT = state.mineAnim > 0 ? Math.sin(state.animT * 18) : 0;
    const drinking = state.drinkAnim > 0;
    const drinkT = drinking ? 1 - Math.max(0, state.drinkAnim / 0.9) : 0; // 0→1 through drink
    const tipBack = drinking ? Math.sin(Math.min(1, drinkT * 1.15) * Math.PI) * 5 : 0;
    const blocking = isBlocking() && !drinking && !swim;
    const blockArmor = getBlockArmor();

    if (swim) pxRect(ppx - s * 0.4, ppy + s * 0.28 + bob, s * 0.8, 3, "rgba(20,60,120,0.45)");
    else pxRect(ppx - s * 0.35, ppy + s * 0.42, s * 0.7, 3, "rgba(0,0,0,0.4)");

    if (!swim) {
      outlineRect(ppx - s * 0.28, ppy + s * 0.12 + bob, s * 0.22, s * 0.35, "#3a2818");
      outlineRect(ppx + s * 0.06, ppy + s * 0.12 + bob, s * 0.22, s * 0.35, "#3a2818");
    } else {
      // swimming kick legs
      outlineRect(ppx - s * 0.3 - swimKick * 0.3, ppy + s * 0.15 + bob, s * 0.2, s * 0.25, "#3a2818");
      outlineRect(ppx + s * 0.1 + swimKick * 0.3, ppy + s * 0.15 + bob, s * 0.2, s * 0.25, "#3a2818");
    }

    outlineRect(ppx - s / 2, ppy - s * 0.12 + bob - sub, s, s * 0.5, body);
    pxRect(ppx - s * 0.4, ppy - s * 0.05 + bob - sub, s * 0.8, 2, "rgba(255,255,255,0.2)");
    if (armor) pxRect(ppx - s * 0.15, ppy + s * 0.05 + bob - sub, 3, 3, "#ffe060");

    // Head tips back while drinking
    outlineRect(ppx - s * 0.3, ppy - s * 0.5 + bob - sub - tipBack, s * 0.6, s * 0.42, "#f0c090");
    outlineRect(ppx - s * 0.22, ppy - s * 0.55 + bob - sub - tipBack, s * 0.44, s * 0.18, "#5a3820");
    pxRect(ppx - 3 + lookX, ppy - s * 0.3 + lookY + bob - sub - tipBack, 2, 2, "#0a0a0a");
    pxRect(ppx + 1 + lookX, ppy - s * 0.3 + lookY + bob - sub - tipBack, 2, 2, "#0a0a0a");

    if (book && !swim && !drinking && !blocking) {
      outlineRect(ppx - right * (s * 0.55) - 2, ppy - s * 0.05 + bob, 6, 8, "#e06040");
    }

    // SHIELD — always visible when equipped; raised in front while blocking
    if (blockArmor && !swim && !drinking) {
      if (blocking) {
        const sx = ppx + Math.cos(face) * (s * 0.55);
        const sy = ppy + Math.sin(face) * (s * 0.22) + bob - sub - 4;
        drawShieldArt(sx, sy, 14, 18, blockArmor, true);
        outlineRect(ppx + right * (s * 0.18), ppy - s * 0.02 + bob - 2, 3, s * 0.28, "#f0c090");
        if (state.blockFlash > 0) {
          ctx.globalAlpha = Math.min(0.6, state.blockFlash * 2.2);
          pxRect(sx - 10, sy - 12, 20, 24, "#a0d8ff");
          ctx.globalAlpha = 1;
        }
      } else {
        // strapped on back / off-hand when not blocking
        drawShieldArt(ppx - right * (s * 0.42), ppy + bob - sub, 10, 13, blockArmor, false);
      }
    }

    // DRINK animation — raise potion to mouth, tip back, glow
    if (drinking && !swim) {
      const bottle = state.drinkItem;
      const col = potionColor(bottle);
      const raise = Math.min(1, drinkT * 1.8);
      const tip = Math.max(0, (drinkT - 0.35) / 0.5);
      const bx = ppx + right * (s * 0.12) + lookX * 0.5;
      const by = ppy - s * (0.05 + raise * 0.48) + bob - sub - tipBack * 0.35;
      // reaching arm
      outlineRect(ppx + right * (s * 0.28), ppy - s * 0.05 + bob - raise * s * 0.28, 3, s * 0.3, "#f0c090");
      // bottle tips toward mouth
      const tilt = Math.floor(tip * 3);
      outlineRect(bx - 3 + tilt, by - 2 - tilt, 7, 11, col);
      pxRect(bx - 2 + tilt, by - tilt, 5, Math.max(2, 7 - Math.floor(tip * 4)), "#ffffff66");
      outlineRect(bx - 1 + tilt, by - 5 - tilt, 3, 4, "#c0a070");
      pxRect(bx + tilt, by - 6 - tilt, 2, 2, "#ffe060");
      // glug droplets
      if (drinkT > 0.3 && drinkT < 0.9) {
        const g = Math.sin(state.animT * 22);
        pxRect(bx - 1 + right * 2, by - 8 + g, 2, 2, "#fff8c0");
        pxRect(bx + 2, by - 11 - g, 2, 2, col);
        pxRect(ppx + lookX, ppy - s * 0.42 + bob - tipBack, 2, 2, "#ffe8c0");
      }
      // pulsing heal / potion aura
      const aura = Math.sin(drinkT * Math.PI);
      ctx.globalAlpha = 0.22 + aura * 0.35;
      pxRect(ppx - s * 0.6, ppy - s * 0.65 + bob - sub - tipBack, s * 1.2, s * 1.25, col);
      ctx.globalAlpha = 0.15 + aura * 0.2;
      pxRect(ppx - s * 0.35, ppy - s * 0.4 + bob - sub - tipBack, s * 0.7, s * 0.7, "#ffffff");
      ctx.globalAlpha = 1;
    }

    // PICKAXE — held when selected / equipped; swings while mining
    const handItem = getHandItem();
    const showingPick = tool && isMineTool(tool) && (!weapon || (handItem && isMineTool(handItem))) && !(handItem && handItem.slot === "bow");
    if (showingPick && !swim && !drinking && !blocking) {
      const mining = state.mineAnim > 0;
      const ang = face + (mining ? mineT * 1.1 : 0.55 * right);
      const reach = s * (0.55 + (mining ? Math.abs(mineT) * 0.25 : 0));
      const hx = ppx + Math.cos(ang) * reach * 0.35;
      const hy = ppy + Math.sin(ang) * reach * 0.25 + bob - sub;
      drawPickaxeArt(hx, hy, ang + Math.PI / 2, s * 0.85, tool);
      if (mining) {
        pxRect(hx + Math.cos(ang) * 8, hy + Math.sin(ang) * 6, 3, 3, "rgba(255,255,220,0.45)");
      }
    }

    // BOW on back / drawn when shooting
    if (bow && !swim && !drinking && !(handItem && handItem.slot === "weapon") && !(showingPick && handItem && isMineTool(handItem))) {
      const drawBack = state.attackAnim > 0 && !weapon ? 1 : 0;
      const bx = ppx - right * (s * 0.42) + lookX * drawBack;
      const by = ppy - s * 0.2 + bob - sub;
      outlineRect(bx, by, 2, s * 0.7, "#8a5030");
      pxRect(bx - 3, by + 2, 8, 2, "#d0d0d0");
      pxRect(bx - 3, by + s * 0.55, 8, 2, "#d0d0d0");
      if (drawBack) pxRect(bx + right * 2, by + s * 0.3, 6, 1, "#f0e0c0");
    }

    // SWORD — held at rest or swung in a clear arc
    const showingSword = weapon && !(handItem && (handItem.slot === "bow" || isMineTool(handItem)));
    if (showingSword && !swim && !drinking && !blocking) {
      const swing = swingT;
      const ang = face + (swing > 0 ? ((1 - swing) * 1.85 - 0.35) * right : 0.35 * right);
      const reach = s * (0.42 + swing * 0.55);
      const wx = ppx + Math.cos(ang) * reach;
      const wy = ppy + Math.sin(ang) * reach * 0.55 + bob - sub;
      drawSwordArt(wx, wy, ang + Math.PI / 2, s * 0.95, weapon);
      if (swing > 0.12) {
        for (let i = 0; i < 5; i++) {
          const a2 = ang - right * i * 0.22;
          pxRect(
            ppx + Math.cos(a2) * reach * 0.9,
            ppy + Math.sin(a2) * reach * 0.5 + bob,
            4, 2,
            `rgba(255,255,255,${0.4 - i * 0.07})`
          );
        }
      }
    } else if (!weapon && !swim && !drinking && swingT > 0 && !blocking) {
      // fist punch
      outlineRect(ppx + right * (s * 0.4 + swingT * s * 0.35), ppy + bob, 4, 4, "#f0c090");
    } else if (!weapon && !bow && !showingPick && !swim && !drinking && !blocking) {
      outlineRect(ppx + right * (s * 0.38), ppy + bob, 3, 3, "#f0c090");
    }

    if (swim && !drinking) {
      // arm paddle
      const paddle = Math.sin((state.swimAnim || 0) * 9) * s * 0.25;
      outlineRect(ppx - s * 0.55 + paddle, ppy + bob, 4, 3, "#f0c090");
      outlineRect(ppx + s * 0.35 - paddle, ppy + bob, 4, 3, "#f0c090");
      pxRect(ppx - s * 0.55, ppy + s * 0.05 + bob, s * 1.1, s * 0.5, "rgba(40,120,200,0.4)");
      pxRect(ppx - s * 0.4, ppy + s * 0.08 + bob, s * 0.8, 2, "rgba(200,240,255,0.5)");
    }
    // Low HP pulse
    if (!drinking && state.hp / Math.max(1, state.maxHp) <= 0.35 && Math.sin(state.animT * 8) > 0.3) {
      ctx.globalAlpha = 0.18;
      pxRect(ppx - s / 2, ppy - s / 2 + bob - sub, s, s, "#ff3030");
      ctx.globalAlpha = 1;
    }
    if (state.hurtCd > 0) {
      ctx.globalAlpha = 0.4;
      pxRect(ppx - s / 2, ppy - s / 2 + bob - sub, s, s, "#ff2020");
      ctx.globalAlpha = 1;
    }
  }

  function tileSizeGuess() {
    const fov = state.settings.fov;
    return Math.max(10, Math.floor(Math.min(canvas.width, canvas.height) / fov));
  }

  function drawMonster(m, px, py, ts) {
    const bob = Math.sin(state.animT * 6 + m.x) * 1.5;
    const s = ts * 0.58;
    if (m.hitFlash > 0) {
      m.hitFlash -= 0.016;
      ctx.globalAlpha = 0.7;
    }
    outlineRect(px - s / 2, py - s / 2 + bob, s, s, m.body || m.color);
    pxRect(px - s * 0.35, py - s * 0.35 + bob, s * 0.7, 2, "rgba(255,255,255,0.15)");
    outlineRect(px - s * 0.32, py - s * 0.38 + bob, s * 0.24, s * 0.24, m.eye || "#ffffff");
    outlineRect(px + s * 0.08, py - s * 0.38 + bob, s * 0.24, s * 0.24, m.eye || "#ffffff");
    pxDot(px - s * 0.22, py - s * 0.28 + bob, "#0a0a0a");
    pxDot(px + s * 0.18, py - s * 0.28 + bob, "#0a0a0a");
    if (m.type === "rat") outlineRect(px - s * 0.45, py + s * 0.1 + bob, s * 0.9, s * 0.28, m.color);
    if (m.type === "spider") {
      pxRect(px - s * 0.5, py + bob, 4, 2, "#0a0a0a");
      pxRect(px + s * 0.28, py + bob, 4, 2, "#0a0a0a");
    }
    if (m.type === "bat") outlineRect(px - s * 0.55, py - s * 0.1 + bob, s * 1.1, s * 0.35, "#4a2860");
    if (m.type === "skeleton") pxRect(px - s * 0.15, py - s * 0.05 + bob, s * 0.3, 2, "#ffffff");
    if (m.type === "slime") pxRect(px - s * 0.25, py - s * 0.15 + bob, 3, 2, "rgba(255,255,255,0.35)");
    if (m.type === "guardian") {
      outlineRect(px - s * 0.55, py - s * 0.55 + bob, s * 1.1, s * 1.1, "#f0c050");
      pxRect(px - s * 0.2, py - s * 0.2 + bob, s * 0.4, s * 0.4, "#ffffff");
    }
    ctx.globalAlpha = 1;
    const hpPct = m.hp / m.maxHp;
    pxRect(px - s / 2 - 1, py - s / 2 - 6 + bob, s + 2, 4, "#0a0a0a");
    pxRect(px - s / 2, py - s / 2 - 5 + bob, s * hpPct, 2, hpPct > 0.4 ? "#40e060" : "#ff4040");
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
    if (state.dungeon?.active) ctx.fillStyle = "#100e18";
    else if (isNight()) ctx.fillStyle = "#040810";
    else if (state.dayTime >= 0.55 && state.dayTime < 0.62) ctx.fillStyle = "#241828";
    else if (state.dayTime >= 0.92 || state.dayTime < 0.18) ctx.fillStyle = "#2a2218";
    else ctx.fillStyle = "#1a3020";
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
        drawBuildingRoof(b, camX, camY, tileSize, w, h);
      }
    }

    if (state.dungeon?.active) {
      for (const m of state.dungeon.monsters) {
        const px = Math.floor((m.x - camX) * tileSize + w / 2);
        const py = Math.floor((m.y - camY) * tileSize + h / 2);
        drawMonster(m, px, py, tileSize);
      }
    } else {
      for (const m of state.nightMobs) {
        const px = Math.floor((m.x - camX) * tileSize + w / 2);
        const py = Math.floor((m.y - camY) * tileSize + h / 2);
        drawMonster(m, px, py, tileSize);
      }
    }

    // Mining crack overlay
    if (state.mineTarget) {
      const mx = state.mineTarget.wx, my = state.mineTarget.wy;
      const mpx = Math.floor((mx - camX) * tileSize + w / 2);
      const mpy = Math.floor((my - camY) * tileSize + h / 2);
      const pct = Math.min(1, state.mineTarget.progress / state.mineTarget.need);
      pxRect(mpx + tileSize * 0.2, mpy + tileSize * 0.3, 2, tileSize * 0.4 * pct, "#1a1010");
      pxRect(mpx + tileSize * 0.5, mpy + tileSize * 0.25, 2, tileSize * 0.45 * pct, "#1a1010");
      pxRect(mpx + tileSize * 0.35, mpy + tileSize * 0.2, tileSize * 0.3 * pct, 2, "#1a1010");
      // progress bar
      pxRect(mpx + 2, mpy - 4, tileSize - 4, 3, "#0a0a0a");
      pxRect(mpx + 2, mpy - 4, (tileSize - 4) * pct, 3, "#ffe060");
    }

    // Melee attack arc visual (matches short hit cone) — bright “shing” flash
    if (state.attackAnim > 0 && state.attackArc > 0) {
      const rad = state.attackArc * tileSize;
      const half = MELEE_ARC / 2;
      const flash = Math.min(1, state.attackAnim / 0.32);
      const alpha = 0.2 + flash * 0.45;
      ctx.strokeStyle = `rgba(255,245,180,${alpha})`;
      ctx.lineWidth = 2 + flash * 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, rad, state.player.facing - half, state.player.facing + half);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,230,120,${alpha * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, rad, state.player.facing - half, state.player.facing + half);
      ctx.closePath();
      ctx.fill();
      // trailing gleam lines
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, rad * 0.85, state.player.facing - half * 0.7, state.player.facing + half * 0.2);
      ctx.stroke();
    }

    // Floating +HP / damage text
    for (const ft of state.floatTexts) {
      const fx = Math.floor((ft.x - camX) * tileSize + w / 2);
      const fy = Math.floor((ft.y - camY) * tileSize + h / 2);
      ctx.globalAlpha = Math.min(1, ft.life / (ft.max * 0.5));
      ctx.font = `bold ${Math.max(12, Math.floor(tileSize * 0.55))}px VT323, monospace`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.strokeText(ft.text, fx, fy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, fx, fy);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    // Projectiles (arrows)
    for (const p of state.projectiles) {
      const ax = Math.floor((p.x - camX) * tileSize + w / 2);
      const ay = Math.floor((p.y - camY) * tileSize + h / 2);
      const ang = Math.atan2(p.vy, p.vx);
      outlineRect(ax - 1, ay - 1, 6, 2, "#e8d0a0");
      pxRect(ax + Math.cos(ang) * 4, ay + Math.sin(ang) * 2, 3, 2, "#c0c8d0");
    }

    const ppx = Math.floor(w / 2), ppy = Math.floor(h / 2);
    const ps = Math.max(8, tileSize * 0.55);
    drawPlayer(ppx, ppy, ps);

    state.particles = state.particles.filter((p) => {
      const kind = p.kind || "spark";
      if (kind === "bubble") {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy -= 0.015; // rise
        p.vx += Math.sin(state.animT * 8 + p.x * 10) * 0.01;
      } else if (kind === "dust") {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 0.02;
      } else if (kind === "splash" || kind === "drown") {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 0.06;
      } else if (kind === "heal") {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy -= 0.02; // float up
      } else {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 0.04;
      }
      p.life -= 0.016;
      if (p.life <= 0) return false;
      const x = Math.floor((p.x - camX) * tileSize + w / 2);
      const y = Math.floor((p.y - camY) * tileSize + h / 2);
      const sz = p.size || 3;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      if (kind === "bubble") {
        // hollow bubble look
        pxRect(x, y, sz, sz, p.color);
        pxRect(x + 1, y + 1, Math.max(1, sz - 2), Math.max(1, sz - 2), "rgba(20,60,90,0.35)");
        pxDot(x, y, "#ffffff");
      } else if (kind === "heal") {
        // tiny heart / cross sparkle
        pxRect(x, y + 1, sz + 1, sz - 1, p.color);
        pxRect(x + 1, y, sz - 1, sz + 1, p.color);
        pxDot(x + 1, y + 1, "#ffffff");
      } else {
        pxRect(x, y, sz, sz, p.color);
      }
      ctx.globalAlpha = 1;
      return true;
    });

    // Day/night sky wash + vignette
    if (!state.dungeon?.active) {
      const t = state.dayTime;
      let wash = "rgba(0,0,0,0)";
      if (t >= 0.55 && t < 0.62) { // dusk
        const k = (t - 0.55) / 0.07;
        wash = `rgba(55, 18, 70, ${0.22 + k * 0.32})`;
      } else if (isNight()) {
        const mid = 1 - Math.abs((t - 0.77) / 0.15);
        wash = `rgba(4, 8, 22, ${0.58 + Math.max(0, mid) * 0.22})`;
      } else if (t >= 0.92 || t < 0.18) { // dawn
        const k = t >= 0.92 ? (t - 0.92) / 0.08 : t / 0.18;
        wash = `rgba(70, 40, 28, ${0.28 - k * 0.16})`;
      } else {
        wash = "rgba(180, 255, 160, 0.03)";
      }
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
      if (isNight()) {
        drawNightSkyDecor(w, h);
        // Lantern pool around the player — edges stay deep night
        const light = ctx.createRadialGradient(w / 2, h / 2, tileSize * 0.5, w / 2, h / 2, tileSize * 5.2);
        light.addColorStop(0, "rgba(255, 210, 120, 0.07)");
        light.addColorStop(0.35, "rgba(0,0,0,0.08)");
        light.addColorStop(0.7, "rgba(0,0,12,0.45)");
        light.addColorStop(1, "rgba(0,0,10,0.78)");
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, w, h);
      } else if (t >= 0.55 && t < 0.62) {
        // Fading sun disc at dusk
        drawDuskSun(w, h, (t - 0.55) / 0.07);
      }
      if (state.swimming) {
        ctx.fillStyle = "rgba(40, 120, 220, 0.14)";
        ctx.fillRect(0, 0, w, h);
      }
    }
    const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, state.dungeon?.active ? "rgba(10,0,24,0.55)" : (isNight() ? "rgba(0,0,18,0.55)" : "rgba(0,20,10,0.28)"));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    drawMinimap();
  }

  function drawNightSkyDecor(w, h) {
    const now = performance.now();
    // Twinkling stars across the upper/outer field
    for (let i = 0; i < 56; i++) {
      const sx = ((i * 97 + 23) * 13) % w;
      const sy = ((i * 53 + 11) * 17) % h;
      // Prefer edges / top so they read as sky, not clutter on the player
      const edge = Math.min(sx, sy, w - sx, h - sy) / Math.min(w, h);
      if (edge > 0.28 && sy > h * 0.42) continue;
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(now / 380 + i * 1.7));
      ctx.globalAlpha = twinkle * 0.9;
      ctx.fillStyle = i % 6 === 0 ? "#ffe8a8" : "#d8e4ff";
      const sz = i % 9 === 0 ? 2 : 1;
      ctx.fillRect(sx, sy, sz, sz);
    }
    ctx.globalAlpha = 1;
    // Pixel crescent moon — top right of the playfield
    drawPixelMoon(w - 34, 26);
  }

  function drawPixelMoon(mx, my) {
    const r = 9;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const ox = x - 4, oy = y + 1;
        if (ox * ox + oy * oy <= (r - 1) * (r - 1)) continue;
        ctx.fillStyle = ((x + y + 20) % 4 === 0) ? "#c8c090" : "#efe6c0";
        ctx.fillRect(mx + x, my + y, 1, 1);
      }
    }
    // Soft glow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#c8d8ff";
    ctx.fillRect(mx - r - 2, my - r - 2, (r + 2) * 2, (r + 2) * 2);
    ctx.globalAlpha = 1;
  }

  function drawDuskSun(w, h, k) {
    const sx = Math.floor(w * 0.78);
    const sy = Math.floor(h * 0.18 + k * h * 0.12);
    const r = 10;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        ctx.globalAlpha = 0.55 - k * 0.25;
        ctx.fillStyle = (x * x + y * y < 16) ? "#ffd080" : "#e07040";
        ctx.fillRect(sx + x, sy + y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMinimap() {
    if (!state.settings.minimap) { $("minimap").classList.add("hidden"); return; }
    $("minimap").classList.remove("hidden");
    const s = 120;
    miniCtx.fillStyle = isNight() && !state.dungeon?.active ? "#060a14" : "#12100e";
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
        if (tile === TILES.WATER) c = "#145878";
        else if (tile === TILES.LAVA) c = "#e06030";
        else if (tile === TILES.STONE || tile === TILES.WALL) c = "#5a5650";
        else if (tile === TILES.SAND) c = "#b8a880";
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

  function mapTileColor(tile) {
    if (tile === TILES.WATER) return [20, 88, 120];
    if (tile === TILES.LAVA) return [224, 96, 48];
    if (tile === TILES.STONE || tile === TILES.WALL) return [90, 86, 80];
    if (tile === TILES.SAND) return [184, 168, 128];
    if (tile === TILES.PATH || tile === TILES.FLOOR || tile === TILES.COBBLE) return [138, 116, 88];
    if (tile === TILES.QUEST) return [240, 201, 106];
    if (tile === TILES.BOSS) return [224, 106, 85];
    if (tile === TILES.VILLAGE || tile === TILES.DOOR || tile === TILES.BANNER || tile === TILES.FENCE) return [212, 160, 96];
    if (tile === TILES.DUNGEON || tile === TILES.TORCH) return [138, 32, 48];
    if (tile === TILES.CHEST) return [192, 144, 48];
    if (tile === TILES.STAIRS || tile === TILES.EXIT) return [64, 160, 255];
    if (tile === TILES.TREE) return [42, 64, 40];
    if (tile === TILES.DIRT || tile === TILES.RUIN) return [90, 70, 48];
    if (tile === TILES.MOSS) return [48, 90, 52];
    if (tile === TILES.ROOF) return [120, 48, 36];
    return [61, 92, 50];
  }

  function modalEl(id) {
    return document.getElementById(id);
  }

  function modalIsOpen(id) {
    const el = modalEl(id);
    return !!(el && !el.classList.contains("hidden"));
  }

  function isMapOpen() {
    return modalIsOpen("map-modal");
  }

  function isMapKey(e) {
    return e.code === "KeyM" || e.key === "m" || e.key === "M";
  }

  function openFullMap() {
    if (!state.running) {
      showToast("Start a run first, then press M for the map.", true);
      return;
    }
    const mapModal = modalEl("map-modal");
    if (!mapModal) {
      showToast("Map UI missing — hard-refresh the page.", true);
      return;
    }
    try {
      // Close other overlays first
      if (modalIsOpen("inventory-modal")) {
        if (state.heldItem) { addItem(state.heldItem); state.heldItem = null; updateHotbarUI(); }
        closeModal("inventory-modal");
      }
      if (modalIsOpen("settings-modal")) closeModal("settings-modal");

      mapView.panX = 0;
      mapView.panY = 0;
      mapModal.classList.remove("hidden");
      state.paused = true;
      const title = modalEl("map-title");
      if (title) title.textContent = state.dungeon?.active ? `${state.dungeon.name} Map` : "World Map";
      showToast("Map · M to close");
      // Defer draw so the modal paints immediately
      requestAnimationFrame(() => {
        try { drawFullMap(); }
        catch (err) {
          console.error("drawFullMap", err);
          showToast("Map failed to draw — try again.", true);
        }
      });
    } catch (err) {
      console.error("openFullMap", err);
      showToast("Could not open map.", true);
    }
  }

  function closeFullMap() {
    const mapModal = modalEl("map-modal");
    if (mapModal) mapModal.classList.add("hidden");
    if (!modalIsOpen("settings-modal")
      && !modalIsOpen("inventory-modal")
      && !modalIsOpen("quest-modal")
      && !modalIsOpen("boss-modal")
      && !modalIsOpen("result-modal")
      && !modalIsOpen("dungeon-modal")) {
      state.paused = false;
    }
  }

  function toggleFullMap() {
    if (isMapOpen()) closeFullMap();
    else openFullMap();
  }

  function setMapZoom(level) {
    if (!mapView.ranges[level]) return;
    mapView.zoom = level;
    document.querySelectorAll(".map-zoom-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-map-zoom") === level);
    });
    drawFullMap();
  }

  function drawFullMap() {
    if (!fullMapCanvas || !fullMapCtx || !isMapOpen()) return;
    const s = fullMapCanvas.width;
    const img = fullMapCtx.createImageData(s, s);
    const data = img.data;
    const inDungeon = !!(state.dungeon && state.dungeon.active);
    const px = state.player.x;
    const py = state.player.y;
    let range, originX, originY, worldW, worldH;

    if (inDungeon) {
      worldW = state.dungeon.w;
      worldH = state.dungeon.h;
      // Fit whole dungeon floor
      range = Math.max(worldW, worldH) / 2;
      originX = worldW / 2 + mapView.panX;
      originY = worldH / 2 + mapView.panY;
    } else {
      range = mapView.ranges[mapView.zoom] || 96;
      originX = px + mapView.panX;
      originY = py + mapView.panY;
      worldW = range * 2;
      worldH = range * 2;
    }

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const wx = Math.floor(originX + ((x / s) * range * 2) - range);
        const wy = Math.floor(originY + ((y / s) * range * 2) - range);
        let tile;
        if (inDungeon) {
          if (wx < 0 || wy < 0 || wx >= worldW || wy >= worldH) {
            data[(y * s + x) * 4] = 12;
            data[(y * s + x) * 4 + 1] = 10;
            data[(y * s + x) * 4 + 2] = 8;
            data[(y * s + x) * 4 + 3] = 255;
            continue;
          }
          tile = getTile(wx, wy);
        } else {
          // Fog for never-loaded chunks so opening the map doesn't generate the whole world
          const { cx, cy } = worldToChunk(wx, wy);
          if (!state.chunks.has(chunkKey(cx, cy))) {
            const biome = biomeAt(wx, wy);
            let c = [28, 36, 24];
            if (biome === "desert") c = [50, 44, 30];
            else if (biome === "swamp") c = [22, 32, 28];
            else if (biome === "mountain") c = [40, 40, 42];
            else if (biome === "forest") c = [20, 34, 22];
            // Cheap water hint (skip heavy baseTile per pixel)
            if ((x + y) % 3 === 0) {
              const bt = baseTile(wx, wy);
              if (bt === TILES.WATER) c = [14, 40, 58];
            }
            const i = (y * s + x) * 4;
            data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
            continue;
          }
          tile = getOverworldTile(wx, wy);
        }
        const c = mapTileColor(tile);
        const i = (y * s + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = 255;
      }
    }
    fullMapCtx.putImageData(img, 0, 0);

    function worldToMap(wx, wy) {
      const mx = ((wx - (originX - range)) / (range * 2)) * s;
      const my = ((wy - (originY - range)) / (range * 2)) * s;
      return [mx, my];
    }

    // Structure markers (villages / dungeons / quests)
    if (!inDungeon) {
      for (const sObj of state.structures.values()) {
        const [mx, my] = worldToMap(sObj.wx + 0.5, sObj.wy + 0.5);
        if (mx < -4 || my < -4 || mx > s + 4 || my > s + 4) continue;
        let col = "#f0c96a";
        let size = 4;
        if (sObj.village || sObj.type === "village") {
          col = "#d4a060";
          size = 6;
        } else if (sObj.type === "quest") {
          col = "#f0c96a";
          size = 4;
        } else if (sObj.type === "dungeon" || sObj.type === "dungeon_entrance" || sObj.type === "boss") {
          col = "#e04050";
          size = 6;
        }
        fullMapCtx.fillStyle = "#000";
        fullMapCtx.fillRect(mx - size / 2 - 1, my - size / 2 - 1, size + 2, size + 2);
        fullMapCtx.fillStyle = col;
        fullMapCtx.fillRect(mx - size / 2, my - size / 2, size, size);
      }
    } else {
      for (const m of state.dungeon.monsters) {
        const [mx, my] = worldToMap(m.x, m.y);
        fullMapCtx.fillStyle = "#ff4040";
        fullMapCtx.fillRect(mx - 2, my - 2, 4, 4);
      }
    }

    // Player
    const [plx, ply] = worldToMap(px, py);
    fullMapCtx.fillStyle = "#000";
    fullMapCtx.fillRect(plx - 4, ply - 4, 8, 8);
    fullMapCtx.fillStyle = "#ffffff";
    fullMapCtx.fillRect(plx - 3, ply - 3, 6, 6);
    fullMapCtx.fillStyle = "#40c050";
    fullMapCtx.fillRect(plx - 2, ply - 2, 4, 4);
    // Facing notch
    const ang = state.player.facing || 0;
    fullMapCtx.fillStyle = "#ffe060";
    fullMapCtx.fillRect(plx + Math.cos(ang) * 5 - 1, ply + Math.sin(ang) * 5 - 1, 3, 3);

    if ($("map-coords")) {
      $("map-coords").textContent = inDungeon
        ? `Floor ${state.dungeon.floor}/10 · ${Math.floor(px)}, ${Math.floor(py)}`
        : `${Math.floor(px)}, ${Math.floor(py)} · ${BIOME_NAMES[biomeAt(Math.floor(px), Math.floor(py))] || ""}`;
    }
  }

  let last = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    state.animT += dt;
    if (state.running && !state.paused) {
      updatePlayer(dt);
      tickSessionTimer(dt);
      updateHUD();
    } else if (state.running) {
      // Still tick UI clock display while paused overlays are up
      updateSessionTimerUI();
    }
    if (state.running) draw();
    if (state.running && isMapOpen() && (Math.floor(state.animT * 4) !== Math.floor((state.animT - dt) * 4))) {
      drawFullMap();
    }
    requestAnimationFrame(frame);
  }

  function startGame(cfg) {
    state.seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    state.subject = cfg.subject;
    state.grade = cfg.grade;
    state.bookId = cfg.bookId;
    state.bookTitle = cfg.bookTitle;
    state.bookTopics = cfg.bookTopics || "";
    state.difficulty = cfg.difficulty;
    state.playerName = cfg.name || "Scholar";
    state.dayTime = 0.22;
    state.dayLength = 220;
    state.nightMobs = [];
    state.nightSpawnCd = 0;
    state.wasNight = false;
    state.level = 1;
    state.kp = 0;
    state.questsDone = 0;
    state.bossesDefeated = 0;
    state.hp = 100;
    state.maxHp = 100;
    state.breath = 100;
    state.maxBreath = 100;
    state.swimming = false;
    state.footstepCd = 0;
    state.bubbleCd = 0;
    state.drownCd = 0;
    state.maxHp = 100;
    state.inventory = [];
    state.slots = Array(36).fill(null);
    state.heldItem = null;
    state.hotbarSel = 0;
    state.equipped = { weapon: null, armor: null, tool: null, book: null, bow: null };
    state.chunks.clear();
    state.structures.clear();
    state.buildings.clear();
    state.chests.clear();
    state.usedQuestions.clear();
    state.particles = [];
    state.floatTexts = [];
    state.drinkSfxCd = 0;
    state.dungeon = null;
    state.spawn = { x: 8.5, y: 8.5 };
    state.checkpoint = { ...state.spawn };
    state.overworldReturn = { ...state.spawn };
    state.player = { x: 8.5, y: 8.5, facing: 0 };
    state.paused = false;
    state.running = true;
    const mins = Math.max(1, Math.min(180, Math.round(Number(cfg.timerMinutes) || 25)));
    state.session = {
      totalSec: mins * 60,
      remaining: mins * 60,
      done: false,
      canLeave: false,
      notified: false,
      keepPlaying: false,
    };
    state.bossFight = null;
    state.hitCd = 0;
    state.hurtCd = 0;

    state.tempPwr = 0;
    state.tempPwrT = 0;
    state.selectedItem = null;
    state.projectiles = [];
    state.attackAnim = 0;
    state.attackArc = 0;
    state.mineTarget = null;
    state.mineAnim = 0;
    state.swimAnim = 0;
    state.drinkAnim = 0;
    state.drinkUid = null;
    state.drinkItem = null;
    state.drinkHealAmt = 0;
    state.lowHpWarned = false;
    state.blocking = false;
    state.blockFlash = 0;
    // Starter kit: sword + bow + pickaxe on hotbar, shield equipped, heals
    const blade = LOOT_TABLE.find((p) => p.key === "wood_blade");
    if (blade) addItem({ ...blade, uid: uid() });
    const bowLoot = LOOT_TABLE.find((p) => p.key === "short_bow");
    if (bowLoot) addItem({ ...bowLoot, uid: uid() });
    const pickLoot = LOOT_TABLE.find((p) => p.key === "wood_pick");
    if (pickLoot) addItem({ ...pickLoot, uid: uid() });
    const heal = POTION_TABLE.find((p) => p.key === "heal_small");
    if (heal) {
      addItem({ ...heal, uid: uid(), slot: null });
      addItem({ ...heal, uid: uid(), slot: null });
    }
    const buckler = LOOT_TABLE.find((p) => p.key === "wood_shield");
    if (buckler) {
      const shieldItem = { ...buckler, uid: uid() };
      // Auto-equip starter shield so F / 🛡 BLOCK works right away
      state.equipped.armor = shieldItem;
    }
    state.hotbarSel = 0;
    updateBlockUI();

    ensureChunk(0, 0);
    $("start-screen").classList.remove("active");
    $("game-screen").classList.add("active");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (canvas && canvas.focus) try { canvas.focus({ preventScroll: true }); } catch (_) { canvas.focus(); }
    updateInventoryUI();
    updateHotbarUI();
    updateDungeonUI();
    recalcHp();
    updateHUD();
    applyMobileVisibility();

    requestAnimationFrame(() => {
      resizeCanvas();
      draw();
      showToast("Starter gear: 1=Sword · 2=Bow · 3=Pickaxe · Shield equipped — HOLD F or top-right 🛡 BLOCK");
      updateSessionTimerUI();
      updateBlockUI();
    });
  }

  function quitToMenu() {
    if (state.running && state.session && !state.session.canLeave) {
      showToast(`Timer still running — ${formatClock(state.session.remaining)} left.`, true);
      updateLeaveControls();
      return;
    }
    state.running = false;
    state.paused = false;
    state.dungeon = null;
    state.nightMobs = [];
    SFX.stopAmbience(true);
    ["settings-modal", "inventory-modal", "map-modal", "quest-modal", "boss-modal", "result-modal", "dungeon-modal", "session-modal"].forEach(closeModal);
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
  $("grade-select").addEventListener("change", () => {
    refreshBookSelect();
    if ($("timer-auto") && $("timer-auto").checked) suggestSessionMinutes(true);
  });
  document.querySelectorAll('input[name="difficulty"]').forEach((el) => {
    el.addEventListener("change", () => {
      if ($("timer-auto") && $("timer-auto").checked) suggestSessionMinutes(true);
    });
  });
  if ($("timer-auto")) {
    $("timer-auto").addEventListener("change", () => {
      if ($("timer-auto").checked) suggestSessionMinutes(true);
      else if ($("timer-hint")) $("timer-hint").textContent = "Manual timer — type minutes or tap a preset.";
    });
  }
  document.querySelectorAll(".timer-preset").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if ($("timer-auto")) $("timer-auto").checked = false;
      setTimerMinutes(btn.getAttribute("data-mins"), { fromAuto: false });
    });
  });
  if ($("timer-minutes")) {
    $("timer-minutes").addEventListener("input", () => {
      if ($("timer-auto")) $("timer-auto").checked = false;
      setTimerMinutes($("timer-minutes").value, { fromAuto: false });
    });
  }
  if ($("custom-book")) {
    $("custom-book").addEventListener("input", () => {
      const typed = $("custom-book").value.trim();
      const subject = $("subject-select").value;
      const grade = parseInt($("grade-select").value, 10);
      const match = booksFor(subject, grade).find((b) => b.title === typed);
      $("book-select").value = match ? match.id : "";
      $("book-list").querySelectorAll(".book-option").forEach((btn) => {
        const on = match && btn.getAttribute("data-book-id") === match.id;
        btn.classList.toggle("selected", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
      if ($("book-hint")) {
        const tops = ($("book-topics") && $("book-topics").value.trim()) || "";
        $("book-hint").textContent = typed
          ? `Book: ${typed}${tops ? ` · Studying: ${tops}` : ""}. Quests use this.`
          : "Type your book and what you’re studying — quests use this.";
      }
    });
  }
  if ($("book-topics")) {
    $("book-topics").addEventListener("input", () => {
      const typed = ($("custom-book") && $("custom-book").value.trim()) || "";
      const tops = $("book-topics").value.trim();
      if ($("book-hint")) {
        $("book-hint").textContent = typed || tops
          ? `Book: ${typed || "…"}${tops ? ` · Studying: ${tops}` : ""}. Quests use this.`
          : "Type your book and what you’re studying — quests use this.";
      }
    });
  }
  refreshBookSelect();
  suggestSessionMinutes(true);

  $("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("player-name").value.trim();
    if (!name) {
      alert("Please type your name.");
      $("player-name").focus();
      return;
    }
    const subject = $("subject-select").value;
    const grade = parseInt($("grade-select").value, 10);
    const bookTitle = ($("custom-book") && $("custom-book").value.trim()) || "";
    if (!bookTitle) {
      alert("Please type the book / textbook you are using.");
      if ($("custom-book")) $("custom-book").focus();
      return;
    }
    const bookTopics = ($("book-topics") && $("book-topics").value.trim()) || "";
    if (!bookTopics) {
      alert("Please describe what you are studying in your book (topics).");
      if ($("book-topics")) $("book-topics").focus();
      return;
    }
    const book = selectedBook();
    const difficulty = (document.querySelector('input[name="difficulty"]:checked') || {}).value || "easy";
    const timerMinutes = Math.max(1, Math.min(180, parseInt(($("timer-minutes") || {}).value || "25", 10) || 25));
    startGame({
      name,
      subject,
      grade,
      bookId: book ? book.id : "custom",
      bookTitle,
      bookTopics,
      difficulty,
      timerMinutes,
    });
  });

  if ($("btn-session-leave")) {
    $("btn-session-leave").addEventListener("click", () => {
      closeModal("session-modal");
      state.session.canLeave = true;
      quitToMenu();
    });
  }
  if ($("btn-session-keep")) {
    $("btn-session-keep").addEventListener("click", () => {
      closeModal("session-modal");
      state.session.keepPlaying = true;
      state.session.canLeave = true;
      state.paused = false;
      updateLeaveControls();
      showToast("Keep exploring — Leave is unlocked in Settings (Esc).");
    });
  }

  function handleGameKeyDown(e) {
    // Always track movement keys (code + key for layout safety)
    if (e.code === "ArrowUp" || e.key === "ArrowUp" || e.code === "KeyW" || e.key === "w" || e.key === "W") state.keys.ArrowUp = state.keys.w = state.keys.W = true;
    if (e.code === "ArrowDown" || e.key === "ArrowDown" || e.code === "KeyS" || e.key === "s" || e.key === "S") state.keys.ArrowDown = state.keys.s = state.keys.S = true;
    if (e.code === "ArrowLeft" || e.key === "ArrowLeft" || e.code === "KeyA" || e.key === "a" || e.key === "A") state.keys.ArrowLeft = state.keys.a = state.keys.A = true;
    if (e.code === "ArrowRight" || e.key === "ArrowRight" || e.code === "KeyD" || e.key === "d" || e.key === "D") state.keys.ArrowRight = state.keys.d = state.keys.D = true;
    state.keys[e.key] = true;

    // Don't steal typing from visible form fields on the start screen
    const tag = (e.target && e.target.tagName) || "";
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable);
    if (typing && !state.running) return;

    // M = full map (highest priority among gameplay keys)
    if (isMapKey(e)) {
      if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal")) return;
      e.preventDefault();
      e.stopPropagation();
      window.__ruinMapHandled = true;
      toggleFullMap();
      setTimeout(function () { window.__ruinMapHandled = false; }, 0);
      return;
    }

    if (e.code === "KeyE" || e.key === "e" || e.key === "E") {
      if (!state.running || state.paused) return;
      e.preventDefault();
      tryInteract();
      return;
    }
    if (e.code === "KeyH" || e.key === "h" || e.key === "H") {
      if (!state.running) return;
      if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal")) return;
      e.preventDefault();
      drinkHandPotion();
      return;
    }
    if (e.code === "KeyF" || e.key === "f" || e.key === "F"
      || e.code === "ShiftLeft" || e.code === "ShiftRight"
      || e.code === "KeyQ" || e.key === "q" || e.key === "Q") {
      if (!state.running || state.paused) return;
      if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal")) return;
      e.preventDefault();
      setBlocking(true);
      return;
    }
    if (e.code === "Space") {
      if (!state.running || state.paused) return;
      if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal") || modalIsOpen("inventory-modal") || modalIsOpen("settings-modal") || isMapOpen()) return;
      e.preventDefault();
      attackFacing();
      return;
    }
    if (/^[1-9]$/.test(e.key) && state.running && !state.paused) {
      state.hotbarSel = parseInt(e.key, 10) - 1;
      updateHotbarUI();
      const it = state.slots[state.hotbarSel];
      if (it) showToast(`Hand: ${it.name}`);
      return;
    }
    if (e.code === "KeyI" || e.key === "i" || e.key === "I") {
      if (!state.running) return;
      e.preventDefault();
      if (modalIsOpen("inventory-modal")) {
        if (state.heldItem) { addItem(state.heldItem); state.heldItem = null; }
        closeModal("inventory-modal");
        state.paused = false;
        updateHotbarUI();
      } else {
        if (isMapOpen()) closeFullMap();
        updateInventoryUI();
        openModal("inventory-modal");
        state.paused = true;
      }
      return;
    }
    if (e.key === "Escape") {
      if (modalIsOpen("dungeon-modal")) { cancelPortal(); return; }
      if (modalIsOpen("quest-modal") || modalIsOpen("boss-modal") || modalIsOpen("result-modal")) return;
      if (!state.running) return;
      if (isMapOpen()) { closeFullMap(); return; }
      if (modalIsOpen("inventory-modal")) {
        if (state.heldItem) { addItem(state.heldItem); state.heldItem = null; updateHotbarUI(); }
        closeModal("inventory-modal");
        state.paused = false;
        return;
      }
      if (modalIsOpen("settings-modal")) {
        closeModal("settings-modal");
        state.paused = false;
      } else if (modalIsOpen("session-modal")) {
        closeModal("session-modal");
        state.session.keepPlaying = true;
        state.session.canLeave = true;
        state.paused = false;
        updateLeaveControls();
      } else {
        updateLeaveControls();
        openModal("settings-modal");
        state.paused = true;
      }
    }
  }

  function handleGameKeyUp(e) {
    if (e.code === "ArrowUp" || e.key === "ArrowUp" || e.code === "KeyW" || e.key === "w" || e.key === "W") state.keys.ArrowUp = state.keys.w = state.keys.W = false;
    if (e.code === "ArrowDown" || e.key === "ArrowDown" || e.code === "KeyS" || e.key === "s" || e.key === "S") state.keys.ArrowDown = state.keys.s = state.keys.S = false;
    if (e.code === "ArrowLeft" || e.key === "ArrowLeft" || e.code === "KeyA" || e.key === "a" || e.key === "A") state.keys.ArrowLeft = state.keys.a = state.keys.A = false;
    if (e.code === "ArrowRight" || e.key === "ArrowRight" || e.code === "KeyD" || e.key === "d" || e.key === "D") state.keys.ArrowRight = state.keys.d = state.keys.D = false;
    if (e.code === "KeyF" || e.key === "f" || e.key === "F"
      || e.code === "ShiftLeft" || e.code === "ShiftRight"
      || e.code === "KeyQ" || e.key === "q" || e.key === "Q") {
      setBlocking(false);
    }
    state.keys[e.key] = false;
  }

  // Capture phase so M works even if focus is on canvas / buttons
  window.addEventListener("keydown", handleGameKeyDown, true);
  window.addEventListener("keyup", handleGameKeyUp, true);

  $("btn-settings").addEventListener("click", () => { updateLeaveControls(); openModal("settings-modal"); state.paused = true; });
  $("btn-inventory").addEventListener("click", () => { updateInventoryUI(); openModal("inventory-modal"); state.paused = true; });
  function onMapButton(ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    if (window.__ruinMapBtnLock) return;
    window.__ruinMapBtnLock = true;
    toggleFullMap();
    setTimeout(function () { window.__ruinMapBtnLock = false; }, 50);
  }
  if ($("btn-map")) $("btn-map").addEventListener("click", onMapButton);
  if ($("btn-map-fab")) $("btn-map-fab").addEventListener("click", onMapButton);
  $("btn-resume").addEventListener("click", () => { closeModal("settings-modal"); state.paused = false; });
  $("btn-quit").addEventListener("click", quitToMenu);

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close");
      if (id === "inventory-modal" && state.heldItem) {
        addItem(state.heldItem);
        state.heldItem = null;
        updateHotbarUI();
      }
      if (id === "map-modal") { closeFullMap(); return; }
      closeModal(id);
      if (id === "settings-modal" || id === "inventory-modal") state.paused = false;
    });
  });

  document.querySelectorAll(".map-zoom-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMapZoom(btn.getAttribute("data-map-zoom")));
  });

  // Minimap click / keyboard → full map (M also works)
  const mini = $("minimap");
  if (mini) {
    mini.addEventListener("click", (ev) => { onMapButton(ev); });
    mini.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onMapButton(e); }
    });
  }

  // Pan / zoom on full map canvas
  if (fullMapCanvas) {
    const wrap = fullMapCanvas.parentElement;
    fullMapCanvas.addEventListener("pointerdown", (e) => {
      mapView.dragging = true;
      mapView.lastX = e.clientX;
      mapView.lastY = e.clientY;
      if (wrap) wrap.classList.add("dragging");
      fullMapCanvas.setPointerCapture?.(e.pointerId);
    });
    fullMapCanvas.addEventListener("pointermove", (e) => {
      if (!mapView.dragging || !isMapOpen()) return;
      const range = state.dungeon?.active
        ? Math.max(state.dungeon.w, state.dungeon.h) / 2
        : (mapView.ranges[mapView.zoom] || 96);
      const scale = (range * 2) / fullMapCanvas.width;
      const dx = (e.clientX - mapView.lastX);
      const dy = (e.clientY - mapView.lastY);
      mapView.lastX = e.clientX;
      mapView.lastY = e.clientY;
      // Drag map under cursor (natural: drag right → look left)
      const rect = fullMapCanvas.getBoundingClientRect();
      const pxScale = (range * 2) / rect.width;
      mapView.panX -= dx * pxScale;
      mapView.panY -= dy * pxScale;
      drawFullMap();
    });
    const endDrag = () => {
      mapView.dragging = false;
      if (wrap) wrap.classList.remove("dragging");
    };
    fullMapCanvas.addEventListener("pointerup", endDrag);
    fullMapCanvas.addEventListener("pointercancel", endDrag);
    fullMapCanvas.addEventListener("wheel", (e) => {
      if (!isMapOpen()) return;
      e.preventDefault();
      const order = ["near", "mid", "far"];
      let i = order.indexOf(mapView.zoom);
      if (e.deltaY > 0) i = Math.min(order.length - 1, i + 1);
      else i = Math.max(0, i - 1);
      setMapZoom(order[i]);
    }, { passive: false });
  }

  document.querySelectorAll(".mc-equip[data-equip]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      clickEquipSlot(btn.getAttribute("data-equip"));
    });
  });

  // Follow cursor with held item
  window.addEventListener("mousemove", (e) => {
    const cur = $("held-cursor");
    if (!cur || cur.classList.contains("hidden")) return;
    cur.style.left = `${e.clientX + 8}px`;
    cur.style.top = `${e.clientY + 8}px`;
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
  if ($("setting-sound")) {
    $("setting-sound").addEventListener("change", (e) => {
      SFX.unlock();
      SFX.setEnabled(e.target.checked);
      if (e.target.checked) SFX.ui();
    });
  }
  if ($("setting-music")) {
    $("setting-music").addEventListener("change", (e) => {
      SFX.unlock();
      SFX.setMusicEnabled(e.target.checked);
      if (e.target.checked && state.running) {
        const biome = state.dungeon?.active
          ? "dungeon"
          : biomeAt(Math.floor(state.player.x), Math.floor(state.player.y));
        SFX.syncAmbience({
          running: true,
          dungeon: !!state.dungeon?.active,
          biome,
          moving: false,
        });
        SFX.ui();
      }
    });
  }
  if ($("setting-sfx-volume")) {
    bindRange("setting-sfx-volume", "sfxVolume", "sfx-volume-value", (v) => {
      SFX.setVolume(v);
      return Number(v).toFixed(2);
    });
    $("setting-sfx-volume").addEventListener("change", () => { SFX.unlock(); SFX.ui(); });
  }
  if ($("setting-mobile")) {
    $("setting-mobile").addEventListener("change", (e) => { state.settings.forceMobile = e.target.checked; applyMobileVisibility(); });
  }

  // Browsers require a gesture before AudioContext can play
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);

  // Optional QA hooks: open index.html?debug=1
  if (typeof location !== "undefined" && /(?:\?|&)debug=1(?:&|$)/.test(location.search || "")) {
    window.__RUIN__ = {
      get state() { return state; },
      SFX,
      setDayTime(t) {
        state.dayTime = ((Number(t) % 1) + 1) % 1;
        state.wasNight = isNight();
        updateDayNightUI();
      },
      hurt(n) { playerHurt(n || 20); },
      swing() { return performMeleeSwing(); },
      heal() { drinkHandPotion(); },
      giveSword() {
        const blade = LOOT_TABLE.find((x) => x.slot === "weapon");
        if (!blade) return null;
        const item = { ...blade, uid: uid(), slot: null };
        if (!addItem(item)) return null;
        const idx = state.slots.findIndex((s) => s && s.uid === item.uid);
        if (idx >= 0 && idx < 9) state.hotbarSel = idx;
        updateInventoryUI();
        updateHotbarUI();
        return item;
      },
      dungeonMobCount(diff = "medium", floor = 1) {
        const mult = dungeonDiffMult(diff);
        const gen = generateDungeonFloor(floor, 1, "Test Gate", mult, diff);
        return gen.monsters.length;
      },
      nightCap() {
        return { easy: 2, medium: 5, hard: 9, raid: 14 }[state.difficulty] || 5;
      },
    };
  }

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
  $("btn-heal").addEventListener("click", (e) => { e.preventDefault(); drinkHandPotion(); });
  function bindBlockButton(el) {
    if (!el) return;
    const blockOn = (e) => { e.preventDefault(); setBlocking(true); };
    const blockOff = (e) => { e.preventDefault(); setBlocking(false); };
    el.addEventListener("pointerdown", blockOn);
    el.addEventListener("pointerup", blockOff);
    el.addEventListener("pointerleave", blockOff);
    el.addEventListener("pointercancel", blockOff);
  }
  bindBlockButton($("btn-block"));
  bindBlockButton($("btn-hud-block"));
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  // Hold right mouse to block with shield/armor
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2 && state.running && !state.paused) {
      e.preventDefault();
      setBlocking(true);
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (e.button === 2) setBlocking(false);
  });
  window.addEventListener("blur", () => setBlocking(false));
  window.addEventListener("resize", () => { applyMobileVisibility(); if (state.running) resizeCanvas(); });

  $("btn-portal-enter").addEventListener("click", confirmEnterPortal);
  $("btn-portal-cancel").addEventListener("click", cancelPortal);
  document.querySelectorAll(".diff-pick").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setPortalDifficulty(btn.getAttribute("data-diff"));
    });
  });

  applyMobileVisibility();

  // Public API for HTML fallback + MAP buttons
  window.toggleRuinMap = toggleFullMap;
  window.openRuinMap = openFullMap;
  window.closeRuinMap = closeFullMap;

  requestAnimationFrame(frame);
})();
