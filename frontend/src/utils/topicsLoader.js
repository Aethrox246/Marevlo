/**
 * topicsLoader.js
 * Dynamically loads all problem JSON files from src/assets/** using Vite's
 * import.meta.glob and groups them into topic objects for ProblemList.jsx.
 *
 * Expected topic shape:
 *   { id, name, icon, problems: [{ id, title, difficulty, category, ... }] }
 */

// Eagerly import every JSON file nested under src/assets/
const modules = import.meta.glob('../assets/**/*.json', { eager: true });

// Map folder names to display names + emoji icons
const TOPIC_META = {
  arrays:         { name: 'Arrays',        icon: '📊' },
  'binary trees': { name: 'Binary Trees',  icon: '🌳' },
  'linked lists': { name: 'Linked Lists',  icon: '🔗' },
  graph:          { name: 'Graph',         icon: '🕸️' },
  graphs:         { name: 'Graphs',        icon: '🕸️' },
  'dynamic programming': { name: 'Dynamic Programming', icon: '⚡' },
  sorting:        { name: 'Sorting',       icon: '🔀' },
  searching:      { name: 'Searching',     icon: '🔍' },
  'searching and sorting': { name: 'Searching and Sorting', icon: '🔍' },
  strings:        { name: 'Strings',       icon: '🔤' },
  'hash tables':  { name: 'Hash Tables',   icon: '#️⃣' },
  stacks:         { name: 'Stacks',        icon: '📚' },
  queues:         { name: 'Queues',        icon: '🎯' },
  heaps:          { name: 'Heaps',         icon: '⛰️' },
  trees:          { name: 'Trees',         icon: '🌲' },
  recursion:      { name: 'Recursion',     icon: '🔄' },
  maths:          { name: 'Maths',         icon: '➗' },
  mathematics:    { name: 'Mathematics',   icon: '🔢' },
  'bit manipulation': { name: 'Bit Manipulation', icon: '💡' },
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

/**
 * Loads all topics by grouping the eagerly-imported JSON modules by folder.
 * Returns a Promise so ProblemList can use .then() as expected.
 */
export function loadAllTopics() {
  const topicsMap = {};

  for (const [path, mod] of Object.entries(modules)) {
    const problem = mod.default ?? mod;
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
  const topics = Object.values(topicsMap).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return Promise.resolve(topics);
}
