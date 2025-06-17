import { Card, CardContent } from "@/components/ui/card";
import { 
  Clipboard, 
  CheckCircle, 
  AlertCircle, 
  Clock
} from "lucide-react";

interface StatsBarProps {
  stats?: {
    totalItems: number;
    keptItems: number;
    maybeItems: number;
    todayItems: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const statCards = [
    {
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: Clipboard,
      bgColor: "bg-blue-600/10",
      iconColor: "text-blue-600",
    },
    {
      title: "AI Kept",
      value: stats?.keptItems || 0,
      icon: CheckCircle,
      bgColor: "bg-green-600/10",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Review",
      value: stats?.maybeItems || 0,
      icon: AlertCircle,
      bgColor: "bg-yellow-600/10",
      iconColor: "text-yellow-600",
    },
    {
      title: "Today",
      value: stats?.todayItems || 0,
      icon: Clock,
      bgColor: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
