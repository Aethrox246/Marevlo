
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAPER_HTML_MAP: Maps paper slugs to their corresponding HTML file paths.
// Update this map if you add/remove HTML files in /public/ResearchPapers.
// -----------------------------------------------------------------------------
const PAPER_HTML_MAP = {
  budgetmem: '/ResearchPapers/budgetmem.html',
  diskann: '/ResearchPapers/diskann%20(1).html',
  dytopo: '/ResearchPapers/dytopo%20(1).html',
  graphmem: '/ResearchPapers/graphmem.html',
  experts: '/ResearchPapers/experts%20(1).html',
  hnsw: '/ResearchPapers/hnsw%20(1).html',
  orch: '/ResearchPapers/orch%20(1).html',
  procmem: '/ResearchPapers/procmem%20(1).html',
  roma: '/ResearchPapers/roma%20(1).html',
  adapt: '/ResearchPapers/adapt%20(1).html',
  crave: '/ResearchPapers/crave%20(1).html',
  resa: '/ResearchPapers/resa%20(1).html',
};

/**
 * ResearchPaperContent
 * Renders the content of a research paper by embedding the corresponding HTML file in an iframe.
 * If the slug is invalid, shows a 'Paper not found' message and a back button.
 *
 * Usage: Route should provide a 'slug' param matching a key in PAPER_HTML_MAP.
 */
export default function ResearchPaperContent() {
  // Get the paper slug from the URL params
  const { slug } = useParams();
  const navigate = useNavigate();
  // Look up the HTML file for the given slug
  const htmlFile = PAPER_HTML_MAP[slug] ?? null;

  // If the slug is invalid, show a not found message and a back button
  if (!htmlFile) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '16px',
        }}
      >
        <p style={{ fontSize: '18px', color: 'var(--color-muted-text)' }}>
          Paper not found.
        </p>
        <button
          onClick={() => navigate('/research/papers')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '12px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            color: 'var(--color-primary-text)', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Papers
        </button>
      </div>
    );
  }

  // Main render: Top bar with back button, and iframe for the paper content
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top navigation bar with back button */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 24px', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)', flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/research/papers')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            color: 'var(--color-primary-text)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
        >
          <ArrowLeft size={15} /> Back to Papers
        </button>
      </div>

      {/* Iframe for displaying the paper HTML content */}
      <iframe
        src={htmlFile}
        title={slug}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}
