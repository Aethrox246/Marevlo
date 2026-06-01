/**
 * topicsLoader.js
 * Dynamically loads all problem JSON files from src/assets/** using Vite's
 * import.meta.glob and groups them into topic objects for ProblemList.jsx.
 *
 * Expected topic shape:
 *   { id, name, icon, problems: [{ id, title, difficulty, category, ... }] }
 */

// Lazily import every JSON file nested under src/assets/
// Using lazy (non-eager) glob so the 750 JSON files are NOT bundled into the main chunk.
// They are loaded on demand when loadAllTopics() is first called.
const modules = import.meta.glob('../assets/**/*.json');

// Map folder names to display names + emoji icons
const TOPIC_META = {
  arrays:                        { name: 'Arrays',                    icon: '📊' },
  'binary trees':                { name: 'Binary Trees',              icon: '🌳' },
  'linked lists':                { name: 'Linked Lists',              icon: '🔗' },
  'liked list':                  { name: 'Linked List',               icon: '🔗' },
  'linked_list':                 { name: 'Linked Lists',              icon: '🔗' },
  graph:                         { name: 'Graph',                     icon: '🕸️' },
  graphs:                        { name: 'Graphs',                    icon: '🕸️' },
  'dynamic programming':         { name: 'Dynamic Programming',       icon: '⚡' },
  'dynamic_programming':         { name: 'Dynamic Programming',       icon: '⚡' },
  sorting:                       { name: 'Sorting',                   icon: '🔀' },
  searching:                     { name: 'Searching',                 icon: '🔍' },
  'searching and sorting':       { name: 'Searching and Sorting',     icon: '🔍' },
  'searching & sorting (1)':     { name: 'Searching & Sorting',       icon: '🔍' },
  string:                        { name: 'String',                    icon: '🔤' },
  strings:                       { name: 'Strings',                   icon: '🔤' },
  'hash tables':                 { name: 'Hash Tables',               icon: '#️⃣' },
  stacks:                        { name: 'Stacks',                    icon: '📚' },
  queues:                        { name: 'Queues',                    icon: '🎯' },
  heaps:                         { name: 'Heaps',                     icon: '⛰️' },
  trees:                         { name: 'Trees',                     icon: '🌲' },
  recursion:                     { name: 'Recursion',                 icon: '🔄' },
  trie:                          { name: 'Trie',                      icon: '🌿' },
  'stacks queues and heaps':     { name: 'Stacks, Queues & Heaps',    icon: '📚' },
  'stack_queue_and_heap':        { name: 'Stacks, Queues & Heaps',    icon: '📚' },
  maths:                         { name: 'Maths',                     icon: '➗' },
  mathematics:                   { name: 'Mathematics',               icon: '🔢' },
  'bit manipulation':            { name: 'Bit Manipulation',          icon: '💡' },
};

/**
 * Parses the glob path to extract the topic folder name.
 * e.g. "../assets/ARRAYS/01_foo.json" → "arrays"
 */
function extractTopicKey(path) {
  // path looks like: ../assets/FOLDER_NAME/filename.json
  const parts = path.split('/');
  // parts: ['..', 'assets', 'FOLDER_NAME', 'filename.json']
  if (parts.length >= 4) {
    return parts[2].toLowerCase();
  }
  return 'other';
}

let cachedTopics = null;
const LOAD_BATCH_SIZE = 24;

/**
 * Loads all topics by grouping the lazily-imported JSON modules by folder.
 * Results are cached after the first call — subsequent calls are instant.
 */
export async function loadAllTopics() {
  if (cachedTopics) return cachedTopics;

  const entries = Object.entries(modules);
  const loaded = [];

  for (let i = 0; i < entries.length; i += LOAD_BATCH_SIZE) {
    const batch = entries.slice(i, i + LOAD_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(([path, loader]) => loader().then(mod => ({ path, problem: mod.default ?? mod })))
    );
    loaded.push(...batchResults);
  }

  const topicsMap = {};
  for (const { path, problem } of loaded) {
    const topicKey = extractTopicKey(path);

    if (!topicsMap[topicKey]) {
      const meta = TOPIC_META[topicKey] || {
        name: topicKey.charAt(0).toUpperCase() + topicKey.slice(1),
        icon: '📁',
      };
      topicsMap[topicKey] = {
        id: topicKey,
        name: meta.name,
        icon: meta.icon,
        problems: [],
      };
    }

    // Extract just the lightweight fields needed for the list view
    topicsMap[topicKey].problems.push({
      id:         problem.id         || path,
      title:      problem.title      || 'Untitled',
      difficulty: problem.difficulty || 'Medium',
      category:   problem.category   || topicKey,
      tags:       problem.tags       || [],
      // Keep the full problem data attached so the IDE can use it later
      _raw: problem,
    });
  }

  // Sort topics alphabetically, then sort problems within each topic by filename order
  cachedTopics = Object.values(topicsMap).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return cachedTopics;
}
