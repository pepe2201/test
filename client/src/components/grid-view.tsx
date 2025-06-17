import { ClipboardItem } from "@/components/clipboard-item";
import type { ClipboardItem as ClipboardItemType } from "@shared/schema";

interface GridViewProps {
  items: ClipboardItemType[];
}

export function GridView({ items }: GridViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="text-lg font-medium mb-2">No clipboard items yet</div>
        <p className="text-sm">Start by adding some content to analyze</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ClipboardItem key={item.id} item={item} />
      ))}
    </div>
  );
}