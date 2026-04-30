/**
 * Slideshow Hook Module
 * 
 * A deep module that handles slideshow timer and navigation logic.
 * Hides interval management, cleanup, and timer reset complexity.
 * 
 * Interface (what callers must know):
 * - useSlideshow(slideCount, interval) → { currentSlide, goToSlide, nextSlide, prevSlide }
 * 
 * Implementation (what's hidden):
 * - Interval creation and cleanup
 * - Timer reset on manual navigation
 * - Circular navigation logic
 * - useEffect dependencies
 * - Ref management
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Types (part of the interface)
// ============================================================================

export interface SlideshowControls {
  currentSlide: number;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
}

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Hook for managing slideshow state and navigation.
 * 
 * Automatically handles:
 * - Timer creation and cleanup
 * - Circular navigation (wraps around)
 * - Timer reset on manual navigation
 * - Pause/resume functionality
 * 
 * @param slideCount - Total number of slides
 * @param intervalMs - Time between auto-transitions in milliseconds (default: 5000)
 * @returns Slideshow controls
 */
export function useSlideshow(
  slideCount: number,
  intervalMs: number = 5000
): SlideshowControls {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Internal: Start or restart the timer
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slideCount);
      }, intervalMs);
    }
  }, [slideCount, intervalMs, isPaused]);

  // Internal: Stop the timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start timer on mount and when dependencies change
  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  // Public: Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    startTimer(); // Reset timer on manual navigation
  }, [startTimer]);

  // Public: Navigate to next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
    startTimer(); // Reset timer on manual navigation
  }, [slideCount, startTimer]);

  // Public: Navigate to previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    startTimer(); // Reset timer on manual navigation
  }, [slideCount, startTimer]);

  // Public: Pause auto-transition
  const pause = useCallback(() => {
    setIsPaused(true);
    stopTimer();
  }, [stopTimer]);

  // Public: Resume auto-transition
  const resume = useCallback(() => {
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  return {
    currentSlide,
    goToSlide,
    nextSlide,
    prevSlide,
    pause,
    resume,
    isPaused,
  };
}
