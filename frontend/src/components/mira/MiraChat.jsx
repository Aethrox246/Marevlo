/**
 * MiraChat.jsx — Message list + input for the MIRA widget.
 *
 * Renders user/MIRA messages with metadata pills, inline feedback buttons,
 * thinking indicator while waiting for response, quota hint, and
 * (on Code IDE) a toggle for code visibility.
 */

import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { MiraFeedback } from "./MiraFeedback";
import { useMiraChat, useMiraPreferences, useMiraQuota } from "./useMira";
import { useMiraContext } from "./MiraContextProvider";

export function MiraChat() {
  const { context } = useMiraContext();
  const { messages, sending, sendMessage, sendFeedback } = useMiraChat();
  const { preferences, updatePreferences } = useMiraPreferences();
  const { quota, refresh: refreshQuota } = useMiraQuota();
  const scrollRef = useRef(null);
  const [text, setText] = useState("");

  const isCodeSection = context.section === "code";
  const codeVisible = preferences?.code_visibility === "always_on";

  // Fetch quota on mount
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSubmit = async () => {
    const clean = text.trim();
    if (!clean || sending) return;
    setText("");
    await sendMessage(clean);
    refreshQuota();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleCodeVisibility = async (e) => {
    const newValue = e.target.checked ? "always_on" : "always_off";
    await updatePreferences({ code_visibility: newValue });
  };

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
          <WelcomeMessage section={context.section} />
        ) : (
          messages.map((msg, i) => (
            <MessageRow
              key={i}
              msg={msg}
              onFeedback={async (payload) => {
                const result = await sendFeedback(payload);
                return result;
              }}
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

        <div className={styles.inputRow}>
          <textarea
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholderFor(context.section)}
            disabled={sending}
            rows={1}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSubmit}
            disabled={sending || !text.trim()}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>

        {quota && (
          <div className={styles.quotaHint}>
            {quota.remaining} of {quota.limit} questions remaining this period
          </div>
        )}
      </div>
    </>
  );
}

function MessageRow({ msg, onFeedback }) {
  if (msg.role === "user") {
    return (
      <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>{msg.text}</div>
      </div>
    );
  }
  if (msg.role === "system") {
    return (
      <div className={`${styles.messageRow} ${styles.messageRowSystem}`}>
        <div className={`${styles.bubble} ${styles.bubbleSystem} ${msg.error ? styles.bubbleError : ""}`}>
          {msg.text}
        </div>
      </div>
    );
  }
  // MIRA message
  return (
    <div className={`${styles.messageRow} ${styles.messageRowMira}`}>
      <div className={`${styles.bubble} ${styles.bubbleMira}`}>{msg.text}</div>

      <div className={styles.metaRow}>
        {msg.depth && <span className={styles.metaPill}>{msg.depth}</span>}
        {msg.style_used && (
          <span className={styles.metaPill}>
            {msg.style_used}
            {msg.blend_style ? ` + ${msg.blend_style}` : ""}
          </span>
        )}
        {msg.model && (
          <span className={styles.metaPill}>{shortModel(msg.model)}</span>
        )}
        {typeof msg.cost_inr === "number" && (
          <span className={`${styles.metaPill} ${styles.metaPillCost}`}>
            ₹{msg.cost_inr.toFixed(2)}
          </span>
        )}
      </div>

      {msg.matched_concepts && msg.matched_concepts.length > 0 && (
        <MiraFeedback
          matchedConcepts={msg.matched_concepts}
          styleUsed={msg.style_used}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className={styles.messageRow + " " + styles.messageRowMira}>
      <div className={styles.thinking}>
        <div className={styles.thinkingDot}></div>
        <div className={styles.thinkingDot}></div>
        <div className={styles.thinkingDot}></div>
      </div>
    </div>
  );
}

function WelcomeMessage({ section }) {
  const examples = welcomeExamples(section);
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "16px 0",
      color: "#3d3d48",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Hi! I'm MIRA — your tutor.
      </div>
      <div style={{ fontSize: 13, color: "#75758a", marginBottom: 14 }}>
        Ask me anything about what you're learning. I adapt to how you think.
      </div>
      <div style={{ fontSize: 12, color: "#75758a", marginBottom: 4 }}>
        Try asking:
      </div>
      {examples.map((ex, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            color: "#3d3d48",
            padding: "4px 10px",
            background: "#f2f2f5",
            borderRadius: 8,
            marginTop: 6,
            fontStyle: "italic",
          }}
        >
          "{ex}"
        </div>
      ))}
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
