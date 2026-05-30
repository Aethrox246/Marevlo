/**
 * MiraChat.jsx — Message list + input for the MIRA widget.
 *
 * Renders user/MIRA messages with metadata pills, inline feedback buttons,
 * thinking indicator while waiting for response, quota hint, and
 * (on Code IDE) a toggle for code visibility.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { MiraFeedback } from "./MiraFeedback";
import { MiraAvatar } from "./MiraAvatar";
import { useMiraChat, useMiraPreferences, useMiraQuota } from "./useMira";
import { useMiraContext } from "./MiraContextProvider";
import { useAuth } from "../../context/AuthContext";

export function MiraChat({ onSendingChange }) {
  const { context } = useMiraContext();
  const { messages, sending, sendMessage, sendFeedback } = useMiraChat();
  const { preferences, updatePreferences } = useMiraPreferences();
  const { quota, refresh: refreshQuota } = useMiraQuota();
  const { user, profileStats } = useAuth();
  const scrollRef = useRef(null);
  const [text, setText] = useState("");

  const isCodeSection = context.section === "code";
  const codeVisible = preferences?.code_visibility === "always_on";

  // Fetch quota on mount
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // Auto-scroll — only if user is already near the bottom (within 120px).
  // Preserves position when user scrolls up to read older messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Notify parent (MiraWidget) so the header avatar can react
  useEffect(() => {
    onSendingChange?.(sending);
  }, [sending, onSendingChange]);


  const handleSubmit = useCallback(async () => {
    const clean = text.trim();
    if (!clean || sending) return;
    setText("");
    await sendMessage(clean);
    refreshQuota();
  }, [text, sending, sendMessage, refreshQuota]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const toggleCodeVisibility = useCallback(async (e) => {
    const newValue = e.target.checked ? "always_on" : "always_off";
    await updatePreferences({ code_visibility: newValue });
  }, [updatePreferences]);

  const handleFeedback = useCallback(async (payload) => {
    return sendFeedback(payload);
  }, [sendFeedback]);

  return (
    <>
      {context.pill_label || context.section !== "general" ? (
        <div className={styles.contextPill}>
          <span className={styles.contextPillDot}></span>
          {context.pill_label || prettySection(context)}
        </div>
      ) : null}

      <div className={styles.messages} ref={scrollRef}>
        {messages.length === 0 ? (
          <WelcomeMessage
            section={context.section}
            user={user}
            profileStats={profileStats}
            onChipClick={(ex) => setText(ex)}
          />
        ) : (
          messages.map((msg, i) => (
            <MessageRow
              key={`${msg.role}-${msg.at ?? i}`}
              msg={msg}
              onFeedback={handleFeedback}
            />
          ))
        )}
        {sending && <ThinkingIndicator />}
      </div>

      <div className={styles.inputWrap}>
        {isCodeSection && (
          <div className={styles.codeToggleRow}>
            <label className={styles.codeToggleLabel}>
              Share my code with MIRA
              <span style={{ fontWeight: 400, fontSize: 11, color: "#75758a" }}>
                {codeVisible ? " (on)" : " (off)"}
              </span>
            </label>
            <input
              type="checkbox"
              className={styles.codeToggle}
              checked={!!codeVisible}
              onChange={toggleCodeVisibility}
              aria-label="Share code with MIRA"
            />
          </div>
        )}

        <div className={styles.inputComposer}>
          <div className={styles.inputFieldWrap}>
            <div className={styles.growWrap} data-replicated-value={text}>
              <textarea
                className={styles.input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder={placeholderFor(context.section)}
                disabled={sending}
                rows={1}
                aria-label="Type your message"
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSubmit}
            disabled={sending || !text.trim()}
            aria-label="Send message"
          >
            <span>{sending ? "Sending" : "Send"}</span>
            <span className={styles.sendBtnIcon} aria-hidden="true">{'>'}</span>
          </button>
        </div>

        <div className={styles.composerMetaRow}>
          <div className={styles.inputHint}>Enter for new line · Ctrl/Cmd+Enter to send</div>
          {quota && (
            <div className={`${styles.quotaHint}${quota.remaining < 20 ? ` ${styles.quotaHintWarn}` : ""}`}>
              {quota.remaining < 20
                ? `Only ${quota.remaining} left this period`
                : `${quota.remaining}/${quota.limit} questions`}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MessageRow({ msg, onFeedback }) {
  const [metaOpen, setMetaOpen] = useState(false);

  if (msg.role === "user") {
    return (
      <div className={`${styles.messageRow} ${styles.messageRowUser} ${styles.msgFadeIn}`}>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>{msg.text}</div>
      </div>
    );
  }
  if (msg.role === "system") {
    return (
      <div className={`${styles.messageRow} ${styles.messageRowSystem} ${styles.msgFadeIn}`}>
        <div className={`${styles.bubble} ${styles.bubbleSystem} ${msg.error ? styles.bubbleError : ""}`}>
          {msg.text}
        </div>
      </div>
    );
  }
  // MIRA message
  const hasMetadata =
    msg.depth || msg.style_used || msg.model || typeof msg.cost_inr === "number";

  return (
    <div className={`${styles.messageRow} ${styles.messageRowMira} ${styles.msgFadeIn}`}>
      <div className={styles.miraMsgRow}>
        <MiraAvatar size={24} mood="idle" />
        <div className={styles.miraMsgContent}>
          <div className={`${styles.bubble} ${styles.bubbleMira}`}>{msg.text}</div>

          {hasMetadata && (
            <div className={styles.metaRow}>
              <button
                type="button"
                className={styles.metaToggle}
                onClick={() => setMetaOpen((v) => !v)}
                aria-label={metaOpen ? "Hide message details" : "Show message details"}
                aria-expanded={metaOpen}
                title="Message details"
              >
                ⓘ
              </button>
              {metaOpen && (
                <div className={styles.metaExpanded}>
                  {msg.depth && <span>Depth: {msg.depth}</span>}
                  {msg.style_used && (
                    <span>
                      Style: {msg.style_used}
                      {msg.blend_style ? ` · ${msg.blend_style}` : ""}
                    </span>
                  )}
                  {msg.model && <span>Model: {shortModel(msg.model)}</span>}
                  {typeof msg.cost_inr === "number" && (
                    <span>Cost: ₹{msg.cost_inr.toFixed(2)}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {msg.matched_concepts && msg.matched_concepts.length > 0 && (
            <MiraFeedback
              matchedConcepts={msg.matched_concepts}
              styleUsed={msg.style_used}
              onFeedback={onFeedback}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className={`${styles.messageRow} ${styles.messageRowMira} ${styles.msgFadeIn}`}>
      <div className={styles.thinkingRow}>
        <MiraAvatar size={28} mood="thinking" />
        <span className={styles.thinkingText}>Mira is thinking…</span>
      </div>
    </div>
  );
}

function WelcomeMessage({ section, user, profileStats, onChipClick }) {
  const examples = welcomeExamples(section);
  const firstName = user?.name?.split(" ")[0] || user?.username || null;

  const hasStats =
    profileStats &&
    (profileStats.level > 1 ||
      profileStats.xp > 0 ||
      profileStats.streak > 0 ||
      profileStats.courses_completed > 0 ||
      profileStats.problems_solved > 0);

  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeAvatarWrap}>
        <MiraAvatar size={64} mood="idle" bob={true} />
      </div>
      <div className={styles.welcomeGreet}>
        Hi {firstName || "there"}! I’m Mira 🌸
      </div>
      <div className={styles.welcomeSub}>
        Ask me anything you’re learning. I adapt to how you think.
      </div>

      {hasStats && (
        <div className={styles.welcomeAbout}>
          <div className={styles.welcomeAboutTitle}>About You</div>
          <div className={styles.welcomeAboutRow}>
            {profileStats.level > 0 && (
              <span className={styles.welcomeAboutBadge}>
                Lv {profileStats.level}
              </span>
            )}
            {profileStats.xp > 0 && (
              <span className={styles.welcomeAboutBadge}>
                {profileStats.xp.toLocaleString()} XP
              </span>
            )}
            {profileStats.streak > 0 && (
              <span className={`${styles.welcomeAboutBadge} ${styles.welcomeAboutStreak}`}>
                🔥 {profileStats.streak}d streak
              </span>
            )}
          </div>
          {(profileStats.courses_completed > 0 || profileStats.problems_solved > 0) && (
            <div className={styles.welcomeAboutRow}>
              {profileStats.courses_completed > 0 && (
                <span className={styles.welcomeAboutStat}>
                  {profileStats.courses_completed} course{profileStats.courses_completed !== 1 ? "s" : ""}
                </span>
              )}
              {profileStats.problems_solved > 0 && (
                <span className={styles.welcomeAboutStat}>
                  · {profileStats.problems_solved} problems solved
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.welcomeExampleLabel}>Try asking</div>
      <div className={styles.welcomeChips}>
        {examples.map((ex, i) => (
          <button
            key={i}
            type="button"
            className={styles.welcomeChip}
            onClick={() => onChipClick(ex)}
          >
            “{ex}”
          </button>
        ))}
      </div>
    </div>
  );
}

function welcomeExamples(section) {
  if (section === "code") {
    return [
      "Why is my code returning the wrong output?",
      "What's a more efficient approach?",
      "Explain the time complexity of my solution",
    ];
  }
  if (section === "research") {
    return [
      "Explain this paper in simple terms",
      "What's the key contribution?",
      "How does this compare to prior work?",
    ];
  }
  return [
    "Explain this concept with a simple example",
    "I don't understand why this works",
    "Can you quiz me on what I just read?",
  ];
}

function placeholderFor(section) {
  if (section === "code") return "Ask about your code or the problem...";
  if (section === "research") return "Ask about this paper...";
  return "Ask me anything about what you're learning...";
}

function prettySection(ctx) {
  if (ctx.section === "course") return "Courses";
  if (ctx.section === "code") return "Code";
  if (ctx.section === "research") return "Research";
  return "General";
}

function shortModel(model) {
  if (!model) return "";
  if (model.includes("haiku")) return "Haiku";
  if (model.includes("sonnet")) return "Sonnet";
  if (model.includes("opus")) return "Opus";
  return model.split("-").slice(-2).join(" ");
}
