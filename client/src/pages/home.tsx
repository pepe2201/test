import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (email) {
      return email;
    }
    return "User";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={user?.profileImageUrl || ""} 
                alt={getDisplayName(user?.firstName, user?.lastName, user?.email)}
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Welcome back, {user?.firstName || "User"}!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your intelligent clipboard manager is ready
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid md:grid-cols-2 gap-6 mb-8"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Link href="/dashboard">
              <motion.div
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  View Dashboard
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Manage your clipboard items with AI-powered analysis
                </p>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  Open Dashboard →
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                transition: { duration: 0.2 }
              }}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Account Settings
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Manage your profile and preferences
              </p>
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Settings className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* User Info Card */}
        <motion.div 
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Your Profile</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Name</label>
              <p className="text-slate-900 dark:text-slate-100">
                {getDisplayName(user?.firstName, user?.lastName, user?.email)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
              <p className="text-slate-900 dark:text-slate-100">
                {user?.email || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Member Since</label>
              <p className="text-slate-900 dark:text-slate-100">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</label>
              <p className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                {user?.id || "Loading..."}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}