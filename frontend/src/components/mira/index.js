/**
 * MIRA widget — barrel export.
 *
 * Usage in App.jsx:
 *   import { MiraContextProvider, MiraWidget } from "./components/mira";
 *
 *   function App() {
 *     return (
 *       <MiraContextProvider>
 *         <Routes>...</Routes>
 *         <MiraWidget />
 *       </MiraContextProvider>
 *     );
 *   }
 *
 * Usage in any page:
 *   import { useMiraContext } from "./components/mira";
 *
 *   const { setContext } = useMiraContext();
 *   useEffect(() => {
 *     setContext({ section: "course", course_id: id });
 *   }, [id]);
 */

export { default as MiraWidget } from "./MiraWidget";
export { MiraContextProvider, useMiraContext } from "./MiraContextProvider";
