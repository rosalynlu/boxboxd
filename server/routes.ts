import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertRatingSchema, insertWatchlistSchema, insertFollowSchema, updateUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize sample data
  await storage.initializeData();
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithStats(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = updateUserSchema.parse(req.body);
      
      // Check username uniqueness if provided
      if (updates.username) {
        const isAvailable = await storage.checkUsernameAvailable(updates.username);
        if (!isAvailable) {
          const existingUser = await storage.getUserByUsername(updates.username);
          if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: "Username already taken" });
          }
        }
      }
      
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get('/api/users/check-username', async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const available = await storage.checkUsernameAvailable(username.toLowerCase());
      res.json({ available });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  app.get('/api/users/:username', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userWithStats = await storage.getUserWithStats(user.id);
      res.json(userWithStats);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:username/activity', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const activities = await storage.getUserActivity(user.id, 20);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Race routes
  app.get('/api/races', async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search;
      const tags = req.query.tags ? req.query.tags.split(',') : undefined;
      const year = req.query.year ? parseInt(req.query.year) : undefined;
      
      const userId = req.user?.claims?.sub;
      const races = await storage.getRaces(limit, offset, { search, tags, year });
      res.json(races);
    } catch (error) {
      console.error("Error fetching races:", error);
      res.status(500).json({ message: "Failed to fetch races" });
    }
  });

  app.get('/api/races/popular', async (req, res) => {
    try {
      const races = await storage.getPopularRaces(10);
      res.json(races);
    } catch (error) {
      console.error("Error fetching popular races:", error);
      res.status(500).json({ message: "Failed to fetch popular races" });
    }
  });

  app.get('/api/races/:id', async (req: any, res) => {
    try {
      const raceId = parseInt(req.params.id);
      if (isNaN(raceId)) {
        return res.status(400).json({ message: "Invalid race ID" });
      }
      
      const userId = req.user?.claims?.sub;
      const race = await storage.getRace(raceId, userId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      res.json(race);
    } catch (error) {
      console.error("Error fetching race:", error);
      res.status(500).json({ message: "Failed to fetch race" });
    }
  });

  // Rating routes
  app.post('/api/races/:id/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const raceId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        userId,
        raceId,
      });

      // Check if user already rated this race
      const existingRating = await storage.getUserRating(userId, raceId);
      if (existingRating) {
        const updatedRating = await storage.updateRating(existingRating.id, ratingData);
        res.json(updatedRating);
      } else {
        const rating = await storage.createRating(ratingData);
        res.json(rating);
      }
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // Watchlist routes
  app.post('/api/watchlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertWatchlistSchema.parse({
        ...req.body,
        userId,
      });
      
      await storage.addToWatchlist(data);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete('/api/watchlist/:raceId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const raceId = parseInt(req.params.raceId);
      
      await storage.removeFromWatchlist(userId, raceId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  app.get('/api/watchlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const watchlist = await storage.getUserWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  // User profile routes
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userWithStats = await storage.getUserWithStats(user.id);
      res.json(userWithStats);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get("/api/users/:username/activity", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const activity = await storage.getUserActivity(user.id);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get("/api/users/:username/reviews", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userReviews = await storage.getUserRatings(user.id);
      res.json(userReviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.get("/api/users/:username/lists", async (req: any, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user?.claims?.sub;
      const includePrivate = currentUserId === user.id;
      const lists = await storage.getUserLists(user.id, includePrivate);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching user lists:", error);
      res.status(500).json({ message: "Failed to fetch user lists" });
    }
  });

  app.get("/api/users/:username/watchlist", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const watchlist = await storage.getUserWatchlist(user.id);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching user watchlist:", error);
      res.status(500).json({ message: "Failed to fetch user watchlist" });
    }
  });

  app.get("/api/users/:username/favorites", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const favorites = await storage.getUserFavorites(user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ message: "Failed to fetch user favorites" });
    }
  });

  app.get("/api/users/:username/following", isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user?.claims?.sub;
      const isFollowing = await storage.isFollowing(currentUserId, user.id);
      res.json(isFollowing);
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.post("/api/users/:username/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user?.claims?.sub;
      if (currentUserId === user.id) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      await storage.followUser({ followerId: currentUserId, followingId: user.id });
      res.json({ success: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:username/follow", isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentUserId = req.user?.claims?.sub;
      await storage.unfollowUser(currentUserId, user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Lists routes
  app.post("/api/lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const listData = { ...req.body, userId };
      const list = await storage.createList(listData);
      res.json(list);
    } catch (error) {
      console.error("Error creating list:", error);
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.patch("/api/lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const list = await storage.getList(parseInt(id), userId);
      if (!list || list.userId !== userId) {
        return res.status(404).json({ message: "List not found" });
      }
      
      const updatedList = await storage.updateList(parseInt(id), req.body);
      res.json(updatedList);
    } catch (error) {
      console.error("Error updating list:", error);
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  app.delete("/api/lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const list = await storage.getList(parseInt(id), userId);
      if (!list || list.userId !== userId) {
        return res.status(404).json({ message: "List not found" });
      }
      
      await storage.deleteList(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting list:", error);
      res.status(500).json({ message: "Failed to delete list" });
    }
  });

  // Like routes
  app.post('/api/races/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const raceId = parseInt(req.params.id);
      
      const isLiked = await storage.isRaceLiked(userId, raceId);
      if (isLiked) {
        await storage.unlikeRace(userId, raceId);
      } else {
        await storage.likeRace(userId, raceId);
      }
      
      res.json({ liked: !isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      if (isFollowing) {
        await storage.unfollowUser(followerId, followingId);
      } else {
        await storage.followUser({ followerId, followingId });
      }
      
      res.json({ following: !isFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Activity feed
  app.get('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getActivityFeed(userId, 20);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      res.status(500).json({ message: "Failed to fetch activity feed" });
    }
  });

  // Circuits routes
  app.get('/api/circuits', async (req, res) => {
    try {
      const circuits = await storage.getCircuits();
      res.json(circuits);
    } catch (error) {
      console.error("Error fetching circuits:", error);
      res.status(500).json({ message: "Failed to fetch circuits" });
    }
  });



  app.get('/api/races/:id/similar', async (req, res) => {
    try {
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }

      const similarRaces = await storage.getRaces(6, 0, {
        tags: race.tags || []
      });

      const filtered = similarRaces.filter(r => r.id !== raceId);
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching similar races:", error);
      res.status(500).json({ message: "Failed to fetch similar races" });
    }
  });

  app.patch('/api/races/:raceId/ratings/:ratingId', isAuthenticated, async (req: any, res) => {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const { rating, review, watched } = req.body;

      const updatedRating = await storage.updateRating(ratingId, {
        rating,
        review,
        watched,
      });

      res.json(updatedRating);
    } catch (error) {
      console.error("Error updating rating:", error);
      res.status(500).json({ message: "Failed to update rating" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
