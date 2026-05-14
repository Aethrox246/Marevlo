/**
 * MiraContextProvider.jsx — React context that tracks what section the user
 * is currently in and what payload to send with chat requests.
 *
 * Mount once at App level. Each page updates context via useMiraContext().
 *
 * Usage:
 *   // App.jsx
 *   <MiraContextProvider>
 *     <Routes>...</Routes>
 *     <MiraWidget />
 *   </MiraContextProvider>
 *
 *   // Courses.jsx
 *   const { setContext } = useMiraContext();
 *   useEffect(() => {
 *     setContext({ section: "course", course_id: id, module_id: modId });
 *   }, [id, modId]);
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const MiraCtx = createContext(null);

const DEFAULT_CONTEXT = {
  section: "general",
  course_id: null,
  module_id: null,
  section_id: null,
  context_payload: {},
};

export function MiraContextProvider({ children }) {
  const [ctx, setCtx] = useState(DEFAULT_CONTEXT);

  // Stable setter — shallow-merges new values
  const setContext = useCallback((partial) => {
    if (!partial) {
      setCtx(DEFAULT_CONTEXT);
      return;
    }
    setCtx((prev) => ({
      ...DEFAULT_CONTEXT,
      ...prev,
      ...partial,
      context_payload: {
        ...prev.context_payload,
        ...(partial.context_payload || {}),
      },
    }));
  }, []);

  const clearContext = useCallback(() => {
    setCtx(DEFAULT_CONTEXT);
  }, []);

  const value = useMemo(
    () => ({ context: ctx, setContext, clearContext }),
    [ctx, setContext, clearContext]
  );

  return <MiraCtx.Provider value={value}>{children}</MiraCtx.Provider>;
}

export function useMiraContext() {
  const v = useContext(MiraCtx);
  if (!v) {
    throw new Error("useMiraContext must be used inside <MiraContextProvider>");
  }
  return v;
}
