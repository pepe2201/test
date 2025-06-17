import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Palette, 
  Save,
  X,
  Briefcase,
  Search,
  Code,
  User,
  FolderOpen,
  Hash,
  Star,
  Heart,
  Zap,
  Target,
  BookOpen,
  Coffee
} from "lucide-react";
import type { Category, CreateCategoryRequest } from "@shared/schema";

const iconOptions = [
  { name: 'briefcase', Icon: Briefcase, label: 'Work' },
  { name: 'search', Icon: Search, label: 'Research' },
  { name: 'code', Icon: Code, label: 'Development' },
  { name: 'user', Icon: User, label: 'Personal' },
  { name: 'folder', Icon: FolderOpen, label: 'Folder' },
  { name: 'hash', Icon: Hash, label: 'Tags' },
  { name: 'star', Icon: Star, label: 'Favorites' },
  { name: 'heart', Icon: Heart, label: 'Important' },
  { name: 'zap', Icon: Zap, label: 'Quick' },
  { name: 'target', Icon: Target, label: 'Goals' },
  { name: 'book-open', Icon: BookOpen, label: 'Learning' },
  { name: 'coffee', Icon: Coffee, label: 'Casual' },
];

const colorOptions = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
];

interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
}

export function CategoryManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: colorOptions[0],
    icon: 'folder'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      return await apiRequest('/api/categories', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clipboard'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Category created",
        description: "New category has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateCategoryRequest> }) => {
      return await apiRequest(`/api/categories/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clipboard'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clipboard'] });
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: colorOptions[0],
      icon: 'folder'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    if (category.isDefault) {
      toast({
        title: "Cannot edit default category",
        description: "Default categories cannot be modified.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || 'folder'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) {
      toast({
        title: "Cannot delete default category",
        description: "Default categories cannot be removed.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleOpenDialog = () => {
    setEditingCategory(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.name === iconName);
    return iconOption?.Icon || FolderOpen;
  };

  const userCategories = categories.filter((cat) => !cat.isDefault);
  const defaultCategories = categories.filter((cat) => cat.isDefault);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Category Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleOpenDialog} 
              className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color 
                          ? 'border-slate-800 dark:border-slate-200' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {iconOptions.map(({ name, Icon, label }) => (
                    <button
                      key={name}
                      type="button"
                      className={`p-2 rounded border ${
                        formData.icon === name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                      title={label}
                    >
                      <Icon className="w-4 h-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Categories */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Default Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {defaultCategories.map((category: Category) => {
            const IconComponent = getIconComponent(category.icon || 'folder');
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {category.name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* User Categories */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Custom Categories</h3>
        {userCategories.length === 0 ? (
          <Card className="border-dashed border-slate-300 dark:border-slate-600">
            <CardContent className="p-8 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No custom categories yet. Create your first category to organize your clipboard items.
              </p>
              <Button onClick={handleOpenDialog} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {userCategories.map((category: Category) => {
                const IconComponent = getIconComponent(category.icon || 'folder');
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                  >
                    <Card className="border-slate-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-slate-900/20 transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <IconComponent 
                              className="w-5 h-5" 
                              style={{ color: category.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {category.name}
                            </h4>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(category)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}