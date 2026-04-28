"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    title: "Premium Business Cards",
    subtitle: "Make a lasting first impression",
    description: "High-quality printing on premium card stock with multiple finishing options",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1920&q=80",
    cta: "Shop Business Cards",
    link: "/products/business-cards",
  },
  {
    id: 2,
    title: "Large Format Banners",
    subtitle: "Stand out from the crowd",
    description: "Vibrant colors and weather-resistant materials for indoor and outdoor use",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80",
    cta: "Explore Banners",
    link: "/products/banners",
  },
  {
    id: 3,
    title: "Custom Flyers & Brochures",
    subtitle: "Spread your message effectively",
    description: "Professional printing for marketing materials that get noticed",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1920&q=80",
    cta: "View Flyers",
    link: "/products/flyers-brochures",
  },
  {
    id: 4,
    title: "Photo Prints & Posters",
    subtitle: "Bring your memories to life",
    description: "Museum-quality prints on premium paper with vivid color reproduction",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1920&q=80",
    cta: "Order Prints",
    link: "/products/photo-prints",
  },
];

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[400px] md:h-[600px] overflow-hidden bg-black">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
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
                href={slide.link}
                className="inline-flex items-center gap-2 bg-accent px-6 md:px-8 py-3 md:py-4 text-xs md:text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-lg"
              >
                {slide.cta}
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 lg:left-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 md:p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Previous slide"
      >
        <svg className="h-4 w-4 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 lg:right-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 md:p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Next slide"
      >
        <svg className="h-4 w-4 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 md:h-2 rounded-full transition-all ${
              index === currentSlide
                ? "w-6 md:w-8 bg-accent"
                : "w-1.5 md:w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
