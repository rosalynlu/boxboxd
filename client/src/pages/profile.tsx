import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Users, Eye, Heart, List, Plus, Edit, ExternalLink, UserPlus, UserMinus, MoreVertical, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import RaceCard from "@/components/ui/race-card";
import ActivityItem from "@/components/ui/activity-item";

const F1_TEAMS = [
  "Red Bull Racing", "Ferrari", "Mercedes", "McLaren", "Aston Martin",
  "Alpine", "Williams", "AlphaTauri", "Alfa Romeo", "Haas"
];

const F1_DRIVERS_2025 = [
  "Max Verstappen", "Sergio Pérez", "Charles Leclerc", "Carlos Sainz Jr.",
  "Lewis Hamilton", "George Russell", "Lando Norris", "Oscar Piastri",
  "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Pierre Gasly",
  "Alex Albon", "Logan Sargeant", "Yuki Tsunoda", "Daniel Ricciardo",
  "Valtteri Bottas", "Zhou Guanyu", "Kevin Magnussen", "Nico Hülkenberg"
];

export default function Profile() {
  const { username: profileUsername } = useParams();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const activeTab = searchParams.get('tab') || 'favorites';
  
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);

  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${profileUsername}`],
    enabled: !!profileUsername,
  });

  const { data: userStats } = useQuery({
    queryKey: [`/api/users/${profileUsername}/stats`],
    enabled: !!profileUsername,
  });

  const { data: isFollowing } = useQuery({
    queryKey: [`/api/users/${profileUsername}/following`],
    enabled: !!currentUser && !!profileUsername && currentUser.username !== profileUsername,
  });

  const { data: userFavorites } = useQuery({
    queryKey: [`/api/users/${profileUsername}/favorites`],
    enabled: !!profileUsername && activeTab === 'favorites',
  });

  const { data: userActivity } = useQuery({
    queryKey: [`/api/users/${profileUsername}/activity`],
    enabled: !!profileUsername && activeTab === 'activity',
  });

  const { data: userReviews } = useQuery({
    queryKey: [`/api/users/${profileUsername}/ratings`],
    enabled: !!profileUsername && activeTab === 'reviews',
  });

  const { data: userLists } = useQuery({
    queryKey: [`/api/users/${profileUsername}/lists`],
    enabled: !!profileUsername && activeTab === 'lists',
  });

  const { data: userWatchlist } = useQuery({
    queryKey: [`/api/users/${profileUsername}/watchlist`],
    enabled: !!profileUsername && activeTab === 'to-watch',
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest(`/api/users/${profileUsername}/unfollow`, { method: "POST" });
      } else {
        await apiRequest(`/api/users/${profileUsername}/follow`, { method: "POST" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/stats`] });
      toast({
        title: "Success",
        description: isFollowing ? "Unfollowed user" : "Now following user",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest(`/api/auth/user`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("/api/lists", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/lists`] });
      setShowCreateListDialog(false);
      toast({
        title: "Success",
        description: "List created successfully",
      });
    },
  });

  const reorderFavoritesMutation = useMutation({
    mutationFn: async (raceIds: number[]) => {
      await apiRequest(`/api/users/${profileUsername}/favorites/reorder`, {
        method: "POST",
        body: JSON.stringify({ raceIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/favorites`] });
    },
  });

  const moveRaceUp = (index: number) => {
    if (index === 0 || !userFavorites) return;
    const items = [...userFavorites];
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    const raceIds = items.map((race: any) => race.id);
    reorderFavoritesMutation.mutate(raceIds);
  };

  const moveRaceDown = (index: number) => {
    if (!userFavorites || index === userFavorites.length - 1) return;
    const items = [...userFavorites];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    const raceIds = items.map((race: any) => race.id);
    reorderFavoritesMutation.mutate(raceIds);
  };

  const isOwnProfile = currentUser && profileUser && currentUser.username === profileUser.username;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-deep-dark">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-deep-dark">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card-dark border-gray-700">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
              <p className="text-gray-400">The user you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-dark">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card-dark border-gray-700">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={profileUser.profileImageUrl || ""} />
                    <AvatarFallback className="bg-gray-600 text-white text-lg">
                      {profileUser.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {profileUser.username || "Unknown User"}
                  </h1>
                  
                  {/* Team and Driver Icons */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {profileUser.favoriteTeam && (
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        🏎️ {profileUser.favoriteTeam}
                      </Badge>
                    )}
                    {profileUser.favoriteDriver && (
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        🏁 {profileUser.favoriteDriver}
                      </Badge>
                    )}
                  </div>

                  {/* Stats Inline */}
                  <div className="flex justify-center gap-4 text-sm text-gray-400 mb-4">
                    <span>{userStats?._count?.ratings || 0} reviewed</span>
                    <span>{userStats?._count?.watchlist || 0} watched</span>
                    <span>{userStats?._count?.followers || 0} followers</span>
                    <span>{userStats?._count?.following || 0} following</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {isOwnProfile ? (
                      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card-dark border-gray-700 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Profile</DialogTitle>
                          </DialogHeader>
                          <EditProfileForm
                            user={profileUser}
                            onSubmit={(data) => updateProfileMutation.mutate(data)}
                            isLoading={updateProfileMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    ) : currentUser ? (
                      <Button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        className={isFollowing ? "bg-gray-600 hover:bg-gray-700" : "bg-racing-red hover:bg-red-700"}
                      >
                        {isFollowing ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Bio */}
                {profileUser.bio && (
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm">{profileUser.bio}</p>
                  </div>
                )}

                {/* Website */}
                {profileUser.website && (
                  <div className="mb-4">
                    <a 
                      href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-card-dark border-gray-700">
                <TabsTrigger 
                  value="favorites" 
                  className="data-[state=active]:bg-racing-red"
                  onClick={() => window.history.pushState({}, '', `?tab=favorites`)}
                >
                  Favorites
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="data-[state=active]:bg-racing-red"
                  onClick={() => window.history.pushState({}, '', `?tab=activity`)}
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:bg-racing-red"
                  onClick={() => window.history.pushState({}, '', `?tab=reviews`)}
                >
                  Reviews
                </TabsTrigger>
                <TabsTrigger 
                  value="lists" 
                  className="data-[state=active]:bg-racing-red"
                  onClick={() => window.history.pushState({}, '', `?tab=lists`)}
                >
                  Lists
                </TabsTrigger>
                <TabsTrigger 
                  value="to-watch" 
                  className="data-[state=active]:bg-racing-red"
                  onClick={() => window.history.pushState({}, '', `?tab=to-watch`)}
                >
                  To Watch
                </TabsTrigger>
              </TabsList>

              <TabsContent value="favorites" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Favorite Races</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userFavorites && userFavorites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userFavorites.map((race: any, index: number) => (
                          <div key={race.id} className="relative">
                            {isOwnProfile && (
                              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => moveRaceUp(index)}
                                  disabled={index === 0}
                                  className="p-1 h-6 w-6 bg-black bg-opacity-50 hover:bg-opacity-75"
                                >
                                  <ArrowUp className="w-3 h-3 text-white" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => moveRaceDown(index)}
                                  disabled={index === userFavorites.length - 1}
                                  className="p-1 h-6 w-6 bg-black bg-opacity-50 hover:bg-opacity-75"
                                >
                                  <ArrowDown className="w-3 h-3 text-white" />
                                </Button>
                              </div>
                            )}
                            <RaceCard race={race} compact />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No favorite races yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userActivity && userActivity.length > 0 ? (
                      <div className="space-y-4">
                        {userActivity.map((activity: any) => (
                          <ActivityItem key={`${activity.id}-${activity.type}`} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userReviews && userReviews.length > 0 ? (
                      <div className="space-y-4">
                        {userReviews.map((review: any) => (
                          <div key={review.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-white">{review.race?.name}</h4>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < Math.floor(review.rating / 2) 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-600'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-sm text-gray-400 ml-1">
                                      {(review.rating / 2).toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                {review.review && (
                                  <p className="text-gray-300 mb-2">{review.review}</p>
                                )}
                                <p className="text-gray-500 text-sm">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {review.race?.imageUrl && (
                                <img 
                                  src={review.race.imageUrl} 
                                  alt={review.race.name}
                                  className="w-16 h-16 rounded object-cover"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No reviews yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lists" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Lists</CardTitle>
                    {isOwnProfile && (
                      <Dialog open={showCreateListDialog} onOpenChange={setShowCreateListDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-racing-red hover:bg-red-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create List
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card-dark border-gray-700 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-white">Create New List</DialogTitle>
                          </DialogHeader>
                          <CreateListForm 
                            onSubmit={(data) => createListMutation.mutate(data)}
                            isLoading={createListMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    {userLists && userLists.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userLists.map((list: any) => (
                          <div key={list.id} className="border border-gray-700 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-2">{list.name}</h4>
                            {list.description && (
                              <p className="text-gray-400 text-sm mb-2">{list.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{list.raceCount || 0} races</span>
                              <span>{list.isPublic ? 'Public' : 'Private'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No lists created yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="to-watch" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">To Watch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userWatchlist && userWatchlist.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userWatchlist.map((race: any) => (
                          <RaceCard key={race.id} race={race} compact />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No races in watchlist</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileForm({ user, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    bio: user.bio || "",
    website: user.website || "",
    favoriteTeam: user.favoriteTeam || "",
    favoriteDriver: user.favoriteDriver || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username" className="text-white">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="bg-deep-dark border-gray-600 text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="bio" className="text-white">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="bg-deep-dark border-gray-600 text-white"
          placeholder="Tell us about yourself..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="website" className="text-white">Website</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="bg-deep-dark border-gray-600 text-white"
          placeholder="https://example.com"
        />
      </div>

      <div>
        <Label htmlFor="favoriteTeam" className="text-white">Favorite Team</Label>
        <Select value={formData.favoriteTeam} onValueChange={(value) => setFormData({ ...formData, favoriteTeam: value })}>
          <SelectTrigger className="bg-deep-dark border-gray-600 text-white">
            <SelectValue placeholder="Select your favorite team" />
          </SelectTrigger>
          <SelectContent className="bg-deep-dark border-gray-600">
            {F1_TEAMS.map((team) => (
              <SelectItem key={team} value={team} className="text-white">{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="favoriteDriver" className="text-white">Favorite Driver</Label>
        <Select value={formData.favoriteDriver} onValueChange={(value) => setFormData({ ...formData, favoriteDriver: value })}>
          <SelectTrigger className="bg-deep-dark border-gray-600 text-white">
            <SelectValue placeholder="Select your favorite driver" />
          </SelectTrigger>
          <SelectContent className="bg-deep-dark border-gray-600">
            {F1_DRIVERS_2025.map((driver) => (
              <SelectItem key={driver} value={driver} className="text-white">{driver}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-racing-red hover:bg-red-700">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function CreateListForm({ onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="listName" className="text-white">List Name</Label>
        <Input
          id="listName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-deep-dark border-gray-600 text-white"
          placeholder="My Favorite Races"
          required
        />
      </div>

      <div>
        <Label htmlFor="listDescription" className="text-white">Description</Label>
        <Textarea
          id="listDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-deep-dark border-gray-600 text-white"
          placeholder="A collection of my favorite Formula 1 races..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
        />
        <Label htmlFor="isPublic" className="text-white">
          Make this list public
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-racing-red hover:bg-red-700">
          {isLoading ? "Creating..." : "Create List"}
        </Button>
      </div>
    </form>
  );
}