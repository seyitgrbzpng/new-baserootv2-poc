import { trpc } from '@/lib/trpc';
import { Star, User, MessageSquare, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ReviewsSectionProps {
  agentId: string;
  currentUserWallet?: string | null;
  onEdit?: (review: any) => void;
}

export function ReviewsSection({ agentId, currentUserWallet, onEdit }: ReviewsSectionProps) {
  const { data: reviews, isLoading } = trpc.reviews.getByAgent.useQuery({ agentId });

  if (isLoading) {
    return (
      <div className="text-center text-gray-400 py-4">
        Loading reviews...
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6 bg-black/30 rounded-xl">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No reviews yet. Be the first to review this agent!</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-[#F1A70E] text-[#F1A70E]' : 'text-gray-600'
              }`}
          />
        ))}
      </div>
    );
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <h4 className="text-[#F1A70E] font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Community Reviews
        </h4>
        <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </Badge>
      </div>

      <ScrollArea className="h-[200px] pr-3 -mr-3">
        <div className="space-y-3 pt-1">
          {reviews.map((review: any, idx: number) => (
            <div
              key={review.id || idx}
              className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-800 rounded-lg p-3 transition-all duration-200"
            >
              <div className="flex justify-between items-start gap-3">
                {/* User Info */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-400 group-hover:text-[#F1A70E] transition-colors" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-200 font-medium text-xs truncate">
                        {truncateAddress(review.userWallet)}
                      </p>
                      <span className="text-[10px] text-gray-600">•</span>
                      <p className="text-[10px] text-gray-500">
                        {new Date(review.createdAt._seconds * 1000).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Edit Button */}
                {currentUserWallet === review.userWallet && onEdit && (
                  <button
                    onClick={() => onEdit(review)}
                    className="p-1.5 rounded-md hover:bg-gray-700 text-gray-500 hover:text-[#F1A70E] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-gray-400 text-xs mt-2 pl-[42px] leading-relaxed line-clamp-3 group-hover:text-gray-300 transition-colors">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}


