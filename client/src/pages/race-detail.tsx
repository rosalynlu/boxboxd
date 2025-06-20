import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Calendar, MapPin, Heart, Bookmark, MessageSquare, Trophy, Users, Flag, Eye, EyeOff, List, Plus, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import RaceCard from "@/components/ui/race-card";

// Half-star rating component
function StarRating({ rating, onRatingChange, readonly = false }: { rating: number, onRatingChange?: (rating: number) => void, readonly?: boolean }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleClick = (value: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(value);
  };

  const handleMouseEnter = (value: number) => {
    if (readonly) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = (i + 1) * 2; // Full star values: 2, 4, 6, 8, 10
        const halfStarValue = starValue - 1; // Half star values: 1, 3, 5, 7, 9
        
        return (
          <div key={i} className="relative cursor-pointer">
            <Star 
              className={`w-6 h-6 ${displayRating >= starValue ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
            />
            {/* Half star overlay */}
            <div 
              className="absolute inset-0 w-1/2 overflow-hidden cursor-pointer"
              onClick={() => handleClick(halfStarValue)}
              onMouseEnter={() => handleMouseEnter(halfStarValue)}
              onMouseLeave={handleMouseLeave}
            >
              <Star 
                className={`w-6 h-6 ${displayRating >= halfStarValue ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
              />
            </div>
          </div>
        );
      })}
      <span className="text-sm text-gray-400 ml-2">{(displayRating / 2).toFixed(1)}/5</span>
    </div>
  );
}

