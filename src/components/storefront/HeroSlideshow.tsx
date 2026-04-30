"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSlideshow } from "@/hooks/useSlideshow";

const slides = [
  {
    id: 1,
    title: "Premium Business Cards",
    subtitle: "Make a lasting first impression",
    description: "High-quality printing on premium card stock with multiple finishing options",
    image: "https://images.unsplash.com/photo-1718670014130-ee9ee053598d?w=1920&q=80",
  },
  {
    id: 2,
    title: "Custom Picture Frames",
    subtitle: "Frame your memories perfectly",
    description: "Premium quality frames in various sizes and finishes to showcase your photos and artwork",
    image: "https://images.unsplash.com/photo-1664206449850-fd63ae4f0ae3?w=1920&q=80",
  },
  {
    id: 3,
    title: "Custom Flyers & Brochures",
    subtitle: "Spread your message effectively",
    description: "Professional printing for marketing materials that get noticed",
    image: "https://images.unsplash.com/photo-1656379817721-774050a70dd0?w=1920&q=80",
  },
  {
    id: 4,
    title: "Photo Prints & Posters",
    subtitle: "Bring your memories to life",
    description: "Museum-quality prints on premium paper with vivid color reproduction",
    image: "https://images.unsplash.com/photo-1684741891614-c244b9df0613?w=1920&q=80",
  },
];

const SLIDES_LENGTH = slides.length;

export function HeroSlideshow() {
  // Use deep hook - hides timer management, cleanup, reset logic
  const { currentSlide, goToSlide, nextSlide, prevSlide } = useSlideshow(SLIDES_LENGTH, 5000);

  return (
    <section className="relative bg-[#0a0a0a] px-4 md:px-8 py-4 md:py-6" aria-label="Featured products">
      <div className="relative h-[400px] md:h-[600px] overflow-hidden bg-black rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem]" role="region" aria-roledescription="carousel" aria-label="Product showcase">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            role="tabpanel"
            aria-hidden={index !== currentSlide}
            aria-label={`Slide ${index + 1} of ${SLIDES_LENGTH}`}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 md:px-8">
              <div className="max-w-xl md:max-w-2xl text-white">
                <p className="mb-2 md:mb-4 text-xs md:text-sm font-semibold uppercase tracking-wider text-accent">
                  {slide.subtitle}
                </p>
                <h1 className="mb-4 md:mb-6 font-heading text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  {slide.title}
                </h1>
                <p className="mb-6 md:mb-8 text-sm md:text-lg text-white/80">
                  {slide.description}
                </p>
                <Link
                  href="/products/photo-prints"
                  className="inline-flex items-center justify-center gap-2 bg-accent px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-accent-foreground transition-all duration-200 hover:bg-accent/90 hover:shadow-lg min-w-[160px] md:min-w-[200px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
                >
                  <span className="truncate">Explore Products</span>
                  <span className="flex-shrink-0" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 lg:left-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 min-w-[44px] min-h-[44px] w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Previous slide"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 lg:right-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 min-w-[44px] min-h-[44px] w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Next slide"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slide navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                index === currentSlide ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? "true" : "false"}
              role="tab"
              aria-selected={index === currentSlide}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-200 ${
                  index === currentSlide
                    ? "w-8 bg-accent"
                    : "w-2 bg-white/60"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
