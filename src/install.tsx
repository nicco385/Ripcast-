import { useEffect, useState } from "react";
import { load, save } from "./ui";

// Chrome and Brave on Android fire "beforeinstallprompt"; we keep it and show our own small, dismissible card.
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
const subs = new Set<() => void>();
let visits = 0; // counted once per app open
if (typeof window !== "undefined") {
  visits = load<number>("rc-visits", 0) + 1; save("rc-visits", visits);
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIP; subs.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { save("rc-a2hs", "installed"); deferred = null; subs.forEach((f) => f()); });
}
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** "Add to home screen" card. Shown on the 2nd visit or later, never once dismissed or installed. */
export function InstallPrompt() {
  const [, tick] = useState(0);
  const [state, setState] = useState<string>(() => load("rc-a2hs", ""));
  const [help, setHelp] = useState(false);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  if (standalone() || state === "dismissed" || state === "installed" || visits < 2) return null;
  const close = () => { save("rc-a2hs", "dismissed"); setState("dismissed"); };
  const add = async () => {
    if (deferred) { await deferred.prompt(); const c = await deferred.userChoice.catch(() => ({ outcome: "" })); deferred = null; if (c.outcome === "accepted") { save("rc-a2hs", "installed"); setState("installed"); } }
    else setHelp(true);
  };
  return <section className="card a2hs">
    <div className="row"><b>📲 Put Choc's Spot on your home screen</b><button className="icon" onClick={close} aria-label="No thanks">✕</button></div>
    <p className="small">Opens like an app, full screen, and the tides and fish guides work without signal.</p>
    {help ? <p className="small">In Brave or Chrome: tap the <b>⋮</b> menu (top or bottom right), then <b>Add to Home screen</b> (or <b>Install app</b>).</p>
      : <button className="btn wide" onClick={add}>Add to home screen</button>}
    <button className="linkish small" onClick={close}>No thanks</button>
  </section>;
}