export default function RaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [watched, setWatched] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const { data: race, isLoading } = useQuery({
    queryKey: [`/api/races/${id}`],
  });

  const { data: userLists } = useQuery({
    queryKey: ["/api/lists/user"],
    enabled: !!user,
  });

  const { data: similarRaces } = useQuery({
    queryKey: [`/api/races/${id}/similar`],
  });

  const submitRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string; watched: boolean }) => {
      await apiRequest(`/api/races/${id}/ratings`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/races/${id}`] });
      setShowReviewDialog(false);
      setRating(0);
      setReview("");
      setWatched(false);
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string; watched: boolean }) => {
      await apiRequest(`/api/races/${id}/ratings/${editingReview.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/races/${id}`] });
      setEditingReview(null);
      setRating(0);
      setReview("");
      setWatched(false);
      toast({
        title: "Success",
        description: "Review updated successfully",
      });
    },
  });

  const watchlistMutation = useMutation({
    mutationFn: async () => {
      if (race?.userWatchlisted) {
        await apiRequest(`/api/watchlist/${id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/watchlist", {
          method: "POST",
          body: JSON.stringify({ raceId: parseInt(id!) }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/races/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/races/${id}/like`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/races/${id}`] });
    },
  });

  const addToListMutation = useMutation({
    mutationFn: async (listId: number) => {
      await apiRequest(`/api/lists/${listId}/races`, {
        method: "POST",
        body: JSON.stringify({ raceId: parseInt(id!) }),
      });
    },
    onSuccess: () => {
      setShowListDialog(false);
      toast({
        title: "Success",
        description: "Added to list successfully",
      });
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic: boolean }) => {
      const response = await apiRequest("/api/lists", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const newList = await response.json();
      await addToListMutation.mutateAsync(newList.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists/user"] });
      setShowCreateListDialog(false);
    },
  });

  const handleReviewSubmit = () => {
    if (editingReview) {
      updateRatingMutation.mutate({ rating, review, watched });
    } else {
      submitRatingMutation.mutate({ rating, review, watched });
    }
  };

  const startEditReview = (existingReview: any) => {
    setEditingReview(existingReview);
    setRating(existingReview.rating);
    setReview(existingReview.review || "");
    setWatched(existingReview.watched || false);
    setShowReviewDialog(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMedal = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return position.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-dark">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-48 w-full mb-6" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-deep-dark">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card-dark border-gray-700">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Race Not Found</h1>
              <p className="text-gray-400">The race you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-dark">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative">
        {race.imageUrl && (
          <div className="absolute inset-0 h-64">
            <img 
              src={race.imageUrl} 
              alt={race.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-60" />
          </div>
        )}
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{race.name}</h1>
            <div className="flex items-center justify-center gap-6 text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(race.date)} • {race.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{race.circuit?.name}, {race.circuit?.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>{race.averageRating}/5 ({race.ratingCount} reviews)</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {user && (
              <>
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-racing-red hover:bg-red-700">
                      <Star className="w-4 h-4 mr-2" />
                      {race.userRating ? "Update Review" : "Add Review"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card-dark border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        {editingReview ? "Edit Review" : "Rate This Race"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white mb-2 block">Rating</Label>
                        <StarRating rating={rating} onRatingChange={setRating} />
                      </div>
                      
                      <div>
                        <Label className="text-white mb-2 block">Review (optional)</Label>
                        <Textarea
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          placeholder="Share your thoughts about this race..."
                          className="bg-deep-dark border-gray-600 text-white"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="watched"
                          checked={watched}
                          onCheckedChange={setWatched}
                        />
                        <Label htmlFor="watched" className="text-white">
                          Mark as watched
                        </Label>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReviewDialog(false);
                            setEditingReview(null);
                            setRating(0);
                            setReview("");
                            setWatched(false);
                          }}
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleReviewSubmit}
                          disabled={rating === 0 || submitRatingMutation.isPending || updateRatingMutation.isPending}
                          className="bg-racing-red hover:bg-red-700"
                        >
                          {submitRatingMutation.isPending || updateRatingMutation.isPending ? "Saving..." : "Save Review"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => watchlistMutation.mutate()}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                  disabled={watchlistMutation.isPending}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${race.userWatchlisted ? 'fill-current' : ''}`} />
                  {race.userWatchlisted ? "Remove from To Watch" : "Add to To Watch"}
                </Button>

                <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
                      <List className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card-dark border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add to List</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {userLists && userLists.length > 0 ? (
                        <div className="space-y-2">
                          {userLists.map((list: any) => (
                            <Button
                              key={list.id}
                              variant="outline"
                              onClick={() => addToListMutation.mutate(list.id)}
                              className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                              disabled={addToListMutation.isPending}
                            >
                              {list.name}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-4">No lists found</p>
                      )}
                      
                      <Button
                        onClick={() => setShowCreateListDialog(true)}
                        className="w-full bg-racing-red hover:bg-red-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New List
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => likeMutation.mutate()}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`w-4 h-4 mr-2 ${race.userLiked ? 'fill-current text-red-500' : ''}`} />
                  Like
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-card-dark border-gray-700">
                <TabsTrigger value="details" className="data-[state=active]:bg-racing-red">Details</TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-racing-red">Results</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-racing-red">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Race Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Circuit</h4>
                      <p className="text-gray-300">{race.circuit?.name}</p>
                      <p className="text-gray-400 text-sm">{race.circuit?.location} • {race.circuit?.length}km</p>
                    </div>
                    
                    {race.tags && race.tags.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Race Characteristics</h4>
                        <div className="flex flex-wrap gap-2">
                          {race.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Race Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {race.results && race.results.length > 0 ? (
                      <Collapsible open={showFullResults} onOpenChange={setShowFullResults}>
                        <div className="space-y-2">
                          {race.results.slice(0, showFullResults ? undefined : 3).map((result: any, index: number) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl w-8 text-center">
                                  {getMedal(result.position)}
                                </span>
                                <div>
                                  <p className="text-white font-medium">{result.driverName}</p>
                                  <p className="text-gray-400 text-sm">{result.team}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white">{result.time || "DNF"}</p>
                                <p className="text-gray-400 text-sm">{result.points} pts</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {race.results.length > 3 && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white">
                              {showFullResults ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-2" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  Show All Results ({race.results.length})
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </Collapsible>
                    ) : (
                      <p className="text-gray-400 text-center py-8">No results available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card className="bg-card-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      User Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {race.ratings && race.ratings.length > 0 ? (
                      <div className="space-y-4">
                        {race.ratings.map((rating: any) => (
                          <div key={rating.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
                                  {rating.user?.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{rating.user?.username}</p>
                                  <StarRating rating={rating.rating} readonly />
                                </div>
                              </div>
                              {user?.id === rating.userId && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditReview(rating)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            {rating.review && (
                              <p className="text-gray-300 mt-2">{rating.review}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-2">
                              {new Date(rating.createdAt).toLocaleDateString()}
                              {rating.watched && " • Watched"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">No reviews yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Race Tags */}
            {race.tags && race.tags.length > 0 && (
              <Card className="bg-card-dark border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Race Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {race.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Races */}
            <Card className="bg-card-dark border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Similar Races</CardTitle>
              </CardHeader>
              <CardContent>
                {similarRaces && similarRaces.length > 0 ? (
                  <div className="space-y-4">
                    {similarRaces.slice(0, 3).map((similarRace: any) => (
                      <RaceCard key={similarRace.id} race={similarRace} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No similar races found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create List Dialog */}
      <Dialog open={showCreateListDialog} onOpenChange={setShowCreateListDialog}>
        <DialogContent className="bg-card-dark border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New List</DialogTitle>
          </DialogHeader>
          <CreateListForm 
            onSubmit={(data) => createListMutation.mutate(data)}
            isLoading={createListMutation.isPending}
            onCancel={() => setShowCreateListDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateListForm({ onSubmit, isLoading, onCancel }: any) {
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-white hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-racing-red hover:bg-red-700">
          {isLoading ? "Creating..." : "Create List"}
        </Button>
      </div>
    </form>
  );
}