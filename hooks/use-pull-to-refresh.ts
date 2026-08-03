"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 72;
const PULL_MAX = 120;

type Options = {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
};

export function usePullToRefresh({ onRefresh, enabled = true }: Options) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (!enabled) return;

    function isScrollAtTop() {
      return (window.scrollY || document.documentElement.scrollTop) <= 0;
    }

    function onTouchStart(event: TouchEvent) {
      if (refreshingRef.current || !isScrollAtTop()) {
        pullingRef.current = false;
        return;
      }
      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
      distanceRef.current = 0;
    }

    function onTouchMove(event: TouchEvent) {
      if (!pullingRef.current || refreshingRef.current) return;
      if (!isScrollAtTop()) {
        pullingRef.current = false;
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      const next = Math.min(delta * 0.45, PULL_MAX);
      distanceRef.current = next;
      setPullDistance(next);

      if (next > 8 && event.cancelable) {
        event.preventDefault();
      }
    }

    async function onTouchEnd() {
      if (!pullingRef.current) return;
      pullingRef.current = false;

      const distance = distanceRef.current;
      if (distance < PULL_THRESHOLD || refreshingRef.current) {
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefreshRef.current();
      } finally {
        setRefreshing(false);
        distanceRef.current = 0;
        setPullDistance(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const ready = pullDistance >= PULL_THRESHOLD;

  const reset = useCallback(() => {
    distanceRef.current = 0;
    setPullDistance(0);
    setRefreshing(false);
  }, []);

  return { pullDistance, refreshing, progress, ready, reset };
}
