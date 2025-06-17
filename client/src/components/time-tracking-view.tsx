import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Activity,
  Timer,
  Eye,
  MousePointer
} from "lucide-react";
import { motion } from "framer-motion";
import type { ClipboardItem } from "@shared/schema";

export function TimeTrackingView() {
  const { data: items = [], isLoading } = useQuery<ClipboardItem[]>({
    queryKey: ["/api/clipboard"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/clipboard/stats"],
  });

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

  // Calculate time-based analytics
  const calculateTimeAnalytics = () => {
    if (!items.length) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayItems = items.filter(item => new Date(item.createdAt) >= today);
    const weekItems = items.filter(item => new Date(item.createdAt) >= thisWeek);
    const monthItems = items.filter(item => new Date(item.createdAt) >= thisMonth);

    const totalAccessCount = items.reduce((sum, item) => sum + (item.accessCount || 0), 0);
    const totalTimeSpent = items.reduce((sum, item) => sum + (item.timeSpentSeconds || 0), 0);

    // Calculate activity by hour for today
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(today.getTime() + hour * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      const count = items.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= hourStart && itemDate < hourEnd;
      }).length;
      return { hour, count };
    });

    // Most active category
    const categoryActivity = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + (item.accessCount || 0);
      return acc;
    }, {} as Record<string, number>);

    const mostActiveCategory = Object.entries(categoryActivity)
      .sort(([,a], [,b]) => b - a)[0];

    // Average time per item
    const avgTimePerItem = totalAccessCount > 0 ? totalTimeSpent / totalAccessCount : 0;

    return {
      todayItems: todayItems.length,
      weekItems: weekItems.length,
      monthItems: monthItems.length,
      totalAccessCount,
      totalTimeSpent,
      hourlyActivity,
      mostActiveCategory: mostActiveCategory ? mostActiveCategory[0] : 'None',
      avgTimePerItem: Math.round(avgTimePerItem)
    };
  };

  const analytics = calculateTimeAnalytics();

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatTimeDetailed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
          No Time Data Available
        </h3>
        <p className="text-slate-500 dark:text-slate-500">
          Start using your clipboard to see time tracking analytics
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Time Tracking Analytics
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Analyze your clipboard usage patterns and time spent
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today's Activity</CardTitle>
                <Calendar className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{analytics.todayItems}</div>
              <p className="text-blue-100 text-sm">Clipboard items created</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Access</CardTitle>
                <Eye className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{analytics.totalAccessCount}</div>
              <p className="text-purple-100 text-sm">Times items viewed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Time Spent</CardTitle>
                <Timer className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{formatTime(analytics.totalTimeSpent)}</div>
              <p className="text-emerald-100 text-sm">Total engagement time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Avg. Time</CardTitle>
                <Activity className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{formatTime(analytics.avgTimePerItem)}</div>
              <p className="text-orange-100 text-sm">Per item interaction</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Detailed Analytics */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Usage Trends */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Usage Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Week</span>
                <Badge variant="secondary">{analytics.weekItems} items</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Month</span>
                <Badge variant="secondary">{analytics.monthItems} items</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Most Active Category</span>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {analytics.mostActiveCategory}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Engagement</span>
                <span className="font-medium">{formatTimeDetailed(analytics.totalTimeSpent)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <span>Today's Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1">
                {analytics.hourlyActivity.map(({ hour, count }) => (
                  <div key={hour} className="text-center">
                    <div 
                      className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                        count === 0 ? 'bg-slate-200 dark:bg-slate-700' :
                        count <= 2 ? 'bg-blue-300' :
                        count <= 4 ? 'bg-blue-500' :
                        'bg-blue-700'
                      }`}
                      title={`${hour}:00 - ${count} items`}
                    >
                      {count || ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {hour % 4 === 0 ? `${hour}h` : ''}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Hourly clipboard activity (darker = more active)
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-slate-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate max-w-xs">
                        {item.title || item.content.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} • {new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <MousePointer className="w-3 h-3" />
                      <span>{item.accessCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer className="w-3 h-3" />
                      <span>{formatTime(item.timeSpentSeconds || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}