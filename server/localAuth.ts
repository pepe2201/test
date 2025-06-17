import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";

// Development-only root account
const ROOT_USER = {
  id: "root",
  email: "root@clipai.dev",
  firstName: "Root",
  lastName: "Admin",
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function setupLocalAuth() {
  // Local strategy for development
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        // Check for root account
        if (username === 'root' && password === 'root') {
          // Ensure root user exists in database
          await storage.upsertUser(ROOT_USER);
          return done(null, { id: 'root', isLocal: true });
        }
        
        return done(null, false, { message: 'Invalid credentials' });
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