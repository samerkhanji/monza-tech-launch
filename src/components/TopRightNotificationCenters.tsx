import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Bell, MessageSquare, Car, ClipboardCheck, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import '@/styles/notification-centers-fix.css';

/**
 * Drop-in top-right notification area with three independent centers:
 *  - Messages
 *  - Car notifications
 *  - Requests (with Accept / Deny inline)
 *
 * Data model (Postgres / Supabase):
 *  Table: public.notifications
 *  Columns:
 *    id uuid primary key default gen_random_uuid()
 *    created_at timestamptz default now()
 *    type text check (type in ('message','car','request')) not null
 *    title text not null
 *    body text
 *    entity_id text  -- e.g., chat_id, car_id, request_id
 *    route text      -- frontend route to open (fallbacks exist below)
 *    read_at timestamptz
 *    meta jsonb      -- arbitrary payload { request_status, ... }
 *    actor_id uuid   -- who generated this notification (optional)
 *    recipient_id uuid not null  -- user who sees it
 *    action_required boolean default false
 *    action_state text check (action_state in ('pending','accepted','denied')) default 'pending'
 *
 *  Index suggestions:
 *    create index on notifications(recipient_id, type, read_at);
 *    create index on notifications(type);
 *    create index on notifications((meta->>'priority'));
 *
 * Realtime: enable replication for this table in Supabase (realtime). See SQL snippet at bottom.
 */

// ---- Configure Supabase client (reads from env) ----
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ---- Types ----
export type NotificationType = "message" | "car" | "request";
export type NotificationRow = {
  id: string;
  created_at: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_id: string | null;
  route: string | null;
  read_at: string | null;
  meta: Record<string, any> | null;
  actor_id: string | null;
  recipient_id: string;
  action_required: boolean;
  action_state: "pending" | "accepted" | "denied";
};

// ---- Helper: destination route fallbacks per type ----
function routeFor(n: NotificationRow): string {
  if (n.route) return n.route;
  switch (n.type) {
    case "message":
      // entity_id is chat_id
      return `/message-center`;
    case "car":
      // entity_id is car_id (VIN or internal id)
      return `/car-inventory`;
    case "request":
      // entity_id is request_id
      return `/message-center`;
    default:
      return "/";
  }
}

