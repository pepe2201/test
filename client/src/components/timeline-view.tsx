import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const sectionVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.05
      }
    }
  };

  const headerVariants = {
    hidden: { 
      opacity: 0, 
      x: -20 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };
  
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
      <motion.div 
        className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-lg font-medium mb-2">No clipboard items yet</div>
        <p className="text-sm">Start by adding some content to analyze</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Today Section */}
      <AnimatePresence>
        {todayItems.length > 0 && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            layout
          >
            <motion.div 
              className="flex items-center space-x-3 mb-4"
              variants={headerVariants}
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Today</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(), 'MMMM d, yyyy')}
              </span>
            </motion.div>
            <motion.div className="space-y-3" variants={sectionVariants}>
              {todayItems.map((item) => (
                <ClipboardItem key={item.id} item={item} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Yesterday Section */}
      <AnimatePresence>
        {yesterdayItems.length > 0 && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            layout
          >
            <motion.div 
              className="flex items-center space-x-3 mb-4"
              variants={headerVariants}
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Yesterday</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}
              </span>
            </motion.div>
            <motion.div className="space-y-3" variants={sectionVariants}>
              {yesterdayItems.map((item) => (
                <ClipboardItem key={item.id} item={item} />
              ))}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Older Items */}
      <AnimatePresence>
        {Object.entries(groupedOlderItems).map(([date, dateItems]) => (
          <motion.section
            key={date}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            layout
          >
            <motion.div 
              className="flex items-center space-x-3 mb-4"
              variants={headerVariants}
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {format(new Date(date), 'MMMM d, yyyy')}
              </h2>
            </motion.div>
            <motion.div className="space-y-3" variants={sectionVariants}>
              {dateItems.map((item) => (
                <ClipboardItem key={item.id} item={item} />
              ))}
            </motion.div>
          </motion.section>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}