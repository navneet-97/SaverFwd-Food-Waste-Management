import React from 'react';
import { Card, CardContent } from './card';
import StarRating from './star-rating';
import { User, Clock } from 'lucide-react';

const RatingDisplay = ({ rating, showRecipient = true, showDate = true, className = '' }) => {
  if (!rating) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <StarRating rating={rating.rating} readonly size="sm" />
            <span className="text-sm font-medium text-gray-700">
              {rating.rating}/5
            </span>
          </div>
          
          {showDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatDate(rating.created_at)}</span>
            </div>
          )}
        </div>

        {showRecipient && rating.recipient_name && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {rating.recipient_name}
            </span>
          </div>
        )}

        {rating.food_title && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-medium">Food:</span> {rating.food_title}
          </div>
        )}

        {rating.feedback && (
          <div className="mt-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              "{rating.feedback}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RatingSummary = ({ summary, className = '' }) => {
  if (!summary || summary.total_ratings === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500">No ratings yet</p>
      </div>
    );
  }

  const { average_rating, total_ratings, rating_distribution } = summary;

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{average_rating}</div>
          <StarRating rating={Math.round(average_rating)} readonly size="sm" />
          <div className="text-xs text-gray-500 mt-1">{total_ratings} reviews</div>
        </div>
        
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = rating_distribution[stars.toString()] || 0;
            const percentage = total_ratings > 0 ? (count / total_ratings) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600 w-6">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { RatingDisplay, RatingSummary };
export default RatingDisplay;
