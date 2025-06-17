import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";

// Development-only root account
const ROOT_USER = {
  id: "root",
  email: "root@clipai.dev",
  firstName: "Root",
  lastName: "Admin",
  profileImageUrl: null,
  passwordHash: bcrypt.hashSync("root", 10),
  isLocalUser: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createLocalUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
  if (existingUser.length > 0) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(userData.password);
  const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newUser = await storage.upsertUser({
    id: userId,
    email: userData.email,
    firstName: userData.firstName || null,
    lastName: userData.lastName || null,
    passwordHash,
    isLocalUser: true,
    profileImageUrl: null,
  });

  return newUser;
}

export function setupLocalAuth() {
  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Check for root account first
        if (email === 'root' && password === 'root') {
          await storage.upsertUser(ROOT_USER);
          return done(null, { id: 'root', isLocal: true });
        }

        // Check for regular local users
        const [user] = await db.select().from(users).where(eq(users.email, email));
        
        if (!user || !user.isLocalUser || !user.passwordHash) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, { id: user.id, isLocal: true });
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

export const isLocalAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user?.isLocal) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};