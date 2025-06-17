import { Link } from "wouter";
import { 
  Clipboard, 
  FolderOpen, 
  Search, 
  Settings,
  Circle
} from "lucide-react";

interface SidebarProps {
  stats?: {
    categories: Record<string, number>;
  };
  onCategorySelect: (category: string | undefined) => void;
  selectedCategory?: string;
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export function Sidebar({ stats, onCategorySelect, selectedCategory, onNavigate, currentView }: SidebarProps) {
  const categories = [
    { key: 'work', name: 'Work Notes', color: 'bg-blue-500', count: stats?.categories?.work || 0 },
    { key: 'research', name: 'Research', color: 'bg-green-500', count: stats?.categories?.research || 0 },
    { key: 'development', name: 'Development', color: 'bg-purple-500', count: stats?.categories?.development || 0 },
    { key: 'personal', name: 'Personal', color: 'bg-orange-500', count: stats?.categories?.personal || 0 },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <Clipboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">ClipAI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Smart Clipboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onNavigate?.('timeline')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
            !currentView || currentView === 'timeline' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clipboard className="w-5 h-5" />
          <span className="font-medium">Clipboard</span>
        </button>
        
        <button 
          onClick={() => onNavigate?.('categories')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
            currentView === 'categories' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="font-medium">Categories</span>
        </button>

        <button 
          onClick={() => onNavigate?.('search')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
            currentView === 'search' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="font-medium">Search</span>
        </button>

        <Link href="/settings">
          <button 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </Link>
      </nav>

      {/* Category Filters */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => onCategorySelect(selectedCategory === category.key ? undefined : category.key)}
              className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors ${
                selectedCategory === category.key ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                <Circle className={`w-2 h-2 ${category.color}`} />
                <span>{category.name}</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 text-sm">
          <Circle className="w-2 h-2 bg-green-500 animate-pulse" />
          <span className="text-slate-600 dark:text-slate-300">AI Monitoring Active</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ready to analyze content</p>
      </div>
    </aside>
  );
}
