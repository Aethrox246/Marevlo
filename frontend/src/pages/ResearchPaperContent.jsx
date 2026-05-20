
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Star, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { PAPERS, TAG_COLORS, PAPER_HTML_MAP } from '../data/papers';

/* ─── tiny shimmer keyframes injected once ────────────────────────────── */
const STYLE = `
  @keyframes rpc-spin { to { transform: rotate(360deg) } }
  @keyframes rpc-fade { from { opacity:0 } to { opacity:1 } }
  @keyframes rpc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .rpc-back:hover {
    background: linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.025) 100%) !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #fff !important;
  }
  .rpc-pdf:hover {
    border-color: rgba(245,158,11,0.45) !important;
    color: #f59e0b !important;
    background: rgba(245,158,11,0.07) !important;
  }
  .rpc-tag-chip { transition: all 0.18s ease; }
  .rpc-tag-chip:hover { opacity: 0.85; transform: translateY(-1px); }
`;

export default function ResearchPaperContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const iframeRef   = useRef(null);
  const cleanupRef  = useRef(null);

  const [readProgress, setReadProgress] = useState(0);
  const [isLoaded,     setIsLoaded]     = useState(false);

  const htmlFile = PAPER_HTML_MAP[slug] ?? null;
  const paper    = PAPERS.find(p => p.slug === slug) ?? null;
  const accent   = paper ? (TAG_COLORS[paper.tags[0]] || '#f59e0b') : '#f59e0b';

  /* Esc → back ---------------------------------------------------------- */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') navigate('/research/papers'); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navigate]);

  /* Cleanup scroll listener on unmount / slug change ------------------- */
  useEffect(() => () => cleanupRef.current?.(), [slug]);

  /* Track iframe scroll → reading progress ----------------------------- */
  const handleLoad = () => {
    setIsLoaded(true);
    cleanupRef.current?.();
    try {
      const iDoc = iframeRef.current?.contentDocument;
      const iWin = iframeRef.current?.contentWindow;
      if (!iDoc || !iWin) return;
      const tick = () => {
        const el   = iDoc.documentElement;
        const top  = el.scrollTop || iDoc.body?.scrollTop || 0;
        const h    = el.scrollHeight - el.clientHeight;
        if (h > 0) setReadProgress(Math.min(100, Math.round((top / h) * 100)));
      };
      iWin.addEventListener('scroll', tick, { passive: true });
      cleanupRef.current = () => { try { iWin.removeEventListener('scroll', tick); } catch (_) {} };
    } catch (_) {}
  };

  /* ── 404 state ─────────────────────────────────────────────────────── */
  if (!htmlFile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: '18px',
        background: 'var(--color-app-bg)',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={28} color="rgba(245,158,11,0.5)" />
        </div>
        <p style={{ fontSize: '15px', color: 'rgba(180,185,210,0.5)', fontWeight: 600 }}>
          Paper not found.
        </p>
        <button
          onClick={() => navigate('/research/papers')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '10px 20px', borderRadius: '100px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Papers
        </button>
      </div>
    );
  }

  /* ── Main layout ────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{STYLE}</style>

      {/* ════════════════════════════════════════════════════════════════
          NAVBAR
          ════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'relative', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 20px', height: '62px',
        background: 'linear-gradient(180deg, rgba(9,9,20,0.98) 0%, rgba(7,7,16,0.95) 100%)',
        backdropFilter: 'blur(28px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        borderBottom: '1px solid rgba(255,255,255,0.065)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.35)',
      }}>

        {/* ── Left: Back button ──────────────────────────────────────── */}
        <button
          className="rpc-back"
          onClick={() => navigate('/research/papers')}
          title="Back to Papers (Esc)"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '7px 14px', borderRadius: '100px', flexShrink: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(200,205,225,0.7)', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
          }}
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          Papers
        </button>

        {/* breadcrumb chevron */}
        <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

        {/* ── Center: Paper icon + title + meta ──────────────────────── */}
        {paper && (
          <>
            {/* Icon badge */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
              border: `1px solid ${accent}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px ${accent}14, 0 1px 0 rgba(255,255,255,0.05) inset`,
            }}>
              <BookOpen size={14} color={accent} />
            </div>

            {/* Title + authors */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12.5px', fontWeight: 700,
                color: 'rgba(235,238,255,0.92)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.2, letterSpacing: '-0.01em',
              }}>
                {paper.title}
              </div>
              <div style={{
                fontSize: '10.5px',
                color: 'rgba(160,165,190,0.5)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginTop: '2px', letterSpacing: '0.01em',
              }}>
                {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
                &nbsp;·&nbsp;{paper.venue}&nbsp;·&nbsp;{paper.year}
              </div>
            </div>

            {/* Tag chips */}
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              {paper.tags.slice(0, 2).map(tag => {
                const c = TAG_COLORS[tag] || accent;
                return (
                  <span key={tag} className="rpc-tag-chip" style={{
                    fontSize: '9.5px', fontWeight: 700, padding: '3px 9px',
                    borderRadius: '100px', color: c,
                    background: `${c}0e`, border: `1px solid ${c}22`,
                    letterSpacing: '0.03em', whiteSpace: 'nowrap',
                  }}>
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* Star count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: 0.65 }}>
              <Star size={11} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontSize: '11px', color: 'rgba(200,205,225,0.7)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {paper.stars}
              </span>
            </div>
          </>
        )}

        {/* ── Right: actions ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: paper ? 0 : 'auto' }}>

          {/* Progress pill — appears once you start scrolling */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '100px',
            background: readProgress > 0 ? `${accent}0e` : 'rgba(255,255,255,0.03)',
            border: readProgress > 0 ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.07)',
            transition: 'all 0.3s ease',
            minWidth: '54px', justifyContent: 'center',
          }}>
            {readProgress > 0
              ? <><Clock size={9} color={accent} /><span style={{ fontSize: '10px', fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>{readProgress}%</span></>
              : <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: 'rpc-pulse 2s ease infinite' }} /><span style={{ fontSize: '9.5px', color: 'rgba(180,185,210,0.3)', fontWeight: 600 }}>—</span></>
            }
          </div>

          {/* PDF / external link */}
          {paper?.url && paper.url !== '#' && (
            <a
              className="rpc-pdf"
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open original paper"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '7px 13px', borderRadius: '10px', textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(200,205,225,0.55)',
                fontSize: '11.5px', fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                letterSpacing: '0.01em',
              }}
            >
              <ExternalLink size={11} />
              PDF
            </a>
          )}

          {/* Esc shortcut hint */}
          <kbd style={{
            fontSize: '9.5px', fontWeight: 700, padding: '3px 7px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(180,185,210,0.3)',
            border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'inherit',
            userSelect: 'none', letterSpacing: '0.02em',
          }}>Esc</kbd>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          IFRAME — paper content
          ════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Loading overlay — spins until iframe fires onLoad */}
        {!isLoaded && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '20px', background: 'var(--color-app-bg)',
            animation: 'rpc-fade 0.2s ease',
          }}>
            {/* Spinner ring */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              border: `3px solid rgba(255,255,255,0.05)`,
              borderTopColor: accent,
              animation: 'rpc-spin 0.8s linear infinite',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(200,205,225,0.6)' }}>
                {paper?.title?.split('—')[0]?.trim() ?? 'Loading paper'}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(160,165,190,0.35)', letterSpacing: '0.04em' }}>
                {paper?.venue} · {paper?.year}
              </span>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={htmlFile}
          title={paper?.title ?? slug}
          onLoad={handleLoad}
          style={{
            width: '100%', height: '100%',
            border: 'none', display: 'block',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        />
      </div>
    </div>
  );
}
