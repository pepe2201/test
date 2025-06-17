import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddContentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContentModal({ open, onClose, onSuccess }: AddContentModalProps) {
  const [content, setContent] = useState("");
  const [manualCategory, setManualCategory] = useState<string>("");
  const [forceKeep, setForceKeep] = useState(false);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/clipboard/analyze", {
        content,
        manualCategory: manualCategory || undefined,
        forceKeep,
      });
    },
    onSuccess: () => {
      toast({ title: "Content analyzed and saved successfully" });
      setContent("");
      setManualCategory("");
      setForceKeep(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to analyze content", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "Please enter some content", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate();
  };

  const handleClose = () => {
    if (!analyzeMutation.isPending) {
      setContent("");
      setManualCategory("");
      setForceKeep(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Content Manually</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your content here..."
              className="min-h-32 resize-none"
              disabled={analyzeMutation.isPending}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Select value={manualCategory} onValueChange={setManualCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Let AI decide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Let AI decide</SelectItem>
                <SelectItem value="work">Work Notes</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="forceKeep"
              checked={forceKeep}
              onCheckedChange={(checked) => setForceKeep(checked as boolean)}
              disabled={analyzeMutation.isPending}
            />
            <Label htmlFor="forceKeep" className="text-sm">
              Force keep (override AI decision)
            </Label>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleClose}
              disabled={analyzeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={analyzeMutation.isPending || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze & Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
