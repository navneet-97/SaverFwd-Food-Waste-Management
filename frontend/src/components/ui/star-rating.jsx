import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = 'sm',
  showCount = false,
  count = 0
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };
  
  const starClass = sizeClasses[size] || sizeClasses.sm;

  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue) => {
    if (!readonly) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClass} ${
              readonly ? 'cursor-default' : 'cursor-pointer'
            } transition-colors duration-150 ${
              star <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            } ${!readonly && 'hover:scale-110'}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
      
      {showCount && (
        <span className="text-sm text-gray-600 ml-1">
          ({count})
        </span>
      )}
      
      {!readonly && !showCount && (
        <span className="text-sm text-gray-600 ml-1">
          {displayRating > 0 ? `${displayRating} star${displayRating !== 1 ? 's' : ''}` : 'Click to rate'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
