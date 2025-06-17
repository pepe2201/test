import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Copy, 
  Zap, 
  FileText, 
  Trash2, 
  Check, 
  X, 
  ExternalLink 
} from "lucide-react";
import type { ClipboardItem as ClipboardItemType } from "@shared/schema";

interface ClipboardItemProps {
  item: ClipboardItemType;
}

export function ClipboardItem({ item }: ClipboardItemProps) {
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoryColors: Record<string, string> = {
    work: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    research: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", 
    development: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    personal: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };

  const decisionColors: Record<string, string> = {
    keep: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    maybe: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    discard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  const updateDecisionMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: string }) => {
      setIsUpdating(true);
      return apiRequest("PATCH", `/api/clipboard/${id}/decision`, { decision });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clipboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Item updated successfully" });
      setIsUpdating(false);
    },
    onError: () => {
      setIsUpdating(false);
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const enhanceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/clipboard/${id}/enhance`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clipboard"] });
      toast({ title: "Content enhanced successfully" });
    },
    onError: () => {
      toast({ title: "Failed to enhance content", variant: "destructive" });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/clipboard/${id}/summarize`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clipboard"] });
      toast({ title: "Summary generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate summary", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/clipboard/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clipboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    try {
      const textToCopy = showEnhanced && item.enhancedContent ? item.enhancedContent : item.content;
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: "Copied to clipboard" });
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const isCodeContent = item.category === 'development' && item.content.includes('{') && item.content.includes('}');
  const isUrlContent = item.sourceUrl;

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    updating: {
      scale: 0.98,
      opacity: 0.7,
      transition: {
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    collapsed: { 
      height: "auto",
      opacity: 1 
    },
    expanded: { 
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isUpdating ? "updating" : "visible"}
      whileHover="hover"
      layout
    >
      <Card className={`transition-all duration-300 ${
        item.aiDecision === 'maybe' 
          ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-700 dark:bg-yellow-900/10' 
          : 'border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/20'
      }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Badge className={categoryColors[item.category] || "bg-gray-100 text-gray-800"}>
                {item.category}
              </Badge>
              <Badge className={decisionColors[item.aiDecision] || "bg-gray-100 text-gray-800"}>
                {item.aiDecision === 'keep' && <Check className="w-3 h-3 mr-1" />}
                {item.aiDecision === 'maybe' && "Review Needed"}
                {item.aiDecision === 'discard' && "Discarded"}
                {item.aiDecision === 'keep' && "AI Kept"}
              </Badge>
              <span className="text-xs text-slate-400">
                {format(new Date(item.createdAt), 'h:mm a')}
              </span>
            </div>
            
            {item.title && (
              <h3 className="font-medium text-slate-900 mb-2">{item.title}</h3>
            )}
            
            <div className="mb-3">
              {isCodeContent ? (
                <div className="bg-slate-50 rounded-lg p-3">
                  <code className="text-sm text-slate-700 font-mono whitespace-pre-wrap">
                    {showEnhanced && item.enhancedContent ? item.enhancedContent : item.content}
                  </code>
                </div>
              ) : (
                <div className="text-sm text-slate-600 whitespace-pre-wrap">
                  {showEnhanced && item.enhancedContent ? item.enhancedContent : item.content}
                </div>
              )}
            </div>

            {item.sourceUrl && (
              <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
                <span className="flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>{new URL(item.sourceUrl).hostname}</span>
                </span>
                {item.wordCount && (
                  <span>• {item.wordCount} words</span>
                )}
              </div>
            )}

            {item.summary && (
              <div className="text-sm text-slate-600 mb-2">
                <span className="font-medium">Summary:</span> {item.summary}
              </div>
            )}
            
            <p className="text-sm text-slate-600">
              <span className="font-medium">AI Analysis:</span> {item.aiAnalysis}
            </p>

            {item.aiDecision === 'maybe' && (
              <div className="flex items-center space-x-3 mt-3">
                <Button
                  size="sm"
                  onClick={() => updateDecisionMutation.mutate({ id: item.id, decision: 'keep' })}
                  disabled={updateDecisionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Keep
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateDecisionMutation.mutate({ id: item.id, decision: 'discard' })}
                  disabled={updateDecisionMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Discard
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
            
            {item.enhancedContent && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowEnhanced(!showEnhanced)}
                className={showEnhanced ? 'bg-blue-100 text-blue-600' : ''}
              >
                <Zap className="w-4 h-4" />
              </Button>
            )}
            
            {!item.enhancedContent && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => enhanceMutation.mutate(item.id)}
                disabled={enhanceMutation.isPending}
              >
                <Zap className="w-4 h-4" />
              </Button>
            )}
            
            {!item.summary && item.wordCount && item.wordCount > 100 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => summarizeMutation.mutate(item.id)}
                disabled={summarizeMutation.isPending}
              >
                <FileText className="w-4 h-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      </Card>
    </motion.div>
  );
}
