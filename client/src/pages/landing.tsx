import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Brain, Sparkles, Shield, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isRegistering ? "/api/auth/local/register" : "/api/auth/local/login";
      const body = isRegistering 
        ? { email, password, firstName, lastName }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `${isRegistering ? 'Registration' : 'Login'} failed`);
      }
      
      // Reload page to trigger auth state update
      window.location.reload();
    } catch (error: any) {
      toast({
        title: `${isRegistering ? 'Registration' : 'Login'} Failed`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setIsLoading(false);
  };

  const switchAuthMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
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
          {!showAuthForm ? (
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-xl mr-4"
                    size="lg"
                  >
                    Sign In with Replit
                  </Button>
                </motion.div>
                
                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                  <div>or</div>
                  <div className="space-x-4">
                    <button 
                      onClick={() => { setShowAuthForm(true); setIsRegistering(false); }}
                      className="underline hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Login with Email
                    </button>
                    <button 
                      onClick={() => { setShowAuthForm(true); setIsRegistering(true); }}
                      className="underline hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Create Account
                    </button>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => { setEmail("root"); setPassword("root"); setShowAuthForm(true); setIsRegistering(false); }}
                      className="text-xs underline hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Quick Dev Login (root/root)
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-center space-x-2">
                <User className="w-6 h-6" />
                <span>{isRegistering ? "Create Account" : "Login"}</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {isRegistering 
                  ? "Create your ClipAI account to get started" 
                  : "Welcome back! Please sign in to your account"
                }
              </p>
              
              <form onSubmit={handleAuthSubmit} className="max-w-sm mx-auto space-y-4">
                {isRegistering && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-left block mb-2">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-left block mb-2">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-left block mb-2">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-left block mb-2">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  {isRegistering && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowAuthForm(false); resetForm(); }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    {isLoading 
                      ? (isRegistering ? "Creating Account..." : "Signing In...") 
                      : (isRegistering ? "Create Account" : "Sign In")
                    }
                  </Button>
                </div>
                
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={switchAuthMode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isRegistering 
                      ? "Already have an account? Sign in" 
                      : "Don't have an account? Create one"
                    }
                  </button>
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