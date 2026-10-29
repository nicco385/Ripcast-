import { useCallback, useEffect, useRef, useState } from "react";

export type Tab = "today" | "where" | "fish" | "reports" | "more";
export type View =
  | { k: "spot"; id: string } | { k: "species"; slug: string } | { k: "tides" } | { k: "solunar" } | { k: "target"; slug?: string } | { k: "week" } | { k: "map"; focus?: string }
  | { k: "picker" } | { k: "calendar" } | { k: "log" } | { k: "rules" } | { k: "about" } | { k: "tips"; g?: string };
export type Nav = { tab: Tab; view: View | null; d: number };

const ROOT: Nav = { tab: "today", view: null, d: 0 };
/** Browser history wiring: every tab switch and detail view is a history entry, so the Android back gesture
 * and the browser Back button step back one screen instead of leaving the app. */
export function useNav() {
  const [nav, setNav] = useState<Nav>(() => { const s = history.state; return s && s.rc ? s.nav : ROOT; });
  useEffect(() => {
    if (!(history.state && history.state.rc)) history.replaceState({ rc: 1, nav }, "");
    const on = (e: PopStateEvent) => { setNav(e.state && e.state.rc ? e.state.nav : ROOT); window.scrollTo(0, 0); };
    addEventListener("popstate", on); return () => removeEventListener("popstate", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ref = useRef(nav); ref.current = nav;
  const push = useCallback((p: Partial<Pick<Nav, "tab" | "view">>) => {
    const cur = ref.current; const next: Nav = { tab: p.tab ?? cur.tab, view: p.view === undefined ? cur.view : p.view, d: cur.d + 1 };
    history.pushState({ rc: 1, nav: next }, ""); ref.current = next; setNav(next); window.scrollTo(0, 0);
  }, []);
  const back = useCallback(() => {
    if (history.state && history.state.rc && history.state.nav.d > 0) history.back();
    else { const n: Nav = { ...ROOT, tab: nav.tab }; history.replaceState({ rc: 1, nav: n }, ""); setNav(n); window.scrollTo(0, 0); }
  }, [nav.tab]);
  return { nav, push, back, go: (tab: Tab) => { if (tab === nav.tab && !nav.view) window.scrollTo({ top: 0, behavior: "smooth" }); else push({ tab, view: null }); } };
}
