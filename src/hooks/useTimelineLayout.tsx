import { useEffect, useRef, useState } from 'react';

const WIDTH = 1280;
const SCROLL_COMPENSATION = 1;

export function useTimelineLayout() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(WIDTH);

  const updateWidth = (width: number) => setContainerWidth(width);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    updateWidth(el.clientWidth - SCROLL_COMPENSATION);
    const ro = new ResizeObserver(() => updateWidth(el.clientWidth - SCROLL_COMPENSATION));
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);

  const effectiveContainerWidth = Math.max(0, containerWidth - SCROLL_COMPENSATION);

  return {
    scrollContainerRef,
    containerWidth,
    effectiveContainerWidth,
  };
}
