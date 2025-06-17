import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Brain, Sparkles, Shield, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [showLocalLogin, setShowLocalLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest("/api/auth/local/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Reload page to trigger auth state update
      window.location.reload();
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Smart categorization and content analysis using advanced AI"
    },
    {
      icon: ClipboardList,
      title: "Smart Organization",
      description: "Automatically organize your clipboard history with intelligent sorting"
    },
    {
      icon: Sparkles,
      title: "Content Enhancement",
      description: "Improve and summarize your content with AI-powered suggestions"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        className="container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            ClipAI
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Transform your clipboard into an intelligent content manager. 
            Let AI organize, analyze, and enhance everything you copy.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-4">
                <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
          variants={itemVariants}
        >
          {!showLocalLogin ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Ready to supercharge your clipboard?
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of users who are already using AI to manage their content more efficiently.
              </p>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl"
                    size="lg"
                  >
                    Get Started - Sign In
                  </Button>
                </motion.div>
                
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <button 
                    onClick={() => setShowLocalLogin(true)}
                    className="underline hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Developer Login
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-center space-x-2">
                <User className="w-6 h-6" />
                <span>Developer Login</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Access the application with development credentials
              </p>
              
              <form onSubmit={handleLocalLogin} className="max-w-sm mx-auto space-y-4">
                <div>
                  <Label htmlFor="username" className="text-left block mb-2">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (hint: root)"
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-left block mb-2">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (hint: root)"
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLocalLogin(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !username || !password}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-16 text-slate-500 dark:text-slate-400"
          variants={itemVariants}
        >
          <p>Secure authentication powered by Replit</p>
        </motion.div>
      </motion.div>
    </div>
  );
}