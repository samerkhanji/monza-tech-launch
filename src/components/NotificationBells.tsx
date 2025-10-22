import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MessageSquare, BellRing, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type NType = "message" | "request" | "car_activity";

type Notif = {
  id: number;
  type: NType;
  title: string;
  body?: string | null;
  is_read: boolean;
  created_at: string;
  payload?: { route?: string; vin?: string } | null;
};

function useUnreadCounts() {
  const [counts, setCounts] = useState<Record<NType, number>>({
    message: 0,
    request: 0,
    car_activity: 0,
  });

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from("notifications_unread_counts")
        .select("*");
      
      if (!mounted) return;
      
      // If view doesn't exist (404), silently continue with zero counts
      if (error && error.code === 'PGRST116') {
        console.warn('notifications_unread_counts view not found - using zero counts');
        return;
      }
      
      if (error) {
        console.error('Error fetching notification counts:', error);
        return;
      }
      
      const next: Record<NType, number> = {
        message: 0,
        request: 0,
        car_activity: 0,
      };
      (data || []).forEach((r: any) => {
        next[r.type as NType] = r.unread_count ?? 0;
      });
      setCounts(next);
    };

    fetchCounts();

    const ch = supabase
      .channel("notif-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchCounts)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return counts;
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-[10px] h-4 min-w-4 px-1 bg-red-600 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NotifBell({
  type,
  icon,
  title,
  route,
}: {
  type: NType;
  icon: React.ReactNode;
  title: string;
  route: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const counts = useUnreadCounts();
  const unread = counts[type] || 0;

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(10);
    setItems((data as Notif[]) || []);
  };

  const markRead = async () => {
    await supabase.rpc("mark_notifications_read", { p_type: type });
  };

  return (
    <Popover
      open={open}
      onOpenChange={async (v) => {
        setOpen(v);
        if (v) {
          await load();
          await markRead();
        }
      }}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                aria-label={title}
                className={cn(
                  "relative h-10 w-10 inline-flex items-center justify-center",
                  "rounded-xl border border-gray-200 bg-white",
                  "hover:bg-gray-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                )}
                type="button"
                data-state={open ? "open" : "closed"}
              >
                {icon}
                <Badge count={unread} />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="end"
        className="w-80 p-0 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-2xl"
      >
        <div className="px-3 py-2 border-b bg-gray-50 font-semibold">{title}</div>
        <div className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No new notifications</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "w-full text-left p-3 border-b last:border-b-0 transition-colors",
                  "hover:bg-gray-50",
                  !n.is_read && "bg-amber-50"
                )}
                onClick={() => {
                  const dest = n.payload?.route || route;
                  window.location.href = dest; // or use your router: navigate(dest)
                }}
              >
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs text-gray-600 mt-0.5">{n.body}</div>}
                {n.payload?.vin && (
                  <div className="text-xs text-gray-500 mt-0.5">VIN: {n.payload.vin}</div>
                )}
                <div className="mt-1 text-[10px] text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-2 flex justify-end">
          <a href={route} className="text-xs text-blue-600 hover:underline">
            View all
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationBells() {
  return (
    <div className="flex items-center gap-2">
      {/* Messages */}
      <NotifBell
        type="message"
        title="Messages"
        route="/messages"
        icon={<MessageSquare className="h-5 w-5 text-gray-700" />}
      />

      {/* Requests */}
      <NotifBell
        type="request"
        title="Requests"
        route="/requests"
        icon={<BellRing className="h-5 w-5 text-gray-700" />}
      />

      {/* Car Activity */}
      <NotifBell
        type="car_activity"
        title="Car Activity"
        route="/garage/activity"
        icon={<Car className="h-5 w-5 text-gray-700" />}
      />
    </div>
  );
}

export default NotificationBells;
