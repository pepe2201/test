import { CategoryManager } from "@/components/category-manager";

interface CategoriesViewProps {
  onCategorySelect: (category: string) => void;
}

export function CategoriesView({ onCategorySelect }: CategoriesViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Manage Categories
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Create, edit, and organize your custom content categories
        </p>
      </div>
      
      <CategoryManager />
    </div>
  );
}