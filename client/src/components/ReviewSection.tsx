import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Edit2, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/WalletContext';

interface ReviewSectionProps {
  agentId: string;
  userWallet: string | null;
}

export function ReviewSection({ agentId, userWallet }: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signMessage } = useWalletContext();

  // Fetch reviews
  const { data: reviews = [], refetch } = trpc.reviews.getByAgent.useQuery({
    agentId,
    limit: 50,
  });

  const { data: averageRating } = trpc.reviews.getAverageRating.useQuery({ agentId });

  // Mutations
  const createReviewMutation = trpc.reviews.create.useMutation();
  const markHelpfulMutation = trpc.reviews.markHelpful.useMutation();

  const handleSubmitReview = async () => {
    if (!userWallet) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get message to sign from backend
      const message = `I am reviewing agent ${agentId} at ${new Date().toISOString()}`;
      const signature = await signMessage(message);

      await createReviewMutation.mutateAsync({
        agentId,
        userWallet,
        rating,
        comment,
        signature,
        message,
      });

      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await markHelpfulMutation.mutateAsync({ reviewId, helpful });
      refetch();
    } catch (error) {
      toast.error('Failed to mark review');
    }
  };

  const renderStars = (count: number, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            onClick={() => interactive && setRating(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              className={`${size} ${star <= (interactive ? (hoveredRating || rating) : count)
                ? 'fill-[#F1A70E] text-[#F1A70E]'
                : 'text-gray-600'
                }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Average Rating Summary */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#F1A70E]">
                {averageRating?.average.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {averageRating?.count || 0} reviews
              </div>
            </div>
            <div className="flex-1">
              {renderStars(Math.round(averageRating?.average || 0), false, 'w-6 h-6')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {userWallet && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your Rating</label>
              {renderStars(rating, true, 'w-8 h-8')}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 characters
              </div>
            </div>

            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting || rating === 0 || comment.length < 10}
              className="w-full bg-[#F1A70E] hover:bg-[#F5B83D] text-black font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">User Reviews</h3>
        {reviews.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No reviews yet. Be the first to review!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: any) => (
            <Card key={review.id} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-semibold">
                        {review.userWallet.slice(0, 6)}...{review.userWallet.slice(-4)}
                      </span>
                      {renderStars(review.rating, false, 'w-4 h-4')}
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  {review.userWallet === userWallet && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-gray-300 mb-4">{review.comment}</p>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => handleMarkHelpful(review.id, true)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful || 0}</span>
                  </button>
                  <button
                    onClick={() => handleMarkHelpful(review.id, false)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{review.notHelpful || 0}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
