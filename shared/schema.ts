import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  birthDate: date("birth_date"),
  gender: varchar("gender"),
  favoriteTeam: varchar("favorite_team"),
  favoriteDriver: varchar("favorite_driver"),
  bio: text("bio"),
  website: varchar("website"),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const circuits = pgTable("circuits", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  location: varchar("location").notNull(),
  country: varchar("country").notNull(),
  type: varchar("type").notNull(), // "street" or "permanent"
  length: decimal("length", { precision: 5, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  year: integer("year").notNull(),
  season: integer("season").notNull(),
  round: integer("round").notNull(),
  circuitId: integer("circuit_id").references(() => circuits.id),
  date: date("date").notNull(),
  laps: integer("laps"),
  imageUrl: varchar("image_url"),
  tags: text("tags").array().default([]),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const raceResults = pgTable("race_results", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").references(() => races.id),
  position: integer("position").notNull(),
  driverName: varchar("driver_name").notNull(),
  team: varchar("team").notNull(),
  time: varchar("time"),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  raceId: integer("race_id").references(() => races.id),
  rating: integer("rating").notNull(), // Store as half-stars (0-10 scale)
  review: text("review"),
  watched: boolean("watched").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  raceId: integer("race_id").references(() => races.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").references(() => users.id),
  followingId: varchar("following_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listRaces = pgTable("list_races", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => lists.id),
  raceId: integer("race_id").references(() => races.id),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  raceId: integer("race_id").references(() => races.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'review', 'watch', 'unwatch', 'list_add', 'list_remove', 'watchlist_add', 'watchlist_remove', 'like', 'unlike'
  raceId: integer("race_id").references(() => races.id),
  listId: integer("list_id").references(() => lists.id),
  rating: integer("rating"),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activities_user").on(table.userId),
  index("idx_activities_type").on(table.type),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  watchlist: many(watchlist),
  following: many(follows, { relationName: "follower" }),
  followers: many(follows, { relationName: "following" }),
  lists: many(lists),
  likes: many(likes),
  activities: many(activities),
}));

export const racesRelations = relations(races, ({ one, many }) => ({
  circuit: one(circuits, {
    fields: [races.circuitId],
    references: [circuits.id],
  }),
  ratings: many(ratings),
  watchlist: many(watchlist),
  results: many(raceResults),
  listRaces: many(listRaces),
  likes: many(likes),
}));

export const circuitsRelations = relations(circuits, ({ many }) => ({
  races: many(races),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  race: one(races, {
    fields: [ratings.raceId],
    references: [races.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
  }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
  }),
  races: many(listRaces),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  race: one(races, {
    fields: [activities.raceId],
    references: [races.id],
  }),
  list: one(lists, {
    fields: [activities.listId],
    references: [lists.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertRaceSchema = createInsertSchema(races).omit({
  id: true,
  createdAt: true,
  averageRating: true,
  ratingCount: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Race = typeof races.$inferSelect;
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type Circuit = typeof circuits.$inferSelect;
export type RaceResult = typeof raceResults.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;
export type Like = typeof likes.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types for queries with relations
export type RaceWithDetails = Race & {
  circuit: Circuit;
  ratings: Rating[];
  results: RaceResult[];
  userRating?: Rating;
  userWatchlisted?: boolean;
  userLiked?: boolean;
};

export type UserWithStats = User & {
  _count: {
    ratings: number;
    watchlist: number;
    following: number;
    followers: number;
    lists: number;
  };
};
