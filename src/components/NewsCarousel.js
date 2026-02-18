'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * NewsCarousel Component
 * Fetches and displays latest news in a carousel/slider format
 */
export default function NewsCarousel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Number of visible cards at once
  const visibleCards = 3;

  // Fetch news articles
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/news/headlines`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        if (data.success && data.data?.articles) {
          // Take first 9 articles for the carousel
          setArticles(data.data.articles.slice(0, 9));
        } else {
          throw new Error('No articles found');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message);
        // Set fallback sample articles
        setArticles(getSampleArticles());
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || articles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, articles.length - visibleCards);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, articles.length]);

  const goToNext = useCallback(() => {
    const maxIndex = Math.max(0, articles.length - visibleCards);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [articles.length]);

  const goToPrev = useCallback(() => {
    const maxIndex = Math.max(0, articles.length - visibleCards);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [articles.length]);

  // Format date to relative time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Truncate text
  const truncate = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Sample articles fallback with placeholder images
  const getSampleArticles = () => [
    {
      title: 'AI Revolution Transforms Global Industries',
      description: 'Artificial intelligence continues to reshape how businesses operate across every sector.',
      source: { name: 'Tech News' },
      publishedAt: new Date().toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
      url: '#',
    },
    {
      title: 'Climate Summit Reaches Historic Agreement',
      description: 'World leaders commit to ambitious carbon reduction targets in landmark deal.',
      source: { name: 'World Report' },
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400&h=250&fit=crop',
      url: '#',
    },
    {
      title: 'Markets Rally on Economic Optimism',
      description: 'Global stock markets surge as investors respond to positive economic indicators.',
      source: { name: 'Finance Daily' },
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
      url: '#',
    },
    {
      title: 'Breakthrough in Quantum Computing',
      description: 'Scientists achieve new milestone in quantum computing stability and scalability.',
      source: { name: 'Science Weekly' },
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
      url: '#',
    },
    {
      title: 'Healthcare Innovation Saves Lives',
      description: 'New medical technologies are improving patient outcomes worldwide.',
      source: { name: 'Health News' },
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
      url: '#',
    },
    {
      title: 'Space Exploration Enters New Era',
      description: 'Private and public partnerships accelerate humanity\'s reach into the cosmos.',
      source: { name: 'Space Report' },
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      urlToImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=250&fit=crop',
      url: '#',
    },
  ];

  if (loading) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#111111] sm:text-4xl">
              Latest News Around the World
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#4A4A4A]">
              See how NewsAgent delivers curated news in real-time.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[#E5E7EB] bg-white p-5">
                <div className="mb-4 h-40 rounded-lg bg-[#F8F9FA]" />
                <div className="mb-2 h-4 w-20 rounded bg-[#F8F9FA]" />
                <div className="mb-2 h-6 rounded bg-[#F8F9FA]" />
                <div className="h-4 w-3/4 rounded bg-[#F8F9FA]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F8F9FA] px-3 py-1 text-xs font-medium text-[#4A4A4A]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              LIVE FEED
            </div>
            <h2 className="text-3xl font-bold text-[#111111] sm:text-4xl">
              Latest News Around the World
            </h2>
            <p className="mt-2 text-lg text-[#4A4A4A]">
              See how NewsAgent delivers curated news in real-time.
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#4A4A4A] transition-all hover:border-[#111111] hover:text-[#111111]"
              aria-label="Previous"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#4A4A4A] transition-all hover:border-[#111111] hover:text-[#111111]"
              aria-label="Next"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div 
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCards + 2)}%)` }}
          >
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.url || '#'}
                target={article.url && article.url !== '#' ? '_blank' : undefined}
                rel={article.url && article.url !== '#' ? 'noopener noreferrer' : undefined}
                className="group w-full shrink-0 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <article className="h-full rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-300 hover:border-[#111111]/20 hover:shadow-xl hover:shadow-black/5">
                  {/* Image */}
                  <div className="relative mb-4 h-40 overflow-hidden rounded-lg bg-[#F8F9FA]">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title || 'News image'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    )}
                    <div 
                      className="image-placeholder absolute inset-0 items-center justify-center bg-gradient-to-br from-[#111111] to-[#4A4A4A]"
                      style={{ display: article.urlToImage ? 'none' : 'flex' }}
                    >
                      <svg className="h-12 w-12 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    
                    {/* Source badge */}
                    <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs font-medium text-[#111111] backdrop-blur">
                      {article.source?.name || 'News'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col">
                    <time className="mb-2 text-xs text-[#6B7280]">
                      {formatDate(article.publishedAt)}
                    </time>
                    <h3 className="mb-2 line-clamp-2 text-base font-semibold text-[#111111] transition-colors group-hover:text-[#4A4A4A]">
                      {truncate(article.title, 80)}
                    </h3>
                    <p className="line-clamp-2 text-sm text-[#6B7280]">
                      {truncate(article.description, 100)}
                    </p>
                  </div>

                  {/* Read more */}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#111111] opacity-0 transition-opacity group-hover:opacity-100">
                    Read article
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </article>
              </a>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: Math.max(1, articles.length - visibleCards + 1) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex 
                  ? 'w-6 bg-[#111111]' 
                  : 'w-2 bg-[#E5E7EB] hover:bg-[#D1D5DB]'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#000000]"
          >
            Get Your Personalized Feed
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-2 text-sm text-[#6B7280]">
            {error ? 'Sample preview • ' : ''}Powered by News API • 80,000+ sources
          </p>
        </div>
      </div>
    </section>
  );
}
