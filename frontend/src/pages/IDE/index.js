/**
 * IDE Components Index
 * Central export point for all IDE-related components
 * 
 * Enhanced IDE with:
 * - Keyboard shortcuts modal and global shortcuts
 * - Performance optimized components with memoization
 * - Improved accessibility (ARIA labels, keyboard navigation)
 * - Better animations and visual feedback
 * - Diff viewer for test results
 * - Theme-aware styling throughout
 */

export { default as IDE } from './IDE';
export { default as ProblemPanel } from './ProblemPanel';
export { default as CodeToolbar } from './CodeToolbar';
export { default as CodeEditor } from './CodeEditor';
export { default as TabBar } from './TabBar';
export { default as TestcasePanel } from './TestcasePanel';
export { default as StatusNotification } from './StatusNotification';
export { default as ConsolePanel } from './ConsolePanel';
export { default as EmptyState } from './EmptyState';
export { default as KeyboardShortcuts } from './KeyboardShortcuts';

// Legacy exports (for backward compatibility)
export { default as EditorToolbar } from './EditorToolbar';
export { default as EnvironmentWarning } from './EnvironmentWarning';

// Default export for convenience
export { default } from './IDE';
