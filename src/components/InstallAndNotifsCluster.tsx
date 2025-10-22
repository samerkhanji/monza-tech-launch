import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MessageSquare, BellRing, Car, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-[10px] h-4 min-w-4 px-1 bg-red-600 text-white font-medium">
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
  const [isLoading, setIsLoading] = useState(false);
  const counts = useUnreadCounts();
  const unread = counts[type] || 0;

  const load = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      setItems((data as Notif[]) || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markRead = async () => {
    try {
      await supabase.rpc("mark_notifications_read", { p_type: type });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      await load();
      await markRead();
    }
  };

  // Handle click outside to close dropdown
  const handleClickOutside = (e: React.MouseEvent) => {
    if (open) {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative h-10 w-10 inline-flex items-center justify-center",
          "rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors bg-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          open && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 border-blue-200"
        )}
        aria-label={`${title} notifications`}
        type="button"
      >
        {icon}
        <Badge count={unread} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 font-semibold text-gray-900 border-b bg-gray-50 flex items-center justify-between">
            <span className="flex items-center gap-2">
              {icon}
              {title}
            </span>
            <button 
              onClick={() => setOpen(false)} 
              className="hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              items.map((n) => (
                <div key={n.id} className="px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {n.body}
                        </div>
                      )}
                      {n.payload?.vin && (
                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-1 rounded">
                          VIN: {n.payload.vin}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <a 
                href={route} 
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              >
                View all {title.toLowerCase()}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Click outside overlay to close dropdown */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
}

export default function InstallAndNotifsCluster() {
  return (
    <div className="flex items-center gap-2">
      {/* Your existing Install App button */}
      <Button className="h-10 px-4">Install App</Button>

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
