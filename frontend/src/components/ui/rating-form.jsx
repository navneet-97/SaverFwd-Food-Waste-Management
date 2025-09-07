import React, { useState } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Label } from './label';
import StarRating from './star-rating';
import { toast } from 'sonner';

const RatingForm = ({ 
  order, 
  onSubmit, 
  onCancel, 
  loading = false,
  initialRating = null 
}) => {
  const [rating, setRating] = useState(initialRating?.rating || 0);
  const [feedback, setFeedback] = useState(initialRating?.feedback || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ rating, feedback });
      toast.success(initialRating ? 'Rating updated successfully!' : 'Rating submitted successfully!', { duration: 2000 });
      // Reset form if creating new rating
      if (!initialRating) {
        setRating(0);
        setFeedback('');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {initialRating ? 'Update Your Rating' : 'Rate Your Experience'}
        </h3>
        {order && (
          <p className="text-sm text-gray-600">
            Order: <span className="font-medium">{order.food_title || 'Food Item'}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Your Rating *
          </Label>
          <StarRating 
            rating={rating}
            onRatingChange={setRating}
            size="lg"
          />
        </div>

        <div>
          <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
            Feedback (Optional)
          </Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience with the food quality, pickup process, or donor interaction..."
            className="mt-1"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {feedback.length}/1000 characters
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting || loading || rating === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? 'Submitting...' : initialRating ? 'Update Rating' : 'Submit Rating'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting || loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RatingForm;
