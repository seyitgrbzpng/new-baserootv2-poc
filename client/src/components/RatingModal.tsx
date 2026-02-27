import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  initialRating?: number;
  initialComment?: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function RatingModal({
  open,
  onOpenChange,
  agentName,
  initialRating = 0,
  initialComment = '',
  onSubmit
}: RatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when initial props change (e.g. when opening for a new edit)
  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      onOpenChange(false);
    } catch (error) {
      console.error('Rating submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription className="text-gray-400">
            How was your experience with <span className="text-[#F1A70E] font-semibold">{agentName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${star <= (hoveredRating || rating)
                        ? 'fill-[#F1A70E] text-[#F1A70E]'
                        : 'text-gray-600'
                      }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-400">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Share your experience (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this agent..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-[#F1A70E] hover:bg-[#F1A70E]/90 text-black font-semibold"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
