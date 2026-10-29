import React, { useState } from 'react';
import { X, Star, Heart, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReviewModal: React.FC = () => {
  const { reviewModalData, closeReviewModal, submitReview } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!reviewModalData) return null;

  const { item, order } = reviewModalData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await submitReview(rating, feedback);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Food Quality Feedback
            </span>
            <h3 className="text-base font-bold text-stone-900">
              Rate Your Meal Experience
            </h3>
          </div>
          <button
            onClick={closeReviewModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
              {item.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-stone-900">{item.name}</div>
              <div className="text-[11px] text-stone-400 font-mono">From Order #{order.orderNumber}</div>
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="space-y-1.5 text-center">
            <div className="text-xs font-semibold text-stone-600">How was the taste and temperature?</div>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-amber-700">
              {rating === 5 && 'Outstanding! Fresh & Delicious'}
              {rating === 4 && 'Very Good, enjoyed it'}
              {rating === 3 && 'Average taste'}
              {rating === 2 && 'Needs improvement'}
              {rating === 1 && 'Disappointing'}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              Comments for Canteen Chef (Optional):
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Was it served hot? How was the seasoning or packaging? Any suggestions for tomorrow's batch?"
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeReviewModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
