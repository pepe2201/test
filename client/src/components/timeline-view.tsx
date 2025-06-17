import { format, isToday, isYesterday } from "date-fns";
import { ClipboardItem } from "@/components/clipboard-item";
import type { ClipboardItem as ClipboardItemType } from "@shared/schema";

interface TimelineViewProps {
  items: ClipboardItemType[];
}

export function TimelineView({ items }: TimelineViewProps) {
  const todayItems = items.filter(item => isToday(new Date(item.createdAt)));
  const yesterdayItems = items.filter(item => isYesterday(new Date(item.createdAt)));
  const olderItems = items.filter(item => 
    !isToday(new Date(item.createdAt)) && !isYesterday(new Date(item.createdAt))
  );
  
  const groupedOlderItems = olderItems.reduce((groups, item) => {
    const date = format(new Date(item.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, ClipboardItemType[]>);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="text-lg font-medium mb-2">No clipboard items yet</div>
        <p className="text-sm">Start by adding some content to analyze</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today Section */}
      {todayItems.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Today</h2>
            <span className="text-sm text-slate-500">
              {format(new Date(), 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="space-y-3">
            {todayItems.map((item) => (
              <ClipboardItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Yesterday Section */}
      {yesterdayItems.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Yesterday</h2>
            <span className="text-sm text-slate-500">
              {format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="space-y-3">
            {yesterdayItems.map((item) => (
              <ClipboardItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Older Items */}
      {Object.entries(groupedOlderItems).map(([date, dateItems]) => (
        <div key={date}>
          <div className="flex items-center space-x-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {format(new Date(date), 'MMMM d, yyyy')}
            </h2>
          </div>
          <div className="space-y-3">
            {dateItems.map((item) => (
              <ClipboardItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
