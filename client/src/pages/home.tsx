import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Eye, Users, Trophy, TrendingUp, Clock, Heart, Calendar } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import RaceCard from "@/components/ui/race-card";
import ActivityItem from "@/components/ui/activity-item";

export default function Home() {
  const { user } = useAuth();

  const { data: recentRaces, isLoading: racesLoading } = useQuery({
    queryKey: ["/api/races/recent"],
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/activity/feed"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-deep-dark">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to boxboxd</h1>
            <p className="text-xl text-gray-400 mb-8">
              The social platform for Formula 1 racing enthusiasts
            </p>
            <p className="text-gray-400 mb-8">
              Rate races, create lists, and connect with fellow F1 fans
            </p>
            <Button size="lg" className="bg-racing-red hover:bg-red-700">
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-dark">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.username}
          </h1>
          <p className="text-gray-400">
            Discover and review the latest Formula 1 races
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="space-y-4">
                    {activity.slice(0, 10).map((item: any) => (
                      <ActivityItem key={`${item.id}-${item.type}`} activity={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No recent activity</p>
                    <p className="text-gray-500 text-sm">
                      Start following users and reviewing races to see activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Races */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Races
                </CardTitle>
              </CardHeader>
              <CardContent>
                {racesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : recentRaces && recentRaces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentRaces.slice(0, 6).map((race: any) => (
                      <RaceCard key={race.id} race={race} compact />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent races found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                  onClick={() => window.location.href = '/races'}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Browse All Races
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                  onClick={() => window.location.href = `/profile/${user.username}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View My Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                  onClick={() => window.location.href = `/profile/${user.username}?tab=to-watch`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  My To Watch List
                </Button>
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Races</span>
                    <span className="text-white font-medium">500+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Users</span>
                    <span className="text-white font-medium">10K+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Reviews</span>
                    <span className="text-white font-medium">50K+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Circuit */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Circuit Spotlight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h4 className="text-white font-medium mb-2">Monaco Circuit</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    The most prestigious street circuit in Formula 1
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700"
                    onClick={() => window.location.href = '/circuits/monaco'}
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}