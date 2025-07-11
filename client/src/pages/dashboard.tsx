import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { StatsBar } from "@/components/stats-bar";
import { TimelineView } from "@/components/timeline-view";
import { GridView } from "@/components/grid-view";
import { SettingsView } from "@/components/settings-view";
import { CategoriesView } from "@/components/categories-view";
import { TimeTrackingView } from "@/components/time-tracking-view";
import { AddContentModal } from "@/components/add-content-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Plus, RefreshCw, Grid, X } from "lucide-react";
import type { ClipboardItem } from "@shared/schema";

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedDecision, setSelectedDecision] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState<string>('timeline');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, refetch } = useQuery<ClipboardItem[]>({
    queryKey: selectedCategory ? ["/api/clipboard", "category", selectedCategory] : ["/api/clipboard"],
    queryFn: async () => {
      const url = selectedCategory ? `/api/clipboard/category/${selectedCategory}` : "/api/clipboard";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/clipboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/clipboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      refetch();
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch("/api/clipboard/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          category: selectedCategory,
          decision: selectedDecision,
        }),
      });
      
      if (!res.ok) throw new Error("Search failed");
      const searchResults = await res.json();
      // Update query cache with search results
      queryClient.setQueryData(["/api/clipboard"], searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setSelectedDecision(undefined);
    refetch();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar 
        stats={stats}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        onNavigate={setCurrentView}
        currentView={currentView}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {(currentView === 'timeline' || currentView === 'search' || !currentView) ? (
              <div className="flex items-center space-x-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search clipboard history..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                      onClick={clearSearch}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !searchQuery.trim()}
                  variant="outline"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
                <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                {currentView === 'settings' && (
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Application Settings</h1>
                )}
                {currentView === 'categories' && (
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Content Categories</h1>
                )}
                {currentView === 'timetracking' && (
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Time Tracking Analytics</h1>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              {(currentView === 'timeline' || !currentView) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'grid' : 'timeline')}
                  className={viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : ''}
                >
                  <Grid className="w-5 h-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-5 h-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'settings' ? (
            <SettingsView />
          ) : currentView === 'categories' ? (
            <CategoriesView onCategorySelect={(category) => {
              setSelectedCategory(category);
              setCurrentView('timeline');
            }} />
          ) : currentView === 'timetracking' ? (
            <TimeTrackingView />
          ) : (
            <>
              <StatsBar stats={stats} />
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-slate-500 dark:text-slate-400">Loading clipboard items...</div>
                </div>
              ) : viewMode === 'grid' ? (
                <GridView items={items} />
              ) : (
                <TimelineView items={items} />
              )}
            </>
          )}
        </div>
      </main>

      <AddContentModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={() => {
          setShowModal(false);
          refetch();
        }}
      />
    </div>
  );
}
