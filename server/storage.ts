import {
  users,
  races,
  circuits,
  ratings,
  watchlist,
  follows,
  lists,
  listRaces,
  likes,
  activities,
  raceResults,
  type User,
  type UpsertUser,
  type UpdateUser,
  type Race,
  type InsertRace,
  type RaceWithDetails,
  type Rating,
  type InsertRating,
  type InsertWatchlist,
  type InsertFollow,
  type InsertList,
  type List,
  type Activity,
  type InsertActivity,
  type UserWithStats,
  type Circuit,
  type RaceResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  checkUsernameAvailable(username: string): Promise<boolean>;
  getUserWithStats(id: string): Promise<UserWithStats | undefined>;

  // Race operations
  getRaces(limit?: number, offset?: number, filters?: {
    search?: string;
    tags?: string[];
    year?: number;
    sortBy?: string;
  }): Promise<RaceWithDetails[]>;
  getRace(id: number, userId?: string): Promise<RaceWithDetails | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  getPopularRaces(limit?: number): Promise<RaceWithDetails[]>;

  // Circuit operations
  getCircuits(): Promise<Circuit[]>;
  getCircuit(id: number): Promise<Circuit | undefined>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: number, rating: Partial<InsertRating>): Promise<Rating>;
  getUserRating(userId: string, raceId: number): Promise<Rating | undefined>;
  getRaceRatings(raceId: number, limit?: number): Promise<Rating[]>;
  getUserRatings(userId: string): Promise<any[]>;

  // Watchlist operations
  addToWatchlist(data: InsertWatchlist): Promise<void>;
  removeFromWatchlist(userId: string, raceId: number): Promise<void>;
  getUserWatchlist(userId: string): Promise<RaceWithDetails[]>;
  isInWatchlist(userId: string, raceId: number): Promise<boolean>;

  // Social operations
  followUser(data: InsertFollow): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowing(userId: string): Promise<User[]>;
  getUserFollowers(userId: string): Promise<User[]>;

  // Like operations
  likeRace(userId: string, raceId: number): Promise<void>;
  unlikeRace(userId: string, raceId: number): Promise<void>;
  isRaceLiked(userId: string, raceId: number): Promise<boolean>;

  // Activity feed
  getActivityFeed(userId: string, limit?: number): Promise<any[]>;
  getUserActivity(userId: string, limit?: number): Promise<any[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // List operations
  getUserLists(userId: string, includePrivate?: boolean): Promise<List[]>;
  getList(id: number, userId?: string): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: number, list: Partial<InsertList>): Promise<List>;
  deleteList(id: number): Promise<void>;
  addRaceToList(listId: number, raceId: number): Promise<void>;
  removeRaceFromList(listId: number, raceId: number): Promise<void>;
  getListRaces(listId: number): Promise<RaceWithDetails[]>;

  // User favorites (liked races)
  getUserFavorites(userId: string): Promise<RaceWithDetails[]>;
  reorderUserFavorites(userId: string, raceIds: number[]): Promise<void>;

  // Initialize data
  initializeData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return !user;
  }

  async getUserWithStats(id: string): Promise<UserWithStats | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    const [ratingsCount] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(ratings)
      .where(eq(ratings.userId, id));

    const [watchlistCount] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(watchlist)
      .where(eq(watchlist.userId, id));

    const [followingCount] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(follows)
      .where(eq(follows.followerId, id));

    const [followersCount] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(follows)
      .where(eq(follows.followingId, id));

    const [listsCount] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(lists)
      .where(eq(lists.userId, id));

    return {
      ...user,
      _count: {
        ratings: ratingsCount?.count || 0,
        watchlist: watchlistCount?.count || 0,
        following: followingCount?.count || 0,
        followers: followersCount?.count || 0,
        lists: listsCount?.count || 0,
      },
    };
  }

  // Race operations
  async getRaces(limit = 20, offset = 0, filters: {
    search?: string;
    tags?: string[];
    year?: number;
    sortBy?: string;
  } = {}): Promise<RaceWithDetails[]> {
    let query = db
      .select({
        id: races.id,
        name: races.name,
        year: races.year,
        season: races.season,
        round: races.round,
        circuitId: races.circuitId,
        date: races.date,
        laps: races.laps,
        imageUrl: races.imageUrl,
        tags: races.tags,
        averageRating: races.averageRating,
        ratingCount: races.ratingCount,
        createdAt: races.createdAt,
        circuit: circuits,
      })
      .from(races)
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .limit(limit)
      .offset(offset);

    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          ilike(races.name, `%${filters.search}%`),
          ilike(circuits.name, `%${filters.search}%`),
          ilike(circuits.location, `%${filters.search}%`)
        )
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${races.tags} && ${filters.tags}`);
    }

    if (filters.year) {
      conditions.push(eq(races.year, filters.year));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (filters.sortBy === 'date') {
      query = query.orderBy(desc(races.date)) as any;
    } else if (filters.sortBy === 'rating') {
      query = query.orderBy(desc(races.averageRating)) as any;
    } else {
      query = query.orderBy(desc(races.date)) as any; // Default sort
    }

    const result = await query;

    return result.map(row => ({
      ...row,
      circuit: row.circuit!,
      ratings: [],
      results: [],
    }));
  }

  async getRace(id: number, userId?: string): Promise<RaceWithDetails | undefined> {
    const [raceData] = await db
      .select({
        id: races.id,
        name: races.name,
        year: races.year,
        season: races.season,
        round: races.round,
        circuitId: races.circuitId,
        date: races.date,
        laps: races.laps,
        imageUrl: races.imageUrl,
        tags: races.tags,
        averageRating: races.averageRating,
        ratingCount: races.ratingCount,
        createdAt: races.createdAt,
        circuit: circuits,
      })
      .from(races)
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .where(eq(races.id, id));

    if (!raceData) return undefined;

    const raceRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.raceId, id))
      .orderBy(desc(ratings.createdAt));

    const results = await db
      .select()
      .from(raceResults)
      .where(eq(raceResults.raceId, id))
      .orderBy(raceResults.position);

    let userRating;
    let userWatchlisted = false;
    let userLiked = false;

    if (userId) {
      userRating = await this.getUserRating(userId, id);
      userWatchlisted = await this.isInWatchlist(userId, id);
      userLiked = await this.isRaceLiked(userId, id);
    }

    return {
      ...raceData,
      circuit: raceData.circuit!,
      ratings: raceRatings,
      results,
      userRating,
      userWatchlisted,
      userLiked,
    };
  }

  async createRace(race: InsertRace): Promise<Race> {
    const [newRace] = await db.insert(races).values(race).returning();
    return newRace;
  }

  async getPopularRaces(limit = 10): Promise<RaceWithDetails[]> {
    const result = await db
      .select({
        id: races.id,
        name: races.name,
        year: races.year,
        season: races.season,
        round: races.round,
        circuitId: races.circuitId,
        date: races.date,
        laps: races.laps,
        imageUrl: races.imageUrl,
        tags: races.tags,
        averageRating: races.averageRating,
        ratingCount: races.ratingCount,
        createdAt: races.createdAt,
        circuit: circuits,
      })
      .from(races)
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .orderBy(desc(races.ratingCount))
      .limit(limit);

    return result.map(row => ({
      ...row,
      circuit: row.circuit!,
      ratings: [],
      results: [],
    }));
  }

  // Circuit operations
  async getCircuits(): Promise<Circuit[]> {
    return await db.select().from(circuits).orderBy(circuits.name);
  }

  async getCircuit(id: number): Promise<Circuit | undefined> {
    const [circuit] = await db.select().from(circuits).where(eq(circuits.id, id));
    return circuit;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    
    // Update race average rating
    await this.updateRaceRating(rating.raceId!);
    
    return newRating;
  }

  async updateRating(id: number, ratingData: Partial<InsertRating>): Promise<Rating> {
    const [updatedRating] = await db
      .update(ratings)
      .set({ ...ratingData, updatedAt: new Date() })
      .where(eq(ratings.id, id))
      .returning();

    // Update race average rating
    if (updatedRating.raceId) {
      await this.updateRaceRating(updatedRating.raceId);
    }

    return updatedRating;
  }

  private async updateRaceRating(raceId: number): Promise<void> {
    const [avgRating] = await db
      .select({
        avg: sql`AVG(${ratings.rating})`.mapWith(Number),
        count: sql`COUNT(*)`.mapWith(Number),
      })
      .from(ratings)
      .where(eq(ratings.raceId, raceId));

    await db
      .update(races)
      .set({
        averageRating: avgRating.avg?.toFixed(2) || "0",
        ratingCount: avgRating.count || 0,
      })
      .where(eq(races.id, raceId));
  }

  async getUserRating(userId: string, raceId: number): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.raceId, raceId)));
    return rating;
  }

  async getRaceRatings(raceId: number, limit = 10): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.raceId, raceId))
      .orderBy(desc(ratings.createdAt))
      .limit(limit);
  }

  async getUserRatings(userId: string): Promise<any[]> {
    const userRatings = await db
      .select({
        id: ratings.id,
        rating: ratings.rating,
        review: ratings.review,
        createdAt: ratings.createdAt,
        userId: ratings.userId,
        raceId: ratings.raceId,
        race: {
          id: races.id,
          name: races.name,
          year: races.year,
          imageUrl: races.imageUrl,
        }
      })
      .from(ratings)
      .innerJoin(races, eq(ratings.raceId, races.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt));

    return userRatings;
  }

  // Watchlist operations
  async addToWatchlist(data: InsertWatchlist): Promise<void> {
    await db.insert(watchlist).values(data);
  }

  async removeFromWatchlist(userId: string, raceId: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.raceId, raceId)));
  }

  async getUserWatchlist(userId: string): Promise<RaceWithDetails[]> {
    const result = await db
      .select({
        id: races.id,
        name: races.name,
        year: races.year,
        season: races.season,
        round: races.round,
        circuitId: races.circuitId,
        date: races.date,
        laps: races.laps,
        imageUrl: races.imageUrl,
        tags: races.tags,
        averageRating: races.averageRating,
        ratingCount: races.ratingCount,
        createdAt: races.createdAt,
        circuit: circuits,
      })
      .from(watchlist)
      .innerJoin(races, eq(watchlist.raceId, races.id))
      .leftJoin(circuits, eq(races.circuitId, circuits.id))
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.createdAt));

    return result.map(row => ({
      ...row,
      circuit: row.circuit!,
      ratings: [],
      results: [],
    }));
  }

  async isInWatchlist(userId: string, raceId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.raceId, raceId)));
    return !!item;
  }

  // Social operations
  async followUser(data: InsertFollow): Promise<void> {
    await db.insert(follows).values(data);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        birthDate: users.birthDate,
        gender: users.gender,
        favoriteTeam: users.favoriteTeam,
        favoriteDriver: users.favoriteDriver,
        bio: users.bio,
        website: users.website,
        isOnboardingComplete: users.isOnboardingComplete,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        birthDate: users.birthDate,
        gender: users.gender,
        favoriteTeam: users.favoriteTeam,
        favoriteDriver: users.favoriteDriver,
        bio: users.bio,
        website: users.website,
        isOnboardingComplete: users.isOnboardingComplete,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result;
  }

  // Like operations
  async likeRace(userId: string, raceId: number): Promise<void> {
    await db.insert(likes).values({ userId, raceId });
  }

  async unlikeRace(userId: string, raceId: number): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.raceId, raceId)));
  }

  async isRaceLiked(userId: string, raceId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.raceId, raceId)));
    return !!like;
  }

  // Activity feed
  async getActivityFeed(userId: string, limit = 20): Promise<any[]> {
    // Get activities from users the current user follows
    const following = await this.getUserFollowing(userId);
    const followingIds = following.map(user => user.id);

    if (followingIds.length === 0) {
      return [];
    }

    const activities = await db
      .select({
        id: ratings.id,
        type: sql`'rating'`,
        userId: ratings.userId,
        raceId: ratings.raceId,
        rating: ratings.rating,
        review: ratings.review,
        createdAt: ratings.createdAt,
        user: {
          id: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
        race: {
          id: races.id,
          name: races.name,
          year: races.year,
          imageUrl: races.imageUrl,
        },
      })
      .from(ratings)
      .innerJoin(users, eq(ratings.userId, users.id))
      .innerJoin(races, eq(ratings.raceId, races.id))
      .where(inArray(ratings.userId, followingIds))
      .orderBy(desc(ratings.createdAt))
      .limit(limit);

    return activities;
  }

  async getUserActivity(userId: string, limit = 20): Promise<any[]> {
    // For now, return ratings as activity since activities table is having issues
    const ratingsActivity = await db
      .select({
        id: ratings.id,
        type: sql`'review'`,
        userId: ratings.userId,
        raceId: ratings.raceId,
        rating: ratings.rating,
        review: ratings.review,
        createdAt: ratings.createdAt,
        race: {
          id: races.id,
          name: races.name,
          year: races.year,
          imageUrl: races.imageUrl,
        },
      })
      .from(ratings)
      .innerJoin(races, eq(ratings.raceId, races.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(limit);

    return ratingsActivity;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getUserLists(userId: string, includePrivate = true): Promise<List[]> {
    if (includePrivate) {
      return await db.select().from(lists)
        .where(eq(lists.userId, userId))
        .orderBy(desc(lists.createdAt));
    } else {
      return await db.select().from(lists)
        .where(and(eq(lists.userId, userId), eq(lists.isPublic, true)))
        .orderBy(desc(lists.createdAt));
    }
  }

  async getList(id: number, userId?: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists).where(eq(lists.id, id));
    
    if (!list) return undefined;
    
    // If viewing another user's list, only return if it's public
    if (userId && list.userId !== userId && !list.isPublic) {
      return undefined;
    }
    
    return list;
  }

  async createList(listData: InsertList): Promise<List> {
    const [list] = await db
      .insert(lists)
      .values(listData)
      .returning();
    return list;
  }

  async updateList(id: number, listData: Partial<InsertList>): Promise<List> {
    const [list] = await db
      .update(lists)
      .set({ ...listData, updatedAt: new Date() })
      .where(eq(lists.id, id))
      .returning();
    return list;
  }

  async deleteList(id: number): Promise<void> {
    await db.delete(lists).where(eq(lists.id, id));
  }

  async addRaceToList(listId: number, raceId: number): Promise<void> {
    await db.insert(listRaces).values({ listId, raceId });
    
    // Create activity
    const list = await this.getList(listId);
    if (list) {
      await this.createActivity({
        userId: list.userId,
        type: 'list_add',
        raceId,
        listId,
      });
    }
  }

  async removeRaceFromList(listId: number, raceId: number): Promise<void> {
    await db.delete(listRaces)
      .where(and(eq(listRaces.listId, listId), eq(listRaces.raceId, raceId)));
    
    // Create activity
    const list = await this.getList(listId);
    if (list) {
      await this.createActivity({
        userId: list.userId,
        type: 'list_remove',
        raceId,
        listId,
      });
    }
  }

  async getListRaces(listId: number): Promise<RaceWithDetails[]> {
    const raceData = await db
      .select({
        race: races,
        circuit: circuits,
      })
      .from(listRaces)
      .innerJoin(races, eq(listRaces.raceId, races.id))
      .innerJoin(circuits, eq(races.circuitId, circuits.id))
      .where(eq(listRaces.listId, listId))
      .orderBy(listRaces.order, desc(races.year));

    return raceData.map(({ race, circuit }) => ({
      ...race,
      circuit,
      ratings: [],
      results: [],
    }));
  }

  async getUserFavorites(userId: string): Promise<RaceWithDetails[]> {
    const likedRaces = await db
      .select({
        race: races,
        circuit: circuits,
        likedAt: likes.createdAt,
      })
      .from(likes)
      .innerJoin(races, eq(likes.raceId, races.id))
      .innerJoin(circuits, eq(races.circuitId, circuits.id))
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));

    return likedRaces.map(({ race, circuit }) => ({
      ...race,
      circuit,
      ratings: [],
      results: [],
      userLiked: true,
    }));
  }

  async reorderUserFavorites(userId: string, raceIds: number[]): Promise<void> {
    // This would require adding an order field to likes table
    // For now, we'll skip the reordering functionality
    console.log(`Reordering favorites for user ${userId}:`, raceIds);
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
    // Check if data already exists
    const [existingRace] = await db.select().from(races).limit(1);
    if (existingRace) return;

    // Create circuits
    const [monaco] = await db.insert(circuits).values({
      name: "Circuit de Monaco",
      location: "Monte Carlo",
      country: "Monaco",
      type: "street",
      length: "3.337",
    }).returning();

    const [silverstone] = await db.insert(circuits).values({
      name: "Silverstone Circuit",
      location: "Silverstone",
      country: "United Kingdom",
      type: "permanent",
      length: "5.891",
    }).returning();

    const [interlagos] = await db.insert(circuits).values({
      name: "Autodromo Jose Carlos Pace",
      location: "São Paulo",
      country: "Brazil",
      type: "permanent",
      length: "4.309",
    }).returning();

    const [suzuka] = await db.insert(circuits).values({
      name: "Suzuka International Racing Course",
      location: "Suzuka",
      country: "Japan",
      type: "permanent",
      length: "5.807",
    }).returning();

    // Create races
    const currentYear = new Date().getFullYear();
    
    const [monacoRace] = await db.insert(races).values({
      name: "Monaco Grand Prix",
      year: currentYear,
      season: currentYear,
      round: 6,
      circuitId: monaco.id,
      date: `${currentYear}-05-28`,
      laps: 78,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
      tags: ["Day Race", "Street Circuit", "Dry", "Historic", "Safety Car Heavy"],
    }).returning();

    await db.insert(races).values({
      name: "British Grand Prix",
      year: currentYear,
      season: currentYear,
      round: 10,
      circuitId: silverstone.id,
      date: `${currentYear}-07-09`,
      laps: 52,
      imageUrl: "https://images.unsplash.com/photo-1566436990860-65b8d5c0f000",
      tags: ["Day Race", "Permanent Track", "Mixed Weather", "Home Race"],
    });

    await db.insert(races).values({
      name: "Brazilian Grand Prix",
      year: currentYear,
      season: currentYear,
      round: 22,
      circuitId: interlagos.id,
      date: `${currentYear}-11-05`,
      laps: 71,
      imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256",
      tags: ["Day Race", "Permanent Track", "Wet", "Sprint Weekend", "Classic"],
    });

    await db.insert(races).values({
      name: "Japanese Grand Prix",
      year: currentYear,
      season: currentYear,
      round: 18,
      circuitId: suzuka.id,
      date: `${currentYear}-09-24`,
      laps: 53,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      tags: ["Day Race", "Permanent Track", "Dry", "Technical", "Fan Favorite"],
    });

    // Add race results for Monaco
    await db.insert(raceResults).values([
      { raceId: monacoRace.id, position: 1, driverName: "Max Verstappen", team: "Red Bull Racing", time: "1:32:15.456", points: 25 },
      { raceId: monacoRace.id, position: 2, driverName: "Fernando Alonso", team: "Aston Martin", time: "+5.123", points: 18 },
      { raceId: monacoRace.id, position: 3, driverName: "Esteban Ocon", team: "Alpine", time: "+12.789", points: 15 },
    ]);
  }
}

export const storage = new DatabaseStorage();
