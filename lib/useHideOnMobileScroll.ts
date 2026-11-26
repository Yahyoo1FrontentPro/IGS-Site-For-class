"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns true when the user is scrolling down past the top threshold on mobile screens,
 * so sticky headers can smoothly slide out of view (-translate-y-full md:translate-y-0)
 * and reappear immediately when scrolling back up.
 */
export function useHideOnMobileScroll(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Always show header near the very top of the page
      if (currentY < 48) {
        setHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      // Ignore tiny touch jitter (< 6px)
      if (Math.abs(delta) < 6) {
        return;
      }

      if (delta > 0 && currentY > 72) {
        setHidden(true);
      } else if (delta < 0) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return hidden;
}
