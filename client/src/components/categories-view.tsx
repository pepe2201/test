import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, Code, Briefcase, User } from "lucide-react";
import type { ClipboardItem } from "@shared/schema";

interface CategoriesViewProps {
  onCategorySelect: (category: string) => void;
}

export function CategoriesView({ onCategorySelect }: CategoriesViewProps) {
  const { data: stats } = useQuery({
    queryKey: ["/api/clipboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/clipboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const categories = [
    {
      key: 'work',
      name: 'Work Notes',
      description: 'Meeting notes, project documents, business communications',
      icon: Briefcase,
      color: 'bg-blue-500',
      count: stats?.categories?.work || 0,
    },
    {
      key: 'research',
      name: 'Research',
      description: 'Articles, documentation, learning materials, references',
      icon: FileText,
      color: 'bg-green-500',
      count: stats?.categories?.research || 0,
    },
    {
      key: 'development',
      name: 'Development',
      description: 'Code snippets, technical docs, programming resources',
      icon: Code,
      color: 'bg-purple-500',
      count: stats?.categories?.development || 0,
    },
    {
      key: 'personal',
      name: 'Personal',
      description: 'Personal messages, shopping lists, casual content',
      icon: User,
      color: 'bg-orange-500',
      count: stats?.categories?.personal || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FolderOpen className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card
            key={category.key}
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
            onClick={() => onCategorySelect(category.key)}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <span>{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {category.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm leading-relaxed">
                {category.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{category.count} items</span>
                <span>Click to view →</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium text-slate-900">AI Categorization</h3>
            <p className="text-sm text-slate-600">
              Content is automatically sorted into these categories based on AI analysis.
              You can manually override categories when adding content.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}