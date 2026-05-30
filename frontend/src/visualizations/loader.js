// Lazy-loads visualization HTML files bundled into the JS build.
// Using Vite's import.meta.glob with `?raw` ensures the .htm content is
// embedded as strings (one chunk per file) and fetched on demand.
// This bypasses all server-side routing — works on Vercel, Vite dev, anywhere.

const modules = import.meta.glob('./**/*.{htm,html}', {
    query: '?raw',
    import: 'default',
});

/**
 * Loads the raw HTML content for a given topic + filename stem.
 * @param {string} topicKey  e.g. "arrays"
 * @param {string} vizFile   e.g. "01_find_maximum_element_in_array_fixed"
 * @returns {Promise<string|null>} resolves to HTML string, or null if not found
 */
export async function loadVizHtml(topicKey, vizFile) {
    if (!topicKey || !vizFile) return null;
    const candidates = [
        `./${topicKey}/${vizFile}.htm`,
        `./${topicKey}/${vizFile}.html`,
    ];
    for (const key of candidates) {
        if (modules[key]) {
            try {
                return await modules[key]();
            } catch (err) {
                console.warn(`[viz] Failed to load ${key}:`, err);
                return null;
            }
        }
    }
    return null;
}

/** Returns true if a visualization exists for this topic+stem. */
export function hasViz(topicKey, vizFile) {
    if (!topicKey || !vizFile) return false;
    return !!(
        modules[`./${topicKey}/${vizFile}.htm`] ||
        modules[`./${topicKey}/${vizFile}.html`]
    );
}
