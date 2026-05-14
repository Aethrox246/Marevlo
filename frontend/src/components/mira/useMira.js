/**
 * useMira.js — React hooks for MIRA functionality.
 *
 * Provides:
 *   useMiraFeatureCheck()   → { enabled, isAdmin, loading, error }
 *   useMiraChat()           → { messages, sending, sendMessage, clearChat }
 *   useMiraProfile()        → { profile, loading, refresh }
 *   useMiraQuota()          → { quota, refresh }
 *   useMiraPreferences()    → { preferences, updatePreferences }
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { miraApi, MiraApiError } from "./miraApi";
import { useMiraContext } from "./MiraContextProvider";

/** Feature check — runs once on mount. */
export function useMiraFeatureCheck() {
  const [state, setState] = useState({
    enabled: false,
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await miraApi.featureCheck();
        if (!cancelled) {
          setState({
            enabled: !!r.enabled,
            isAdmin: !!r.is_admin,
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            enabled: false,
            isAdmin: false,
            loading: false,
            error: e instanceof MiraApiError ? e.message : String(e),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Chat state — maintains message list, current context is injected at send time. */
export function useMiraChat() {
  const { context } = useMiraContext();
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      setError(null);

      // Append user message immediately
      const userMsg = {
        role: "user",
        text: text.trim(),
        at: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      setSending(true);

      try {
        const result = await miraApi.chat({
          message: text.trim(),
          section: context.section || "general",
          course_id: context.course_id,
          module_id: context.module_id,
          section_id: context.section_id,
          context_payload: context.context_payload || {},
        });

        const mira = {
          role: "mira",
          text: result.response,
          matched_concepts: result.matched_concepts || [],
          depth: result.depth,
          style_used: result.style_used,
          blend_style: result.blend_style,
          model: result.model,
          cost_inr: result.cost_inr,
          quota_remaining: result.quota_remaining,
          rate_limited: result.rate_limited,
          domain_redirected: result.domain_redirected,
          context_pill: result.context_pill,
          at: Date.now(),
        };
        setMessages((m) => [...m, mira]);
      } catch (e) {
        const detail = e instanceof MiraApiError ? e.message : String(e);
        setMessages((m) => [
          ...m,
          { role: "system", text: `Error: ${detail}`, error: true, at: Date.now() },
        ]);
        setError(detail);
      } finally {
        setSending(false);
      }
    },
    [context]
  );

  const sendFeedback = useCallback(async ({ concept_id, style_used, understood }) => {
    try {
      return await miraApi.feedback({ concept_id, style_used, understood });
    } catch (e) {
      // Non-fatal — just log
      console.warn("[mira] feedback failed:", e);
      return null;
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sending, error, sendMessage, sendFeedback, clearChat };
}

/** Profile state — loads cognitive profile from backend. */
export function useMiraProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await miraApi.getProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof MiraApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, refresh };
}

/** Quota state. */
export function useMiraQuota() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const q = await miraApi.getQuota();
      setQuota(q);
    } catch (e) {
      console.warn("[mira] quota fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { quota, loading, refresh };
}

/** Preferences — code visibility toggle, etc. */
export function useMiraPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await miraApi.getPreferences();
      setPreferences(p);
    } catch (e) {
      console.warn("[mira] preferences fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updatePreferences = useCallback(
    async (updates) => {
      try {
        const updated = await miraApi.updatePreferences(updates);
        setPreferences(updated);
        return updated;
      } catch (e) {
        console.warn("[mira] preferences update failed:", e);
        throw e;
      }
    },
    []
  );

  return { preferences, loading, updatePreferences, refresh };
}
