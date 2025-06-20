import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityItemProps {
  activity: {
    id: number;
    type: string;
    userId: string;
    raceId: number;
    rating?: number;
    review?: string;
    createdAt: string;
    user?: {
      id: string;
      username: string;
      profileImageUrl?: string;
    };
    race: {
      id: number;
      name: string;
      year: number;
      imageUrl?: string;
    };
  };
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const [, setLocation] = useLocation();

  const handleRaceClick = () => {
    setLocation(`/races/${activity.race.id}`);
  };

  const handleUserClick = () => {
    if (activity.user?.username) {
      setLocation(`/users/${activity.user.username}`);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <Card className="bg-card-dark border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <button
            onClick={handleUserClick}
            className="w-10 h-10 bg-racing-red rounded-full flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            {activity.user?.profileImageUrl ? (
              <img
                src={activity.user.profileImageUrl}
                alt={activity.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold">
                {activity.user?.username?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={handleUserClick}
                className="font-medium text-white hover:text-racing-red transition-colors"
              >
                {activity.user?.username || "Anonymous"}
              </button>
              <span className="text-gray-400">
                {activity.type === "rating" ? "watched and rated" : "reviewed"}
              </span>
              {activity.rating && (
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < activity.rating!
                          ? "text-yellow-400 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 mb-3">
              <button
                onClick={handleRaceClick}
                className="w-16 h-24 rounded object-cover hover:opacity-80 transition-opacity"
              >
                <img
                  src={activity.race.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"}
                  alt={activity.race.name}
                  className="w-full h-full rounded object-cover"
                />
              </button>
              <div>
                <button
                  onClick={handleRaceClick}
                  className="font-semibold text-white hover:text-racing-red transition-colors text-left"
                >
                  {activity.race.name}
                </button>
                <p className="text-sm text-gray-400">{activity.race.year}</p>
              </div>
            </div>
            {activity.review && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                "{activity.review}"
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{formatTimeAgo(activity.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
