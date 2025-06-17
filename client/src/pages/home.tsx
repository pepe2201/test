import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  LogOut, 
  User, 
  Settings, 
  Clipboard, 
  Sparkles, 
  BarChart3, 
  FolderOpen,
  Zap,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react";
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

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
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

  const getDisplayName = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return email || "User";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Header */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Clipboard className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome to ClipAI
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Hello, {user?.firstName || "User"}!
          </motion.p>
          <motion.p 
            className="text-slate-500 dark:text-slate-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your intelligent clipboard manager powered by AI
          </motion.p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div 
          className="mb-12"
          variants={itemVariants}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 ring-4 ring-blue-200 dark:ring-blue-800">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={getDisplayName(user?.firstName, user?.lastName, user?.email)}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg">
                      {getInitials(user?.firstName, user?.lastName, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {getDisplayName(user?.firstName, user?.lastName, user?.email)}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-800 dark:hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Features - What You Can Use Now */}
        <motion.div variants={itemVariants} className="mb-12">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">
            Available Now - Ready to Use
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <Link href="/dashboard">
                <Card className="group cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl">Dashboard</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-100 mb-4">
                        Manage clipboard content, categories, and view analytics
                      </p>
                      <div className="flex items-center text-white/80">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="text-sm">Fully functional</span>
                      </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
                  </motion.div>
                </Card>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/settings">
                <Card className="group cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <User className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl">Account & Settings</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-100 mb-4">
                        Manage your profile, security, and account preferences
                      </p>
                      <div className="flex items-center text-white/80">
                        <Shield className="w-4 h-4 mr-2" />
                        <span className="text-sm">Secure & ready</span>
                      </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-300" />
                  </motion.div>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Core Capabilities - What's Built In */}
        <motion.div variants={itemVariants} className="mb-12">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">
            Core Capabilities - Built Into ClipAI
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Zap className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">AI Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-100 mb-4">
                    Smart content categorization and analysis
                  </p>
                  <div className="flex items-center text-white/80">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="text-sm">OpenAI powered</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">Smart Categories</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-indigo-100 mb-4">
                    Custom categories and auto-organization
                  </p>
                  <div className="flex items-center text-white/80">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <span className="text-sm">Fully working</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-orange-500 to-red-500 border-0 text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">Time Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-100 mb-4">
                    Usage analytics and time-based insights
                  </p>
                  <div className="flex items-center text-white/80">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-sm">Analytics ready</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span>Powerful Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  className="text-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Clipboard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Smart Clipboard</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically captures and organizes your clipboard content
                  </p>
                </motion.div>

                <motion.div 
                  className="text-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FolderOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Auto Categories</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI-powered categorization for better organization
                  </p>
                </motion.div>

                <motion.div 
                  className="text-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Time Tracking</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Keep track of when and how you use your clipboard
                  </p>
                </motion.div>

                <motion.div 
                  className="text-center p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Secure Storage</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your data is encrypted and stored securely
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}