import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button 
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full" 
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>

      {images.length > 1 && (
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/50 rounded-full"
          onClick={handlePrev}
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      <img 
        src={images[currentIndex]} 
        alt="Preview full view" 
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white bg-black/50 rounded-full"
          onClick={handleNext}
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-medium bg-black/50 px-4 py-1.5 rounded-full shadow-lg">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
