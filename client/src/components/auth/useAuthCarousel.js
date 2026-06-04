import { useState, useEffect, useRef } from "react";

export function useAuthCarousel(featureCount) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let stayTimer = null;
    let exitTimer = null;

    stayTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (isMountedRef.current) setIsExiting(true);

      exitTimer = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (isMountedRef.current) {
          setCurrentSlide((prev) => (prev + 1) % featureCount);
          setIsExiting(false);
        }
      }, 2000);
    }, 3500);

    return () => {
      if (stayTimer) clearTimeout(stayTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [currentSlide, featureCount]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsExiting(false);
  };

  return { currentSlide, isExiting, goToSlide };
}
