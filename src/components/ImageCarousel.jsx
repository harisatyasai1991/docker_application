import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Instagram-style Image Carousel Component with Lightbox
 * Shows one image at a time with navigation arrows and dot indicators
 * Clicking an image opens a lightbox modal for full-size viewing
 */
export const ImageCarousel = ({ 
  images = [], 
  className = '',
  imageSize = 'w-32 h-32', // Tailwind size classes
  showDots = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const API_BASE = process.env.REACT_APP_BACKEND_URL || '';
  
  const getImageUrl = (img) => {
    return img.startsWith('http') ? img : `${API_BASE}${img}`;
  };

  const goToPrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const closeLightbox = (e) => {
    e.stopPropagation();
    setLightboxOpen(false);
  };

  // Handle keyboard navigation in lightbox
  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') {
      setLightboxOpen(false);
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  React.useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  // Single image - no carousel navigation needed
  if (images.length === 1) {
    return (
      <>
        <div className={`relative ${className}`}>
          <img
            src={getImageUrl(images[0])}
            alt="Reference"
            onClick={openLightbox}
            className={`${imageSize} object-cover rounded-lg border-2 border-blue-200 dark:border-blue-700 hover:border-primary hover:shadow-lg transition-all cursor-zoom-in`}
          />
        </div>

        {/* Lightbox Modal - Overlay style */}
        {lightboxOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeLightbox}
          >
            {/* Modal Container */}
            <div 
              className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-auto mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeLightbox}
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Main Image */}
              <div className="p-3">
                <img
                  src={getImageUrl(images[0])}
                  alt="Reference enlarged"
                  className="max-w-[65vw] max-h-[65vh] object-contain rounded-lg"
                />
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-center text-xs text-muted-foreground">
                Press ESC or click outside to close
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Multiple images - show carousel with navigation
  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main Image Container */}
        <div className="relative group">
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`Reference ${currentIndex + 1}`}
            onClick={openLightbox}
            className={`${imageSize} object-cover rounded-lg border-2 border-blue-200 dark:border-blue-700 hover:border-primary transition-all cursor-zoom-in`}
          />
          
          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Image Counter Badge */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {currentIndex + 1}/{images.length}
          </div>
        </div>

        {/* Dot Indicators */}
        {showDots && images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary w-3' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal - Overlay style for multiple images */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeLightbox}
        >
          {/* Modal Container */}
          <div 
            className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-auto mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeLightbox}
              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image Container with Navigation */}
            <div className="relative p-3">
              {/* Left Navigation Arrow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); goToPrevious(e); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Main Image */}
              <img
                src={getImageUrl(images[currentIndex])}
                alt={`Reference ${currentIndex + 1} enlarged`}
                className="max-w-[65vw] max-h-[60vh] object-contain rounded-lg mx-auto"
              />

              {/* Right Navigation Arrow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); goToNext(e); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Footer with Thumbnails */}
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800">
              {/* Thumbnail Strip */}
              <div className="flex justify-center gap-2 mb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                    className={`w-12 h-12 rounded overflow-hidden transition-all ${
                      index === currentIndex 
                        ? 'ring-2 ring-primary' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Image Counter */}
              <div className="text-center text-xs text-muted-foreground">
                {currentIndex + 1} of {images.length} • Press ESC or click outside to close
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;
