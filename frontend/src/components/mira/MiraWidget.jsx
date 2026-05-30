import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { MiraChat } from "./MiraChat";
import { MiraProfile } from "./MiraProfile";
import { MiraAvatar } from "./MiraAvatar";
import { useMiraFeatureCheck } from "./useMira";
import { useMiraContext } from "./MiraContextProvider";

const TOOLTIPS = [
  "Hi! Need help studying? 💖",
  "Got a question?",
  "I'm here for you! ✨",
  "Let's learn together 🌸",
  "Stuck on something?",
  "Ask me anything 🌟",
  "Ready when you are 💫",
  "Hey, study buddy!",
];

export default function MiraWidget() {
  const { enabled, loading } = useMiraFeatureCheck();
  const { context } = useMiraContext();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerMood, setHeaderMood] = useState("idle");
  const headerMoodTimerRef = useRef(null);
  const wasThinkingRef = useRef(false);

  // Clean up mood timer on unmount
  useEffect(() => {
    return () => {
      if (headerMoodTimerRef.current) clearTimeout(headerMoodTimerRef.current);
    };
  }, []);

  // Called by MiraChat whenever `sending` state changes
  const handleSendingChange = useCallback((isSending) => {
    if (headerMoodTimerRef.current) clearTimeout(headerMoodTimerRef.current);
    if (isSending) {
      wasThinkingRef.current = true;
      setHeaderMood("thinking");
    } else if (wasThinkingRef.current) {
      wasThinkingRef.current = false;
      setHeaderMood("happy");
      headerMoodTimerRef.current = setTimeout(() => setHeaderMood("idle"), 1000);
    }
  }, []);

  if (loading || !enabled) return null;
  // Don't render inside iframes (e.g. the per-example visualization iframe).
  if (typeof window !== 'undefined' && window.self !== window.top) return null;

  return open ? (
    <div className={styles.miraRoot}>
      {profileOpen && <MiraProfile />}
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <MiraAvatar size={32} mood={headerMood} />
            <div className={styles.headerCopy}>
              <span className={styles.headerSubtitle}>
                <span
                  className={`${styles.headerStatusDot} ${headerMood === "thinking" ? styles.headerStatusDotThinking : ""}`}
                  aria-hidden="true"
                ></span>
                {headerSubtitleFor(context, headerMood)}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.headerButton} ${profileOpen ? styles.headerButtonActive : ""}`}
              onClick={() => setProfileOpen((p) => !p)}
              aria-label="Toggle profile panel"
              title={profileOpen ? "Hide profile" : "Show profile"}
            >
              <ProfileIcon active={profileOpen} />
            </button>
            <button
              type="button"
              className={styles.headerButton}
              onClick={() => setOpen(false)}
              aria-label="Close MIRA"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <MiraChat onSendingChange={handleSendingChange} />
      </div>
    </div>
  ) : (
    <MiraFab onOpen={() => setOpen(true)} />
  );
}

function headerSubtitleFor(context, mood) {
  if (mood === "thinking") return "Thinking through your question";
  if (mood === "happy") return "Ready for your next step";

  const section = context?.section || "general";
  if (section === "code") return "Code companion mode";
  if (section === "course") return "Course learning mode";
  if (section === "problem") return "Problem solving mode";
  if (section === "research") return "Research helper mode";

  return "Ask, learn, and build with me";
}

/* ─── Animated FAB ─────────────────────────────────────────────────────── */

function MiraFab({ onOpen }) {
  const fabRef = useRef(null);
  const moodRef = useRef("idle");
  const hoveringRef = useRef(false);
  const lookXRef = useRef(0);
  const lookYRef = useRef(0);
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const lastHeartBurstRef = useRef(0);
  const tooltipIdxRef = useRef(0);
  const openTimerRef = useRef(null);

  const [mood, setMood] = useState("idle");
  const [entering, setEntering] = useState(true);
  const [clicking, setClicking] = useState(false);
  const [tooltipText, setTooltipText] = useState(TOOLTIPS[0]);

  function setMoodSync(m) {
    moodRef.current = m;
    setMood(m);
  }

  // Entry animation + entrance star burst
  useEffect(() => {
    const t1 = setTimeout(() => setEntering(false), 1700);
    const t2 = setTimeout(() => starBurst(6), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  // Cursor eye-tracking (RAF loop)
  useEffect(() => {
    const MAX_OFFSET = 1.8;
    let rafId;

    function loop() {
      lookXRef.current += (targetXRef.current - lookXRef.current) * 0.18;
      lookYRef.current += (targetYRef.current - lookYRef.current) * 0.18;
      const fab = fabRef.current;
      if (fab) {
        fab.style.setProperty("--look-x", lookXRef.current.toFixed(2) + "px");
        fab.style.setProperty("--look-y", lookYRef.current.toFixed(2) + "px");
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    function onMouseMove(e) {
      const fab = fabRef.current;
      if (!fab) return;
      const rect = fab.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const ratio = Math.min(1, dist / 180);
      targetXRef.current = (dx / dist) * MAX_OFFSET * ratio;
      targetYRef.current = (dy / dist) * MAX_OFFSET * ratio;
    }

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Idle personality moods (wink / curious)
  useEffect(() => {
    const MOODS = ["wink", "curious", "wink"];
    let tid;

    function schedule() {
      tid = setTimeout(() => {
        if (!hoveringRef.current && moodRef.current === "idle") {
          const m = MOODS[Math.floor(Math.random() * MOODS.length)];
          moodRef.current = m;
          setMood(m);
          tid = setTimeout(() => {
            if (moodRef.current === m) {
              moodRef.current = "idle";
              setMood("idle");
            }
            schedule();
          }, 1300);
        } else {
          schedule();
        }
      }, 4500 + Math.random() * 4500);
    }

    schedule();
    return () => clearTimeout(tid);
  }, []);

  /* ── Particle helpers (direct DOM — ephemeral, not React-managed) ── */

  function starBurst(count = 7) {
    const fab = fabRef.current;
    if (!fab) return;
    const STARS = ["✨", "💫", "⭐", "🌟"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = styles.miraBurstStar;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 45 + Math.random() * 20;
      el.style.setProperty("--bx", (Math.cos(angle) * dist).toFixed(1) + "px");
      el.style.setProperty("--by", (Math.sin(angle) * dist).toFixed(1) + "px");
      el.style.fontSize = (12 + Math.random() * 6) + "px";
      el.textContent = STARS[i % STARS.length];
      fab.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  }

  function heartBurst() {
    const now = Date.now();
    if (now - lastHeartBurstRef.current < 700) return;
    lastHeartBurstRef.current = now;
    const fab = fabRef.current;
    if (!fab) return;
    const HEARTS = ["💖", "💕", "✨", "🌸", "💫"];
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const el = document.createElement("span");
        el.className = styles.miraHeart;
        el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
        el.style.left = (8 + Math.random() * 50) + "px";
        el.style.fontSize = (12 + Math.random() * 6) + "px";
        el.style.setProperty("--drift", (Math.random() * 30 - 15) + "px");
        fab.appendChild(el);
        setTimeout(() => el.remove(), 1700);
      }, i * 110);
    }
  }

  /* ── Event handlers ── */

  function handleMouseEnter() {
    hoveringRef.current = true;
    setMoodSync("happy");
    setTooltipText(TOOLTIPS[tooltipIdxRef.current % TOOLTIPS.length]);
    tooltipIdxRef.current++;
    heartBurst();
  }

  function handleMouseLeave() {
    hoveringRef.current = false;
    setMoodSync("idle");
  }

  function handleClick() {
    setMoodSync("surprised");
    starBurst(7);
    setClicking(false);
    requestAnimationFrame(() => {
      setClicking(true);
      setTimeout(() => setClicking(false), 600);
    });
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => onOpen(), 450);
  }

  const cls = [
    styles.fab,
    entering ? styles.entering : "",
    clicking ? styles.clicking : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={fabRef}
      type="button"
      className={cls}
      data-mood={mood}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label="Open MIRA tutor"
    >
      <span className={styles.miraShimmer} />
      <span className={styles.miraRipple} />

      <svg className={styles.miraSvg} viewBox="0 0 64 64" aria-hidden="true">
        {/* Brows */}
        <path className={`${styles.brow} ${styles.browLeft}`}
          d="M18 22 Q24 18 30 22"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className={`${styles.brow} ${styles.browRight}`}
          d="M34 22 Q40 18 46 22"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Left eye */}
        <g className={`${styles.eye} ${styles.eyeLeft}`} transform="translate(24 31)">
          <g className={styles.eyeBlinker}>
            <g className={styles.eyePupilGroup}>
              <circle r="3.4" fill="#3d1f0e" />
              <circle cx="-1.1" cy="-1.3" r="1.1" fill="#ffffff" opacity="0.95" />
              <circle cx="1.2" cy="1.4" r="0.5" fill="#ffffff" opacity="0.7" />
            </g>
            <path className={styles.eyeArc}
              d="M-4.5 1.5 Q0 -3 4.5 1.5"
              stroke="#3d1f0e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* Right eye */}
        <g className={`${styles.eye} ${styles.eyeRight}`} transform="translate(40 31)">
          <g className={styles.eyeBlinker}>
            <g className={styles.eyePupilGroup}>
              <circle r="3.4" fill="#3d1f0e" />
              <circle cx="-1.1" cy="-1.3" r="1.1" fill="#ffffff" opacity="0.95" />
              <circle cx="1.2" cy="1.4" r="0.5" fill="#ffffff" opacity="0.7" />
            </g>
            <path className={styles.eyeArc}
              d="M-4.5 1.5 Q0 -3 4.5 1.5"
              stroke="#3d1f0e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* Blush */}
        <circle className={`${styles.blush} ${styles.blushLeft}`}  cx="16" cy="40" r="3.5" fill="#ff4d7a" />
        <circle className={`${styles.blush} ${styles.blushRight}`} cx="48" cy="40" r="3.5" fill="#ff4d7a" />

        {/* Mouths — only one visible at a time via mood CSS */}
        <path className={`${styles.mouth} ${styles.mouthSmile}`}
          d="M27 43 Q32 47 37 43"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className={`${styles.mouth} ${styles.mouthBigSmile}`}
          d="M25 42 Q32 50 39 42"
          stroke="#3d1f0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <ellipse className={`${styles.mouth} ${styles.mouthO}`}
          cx="32" cy="44" rx="2.2" ry="3.2" fill="#3d1f0e" />
      </svg>

      <div className={styles.fabTooltip}>{tooltipText}</div>
    </button>
  );
}

/* ─── Panel icons ───────────────────────────────────────────────────────── */

function ProfileIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#6366f1" : "currentColor"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
