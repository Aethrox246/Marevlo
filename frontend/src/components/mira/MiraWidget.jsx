/**
 * MiraWidget.jsx — Top-level MIRA widget.
 *
 * Renders:
 *   - Feature check on mount (returns null if not enabled)
 *   - Floating button (FAB) when closed
 *   - Side panel with chat when open
 *   - Optional profile panel (dual-pane mode) when toggled
 *
 * Mounted ONCE at App level. Context comes from MiraContextProvider.
 */

import { useState } from "react";
import styles from "./styles.module.css";
import { MiraChat } from "./MiraChat";
import { MiraProfile } from "./MiraProfile";
import { useMiraFeatureCheck } from "./useMira";

export default function MiraWidget() {
  const { enabled, loading } = useMiraFeatureCheck();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Don't render anything while checking
  if (loading) return null;
  // Don't render if MIRA is not enabled for this user
  if (!enabled) return null;

  if (!open) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Open MIRA tutor"
      >
        <MiraIcon />
      </button>
    );
  }

  return (
    <div className={styles.miraRoot}>
      {profileOpen && <MiraProfile />}

      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.headerLogo}>M</span>
            <span>MIRA</span>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerButton}
              onClick={() => setProfileOpen(!profileOpen)}
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

        <MiraChat />
      </div>
    </div>
  );
}

function MiraIcon() {
  return (
    <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#5e3bff" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