// ---- Actions ----
async function markRead(id: string) {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

async function setRequestState(id: string, state: "accepted" | "denied") {
  await supabase
    .from("notifications")
    .update({ action_state: state, action_required: false, read_at: new Date().toISOString() })
    .eq("id", id);
}

// Optional: also update your real request table when accepting/denying
async function applyBusinessRequestMutation(requestId: string, state: "accepted" | "denied") {
  // Example: update request status in your domain table
  await supabase.from("requests").update({ status: state }).eq("id", requestId);
}

// ---- Hook: load + live subscribe per type ----
function useNotifications(recipientId: string | null, type: NotificationType) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipientId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", recipientId)
        .eq("type", type)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!mounted) return;
      if (error) {
        console.error(error);
      } else if (data) {
        setRows(data as NotificationRow[]);
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`notif_${type}_${recipientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${recipientId}` },
        (payload) => {
          // naive refresh on any change for this user; you can refine by type
          if (payload.new && (payload.new as any).type === type) {
            setRows((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex((r) => r.id === (payload.new as any).id);
              if (payload.eventType === 'DELETE') {
                return copy.filter((r) => r.id !== (payload.old as any).id);
              }
              if (idx >= 0) {
                copy[idx] = payload.new as any;
                return copy.sort((a,b)=> (a.created_at < b.created_at ? 1 : -1));
              }
              return [payload.new as any, ...copy].slice(0, 50);
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [recipientId, type]);

  const unread = useMemo(() => rows.filter((r) => !r.read_at).length, [rows]);

  return { rows, unread, loading };
}

// ---- Presentational item ----
function NotificationItem({
  n,
  onOpen,
  onAccept,
  onDeny,
}: {
  n: NotificationRow;
  onOpen: (n: NotificationRow) => void;
  onAccept?: (n: NotificationRow) => void;
  onDeny?: (n: NotificationRow) => void;
}) {
  return (
    <Card
      className={cn(
        "mb-3 border transition-all",
        !n.read_at ? "border-primary/50 shadow" : "border-muted"
      )}
    >
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold line-clamp-1">{n.title}</CardTitle>
          {!n.read_at && <Badge variant="secondary">New</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {n.body && <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{n.body}</p>}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onOpen(n)}>
            Open <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          {n.type === "request" && n.action_state === "pending" && (
            <>
              <Button size="sm" variant="default" onClick={() => onAccept?.(n)} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-1 h-4 w-4" /> Accept
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDeny?.(n)}>
                <X className="mr-1 h-4 w-4" /> Deny
              </Button>
            </>
          )}
          {n.type === "request" && n.action_state !== "pending" && (
            <Badge variant={n.action_state === 'accepted' ? 'default' : 'destructive'} className="ml-1">
              {n.action_state}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main component ----
export default function TopRightNotificationCenters({
  userId,
}: {
  userId: string; // current signed-in user id
}) {
  const navigate = useNavigate();

  const msgs = useNotifications(userId, "message");
  const cars = useNotifications(userId, "car");
  const reqs = useNotifications(userId, "request");

  const openAndMark = async (n: NotificationRow) => {
    await markRead(n.id);
    navigate(routeFor(n));
  };

  const acceptReq = async (n: NotificationRow) => {
    await setRequestState(n.id, "accepted");
    if (n.entity_id) await applyBusinessRequestMutation(n.entity_id, "accepted");
  };
  const denyReq = async (n: NotificationRow) => {
    await setRequestState(n.id, "denied");
    if (n.entity_id) await applyBusinessRequestMutation(n.entity_id, "denied");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Messages Center */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="relative p-2 rounded-2xl hover:bg-muted focus-visible:outline-none">
            <MessageSquare className="h-6 w-6" />
            {msgs.unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground px-1">
                {msgs.unread > 99 ? '99+' : msgs.unread}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] p-0 bg-white border-l-2 border-gray-300 shadow-2xl sheet-content-fix notification-dialog-final-fix" style={{backgroundColor: '#ffffff', zIndex: 9999}}>
          <SheetHeader className="p-4 bg-white border-b notification-header notification-dialog-final-fix">
            <SheetTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/> Messages</SheetTitle>
            <SheetDescription>Latest chats and mentions.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="h-[80vh] p-4 bg-white notification-scroll-area notification-dialog-final-fix" style={{backgroundColor: '#ffffff'}}>
            {msgs.rows.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
            {msgs.rows.map((n) => (
              <NotificationItem key={n.id} n={n} onOpen={openAndMark} />
            ))}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Car Center */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="relative p-2 rounded-2xl hover:bg-muted focus-visible:outline-none">
            <Car className="h-6 w-6" />
            {cars.unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground px-1">
                {cars.unread > 99 ? '99+' : cars.unread}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] p-0 bg-white border-l-2 border-gray-300 shadow-2xl sheet-content-fix notification-dialog-final-fix" style={{backgroundColor: '#ffffff', zIndex: 9999}}>
          <SheetHeader className="p-4 bg-white border-b notification-header notification-dialog-final-fix">
            <SheetTitle className="flex items-center gap-2"><Car className="h-5 w-5"/> Cars</SheetTitle>
            <SheetDescription>Movements, status changes, PDI, handovers.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="h-[80vh] p-4 bg-white notification-scroll-area notification-dialog-final-fix" style={{backgroundColor: '#ffffff'}}>
            {cars.rows.length === 0 && <p className="text-sm text-muted-foreground">No car notifications.</p>}
            {cars.rows.map((n) => (
              <NotificationItem key={n.id} n={n} onOpen={openAndMark} />
            ))}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Requests Center */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="relative p-2 rounded-2xl hover:bg-muted focus-visible:outline-none">
            <ClipboardCheck className="h-6 w-6" />
            {reqs.unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground px-1">
                {reqs.unread > 99 ? '99+' : reqs.unread}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[460px] p-0 bg-white border-l-2 border-gray-300 shadow-2xl" style={{backgroundColor: '#ffffff', zIndex: 9999}}>
          <SheetHeader className="p-4 bg-white border-b notification-header notification-dialog-final-fix">
            <SheetTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5"/> Requests</SheetTitle>
            <SheetDescription>Approve or deny directly here.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="h-[80vh] p-4 bg-white notification-scroll-area notification-dialog-final-fix" style={{backgroundColor: '#ffffff'}}>
            {reqs.rows.length === 0 && <p className="text-sm text-muted-foreground">No requests pending.</p>}
            {reqs.rows.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onOpen={openAndMark}
                onAccept={acceptReq}
                onDeny={denyReq}
              />
            ))}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -----------------------------
  SQL — create table + realtime
------------------------------*/

/**
-- Enable extensions
create extension if not exists pgcrypto;

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('message','car','request')),
  title text not null,
  body text,
  entity_id text,
  route text,
  read_at timestamptz,
  meta jsonb,
  actor_id uuid,
  recipient_id uuid not null,
  action_required boolean not null default false,
  action_state text not null default 'pending' check (action_state in ('pending','accepted','denied'))
);

-- Helpful indexes
create index if not exists notifications_recipient_type_idx on public.notifications(recipient_id, type, read_at);
create index if not exists notifications_type_idx on public.notifications(type);

-- RLS
alter table public.notifications enable row level security;
create policy "user can read own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);
create policy "user can update own notifications" on public.notifications
  for update using (auth.uid() = recipient_id);
create policy "service can insert notifications" on public.notifications
  for insert with check (true); -- tighten if using service role or background functions only

-- Realtime (Supabase Dashboard → Database → Replication → Add table → notifications)
-- Or via SQL:
-- NOTE: Supabase enables realtime via config; the client channel above listens to postgres_changes.

*/

/* -----------------------------
  Example: inserting notifications from app code
------------------------------*/

/**
// New chat message → message notification
await supabase.from('notifications').insert({
  type: 'message',
  title: `New message from ${senderName}`,
  body: textSnippet,
  entity_id: chatId,
  recipient_id: recipientUserId,
});

// Car movement update → car notification
await supabase.from('notifications').insert({
  type: 'car',
  title: 'Car moved to Showroom 2 / B1',
  body: `${model} • ${plateOrVin}`,
  entity_id: carId,
  route: `/cars/${carId}?tab=location`,
  recipient_id: ownerUserId,
});

// Request requires approval → request notification
await supabase.from('notifications').insert({
  type: 'request',
  title: 'Approve parts purchase (USD 320)',
  body: 'Khalil requested front brake pads for VOYAH FREE',
  entity_id: requestId,
  recipient_id: approverUserId,
  action_required: true
});
*/

/* -----------------------------
  Styling notes (Tailwind)
------------------------------*/
/**
- Buttons are minimal icons with numeric badges (top-right), matching your top bar.
- Sheets slide in from the right. Height is viewport-dependent with ScrollArea inside.
- Unread items show a primary border glow; read items are muted.
- Requests show inline Accept / Deny. After action, we update both the notification and the domain request table.
*/
