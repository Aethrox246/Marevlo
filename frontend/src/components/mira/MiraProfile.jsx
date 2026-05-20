/**
 * MiraProfile.jsx — Right-side cognitive state panel.
 *
 * Shows: quota, concept mastery bars, bandit dominance, learned observations.
 * Opens/closes via toggle in MiraWidget header.
 */

import { useEffect } from "react";
import styles from "./styles.module.css";
import { MiraAvatar } from "./MiraAvatar";
import { useMiraProfile } from "./useMira";

export function MiraProfile() {
  const { profile, loading, refresh } = useMiraProfile();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading && !profile) {
    return (
      <div className={styles.profilePanel}>
        <div className={styles.profileEmptyState}>
          <MiraAvatar size={48} mood="thinking" />
          <p className={styles.profileEmptyStateText}>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.profilePanel}>
        <div className={styles.profileEmptyState}>
          <MiraAvatar size={48} mood="idle" />
          <p className={styles.profileEmptyStateText}>
            Ask me a question and I’ll start learning what helps you most 🌸
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePanel}>
      {/* Quota */}
      <div className={styles.profileSection}>
        <div className={styles.profileSectionTitle}>Your plan</div>
        <div className={styles.profileStat}>
          <span className={styles.profileStatLabel}>Tier</span>
          <span className={styles.profileStatValue}>{capitalize(profile.tier)}</span>
        </div>
        <div className={styles.profileStat}>
          <span className={styles.profileStatLabel}>Questions used</span>
          <span className={styles.profileStatValue}>
            {profile.quota_used || 0} / {profile.quota_limit || 0}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.profileSection}>
        <div className={styles.profileSectionTitle}>Progress</div>
        <div className={styles.profileStat}>
          <span className={styles.profileStatLabel}>Concepts tracked</span>
          <span className={styles.profileStatValue}>{profile.concepts_tracked || 0}</span>
        </div>
        <div className={styles.profileStat}>
          <span className={styles.profileStatLabel}>Total interactions</span>
          <span className={styles.profileStatValue}>{profile.total_interactions || 0}</span>
        </div>
        {profile.dominant_style && (
          <div className={styles.profileStat}>
            <span className={styles.profileStatLabel}>Preferred style</span>
            <span className={styles.profileStatValue}>{profile.dominant_style}</span>
          </div>
        )}
      </div>

      {/* Top concepts */}
      {profile.top_concepts && profile.top_concepts.length > 0 && (
        <div className={styles.profileSection}>
          <div className={styles.profileSectionTitle}>Your top concepts</div>
          {profile.top_concepts.slice(0, 10).map((c) => {
            const pct = Math.round((c.p_known || 0) * 100);
            const mastered = c.mastery === "mastered";
            return (
              <div key={c.concept_id} className={styles.conceptBar}>
                <div className={styles.conceptBarLabel}>
                  <span className={styles.conceptBarName}>
                    {prettifyName(c.concept_id)}
                  </span>
                  <span className={styles.conceptBarPct}>{pct}%</span>
                </div>
                <div className={styles.conceptBarTrack}>
                  <div
                    className={`${styles.conceptBarFill} ${mastered ? styles.conceptBarFillMastered : ""}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bandit */}
      {profile.bandit_stats && Object.keys(profile.bandit_stats).length > 0 && (
        <div className={styles.profileSection}>
          <div className={styles.profileSectionTitle}>Explanation styles tried</div>
          {Object.entries(profile.bandit_stats)
            .filter(([_, s]) => (s.attempts || 0) > 0)
            .sort(([, a], [, b]) => (b.expected_value || 0) - (a.expected_value || 0))
            .map(([style, stats]) => (
              <div key={style} className={styles.profileStat}>
                <span className={styles.profileStatLabel}>
                  {capitalize(style)}
                </span>
                <span className={styles.profileStatValue}>
                  {stats.successes}/{stats.attempts} ({Math.round((stats.expected_value || 0) * 100)}%)
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Observations */}
      {profile.personal_prompt_observations && profile.personal_prompt_observations.length > 0 && (
        <div className={styles.profileSection}>
          <div className={styles.profileSectionTitle}>What MIRA learned about you</div>
          <ul className={styles.observationList}>
            {profile.personal_prompt_observations.slice(-10).reverse().map((obs, i) => (
              <li key={i} className={styles.observationItem}>
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function prettifyName(id) {
  if (!id) return "";
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
