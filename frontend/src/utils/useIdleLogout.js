import { useEffect, useRef } from "react";

const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

// Tinatawag ang onIdle kapag walang galaw sa loob ng `minutes`
export default function useIdleLogout(minutes, onIdle) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!minutes) return;

    const limitMs = minutes * 60 * 1000;
    let lastActive = Date.now();
    const mark = () => {
      lastActive = Date.now();
    };

    EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    // Nagche-check kada 10 segundo (gumagana rin kapag nag-sleep ang laptop)
    const timer = setInterval(() => {
      if (Date.now() - lastActive >= limitMs) {
        clearInterval(timer);
        onIdleRef.current();
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [minutes]);
}
