/**
 * MiraAvatar.jsx — Reusable Mira face component.
 *
 * Renders Mira's animated SVG face inside a gradient circle.
 * The same face from the FAB, extracted so every part of the panel
 * can show Mira's character.
 *
 * Props:
 *   size        {number}  — width/height in px. Default: 32
 *   mood        {string}  — "idle" | "happy" | "thinking" | "wink" | "curious" | "surprised"
 *   trackCursor {boolean} — enable cursor-tracking eyes via RAF loop. Default: false
 *   bob         {boolean} — gentle bob animation. Default: false
 */

import { useEffect, useRef } from "react";
import styles from "./styles.module.css";

export function MiraAvatar({ size = 32, mood = "idle", trackCursor = false, bob = false }) {
  const wrapRef = useRef(null);
  const lookXRef = useRef(0);
  const lookYRef = useRef(0);
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);

  // Cursor-tracking RAF loop (mirrors MiraFab behaviour)
  useEffect(() => {
    if (!trackCursor) return;

    const MAX_OFFSET = Math.max(1, size / 22);
    let rafId;

    function loop() {
      lookXRef.current += (targetXRef.current - lookXRef.current) * 0.18;
      lookYRef.current += (targetYRef.current - lookYRef.current) * 0.18;
      const el = wrapRef.current;
      if (el) {
        el.style.setProperty("--look-x", lookXRef.current.toFixed(2) + "px");
        el.style.setProperty("--look-y", lookYRef.current.toFixed(2) + "px");
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    function onMouseMove(e) {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
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
  }, [trackCursor, size]);

  const wrapClass = [styles.miraAvatar, bob ? styles.miraAvatarBob : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapRef}
      className={wrapClass}
      data-mood={mood}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        className={styles.miraAvatarSvg}
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        {/* Brows */}
        <path
          className={`${styles.avBrow} ${styles.avBrowLeft}`}
          d="M18 22 Q24 18 30 22"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        <path
          className={`${styles.avBrow} ${styles.avBrowRight}`}
          d="M34 22 Q40 18 46 22"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round"
        />

        {/* Left eye */}
        <g className={`${styles.avEye} ${styles.avEyeLeft}`} transform="translate(24 31)">
          <g className={styles.avEyeBlinker}>
            <g className={styles.avEyePupil}>
              <circle r="3.4" fill="#3d1f0e" />
              <circle cx="-1.1" cy="-1.3" r="1.1" fill="#ffffff" opacity="0.95" />
              <circle cx="1.2" cy="1.4" r="0.5" fill="#ffffff" opacity="0.7" />
            </g>
            <path
              className={styles.avEyeArc}
              d="M-4.5 1.5 Q0 -3 4.5 1.5"
              stroke="#3d1f0e" strokeWidth="2.4" fill="none" strokeLinecap="round"
            />
          </g>
        </g>

        {/* Right eye */}
        <g className={`${styles.avEye} ${styles.avEyeRight}`} transform="translate(40 31)">
          <g className={styles.avEyeBlinker}>
            <g className={styles.avEyePupil}>
              <circle r="3.4" fill="#3d1f0e" />
              <circle cx="-1.1" cy="-1.3" r="1.1" fill="#ffffff" opacity="0.95" />
              <circle cx="1.2" cy="1.4" r="0.5" fill="#ffffff" opacity="0.7" />
            </g>
            <path
              className={styles.avEyeArc}
              d="M-4.5 1.5 Q0 -3 4.5 1.5"
              stroke="#3d1f0e" strokeWidth="2.4" fill="none" strokeLinecap="round"
            />
          </g>
        </g>

        {/* Blush dots */}
        <circle className={`${styles.avBlush} ${styles.avBlushLeft}`}  cx="16" cy="40" r="3.5" fill="#ff4d7a" />
        <circle className={`${styles.avBlush} ${styles.avBlushRight}`} cx="48" cy="40" r="3.5" fill="#ff4d7a" />

        {/* Mouths — only one visible at a time via mood CSS */}
        <path className={`${styles.avMouth} ${styles.avMouthSmile}`}
          d="M27 43 Q32 47 37 43"
          stroke="#3d1f0e" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className={`${styles.avMouth} ${styles.avMouthBigSmile}`}
          d="M25 42 Q32 50 39 42"
          stroke="#3d1f0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <ellipse className={`${styles.avMouth} ${styles.avMouthO}`}
          cx="32" cy="44" rx="2.2" ry="3.2" fill="#3d1f0e" />
        {/* Thinking mouth — gentle open hmm */}
        <path className={`${styles.avMouth} ${styles.avMouthThinking}`}
          d="M28 44 Q32 46.5 36 44"
          stroke="#3d1f0e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
