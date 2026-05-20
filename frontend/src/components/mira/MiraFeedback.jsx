/**
 * MiraFeedback.jsx — Inline feedback buttons under each MIRA response.
 *
 * Shows one feedback row per matched concept. On click, calls backend
 * feedback endpoint, animates to "Thanks" state, and disappears after
 * a short delay (one-shot).
 *
 * The parent (MiraChat) decides what to do with the feedback result
 * (e.g., update bandit stats, refresh profile).
 */

import { useState } from "react";
import styles from "./styles.module.css";

export function MiraFeedback({ matchedConcepts, styleUsed, onFeedback }) {
  const [clicked, setClicked] = useState({}); // { conceptId: "yes" | "no" }

  if (!matchedConcepts || matchedConcepts.length === 0) return null;
  if (!styleUsed) return null;

  const handleClick = async (conceptId, understood) => {
    if (clicked[conceptId]) return;
    setClicked((c) => ({ ...c, [conceptId]: understood ? "yes" : "no" }));
    try {
      await onFeedback({
        concept_id: conceptId,
        style_used: styleUsed,
        understood,
      });
    } catch (e) {
      // Already logged by hook; just revert
      setClicked((c) => {
        const next = { ...c };
        delete next[conceptId];
        return next;
      });
    }
  };

  return (
    <div className={styles.feedback}>
      {matchedConcepts.map((concept) => {
        const state = clicked[concept];
        return (
          <div key={concept} className={styles.feedbackConcept}>
            <span>{prettyConceptName(concept)}</span>
            {state ? (
              <span className={styles.feedbackDone}>
                {state === "yes" ? "Thanks ✓" : "Got it, I’ll adjust 🌸"}
              </span>
            ) : (
              <div className={styles.feedbackBtnGroup}>
                <button
                  type="button"
                  className={`${styles.feedbackBtn} ${styles.feedbackBtnYes}`}
                  onClick={() => handleClick(concept, true)}
                  aria-label={`Understood ${concept}`}
                >
                  ✓ Got it
                </button>
                <button
                  type="button"
                  className={`${styles.feedbackBtn} ${styles.feedbackBtnNo}`}
                  onClick={() => handleClick(concept, false)}
                  aria-label={`Not quite on ${concept}`}
                >
                  🤔 Not quite
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function prettyConceptName(conceptId) {
  if (!conceptId) return "";
  return conceptId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
