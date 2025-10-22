# DEPLOYMENT_GUIDE.md

A thorough, step-by-step guide to deploy Monza S.A.L. with robust RLS, an OWNER bypass, and a full System Audit Log.

## 0) Prerequisites
- Supabase project created.
- Local Node.js 18+ and npm 9+.
- Repo cloned locally.
- Your app uses the Supabase JS client and route guards with a loading state before enforcing access checks.

## 1) Configure environment

### Frontend (.env.local)
```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Server/Edge (Supabase → Project Settings → Secrets)
```ini
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=...            # if used by functions
```

**Tip:** Never expose the Service Role key in the browser.

## 2) Run database setup
Open Supabase SQL Editor and paste `production_setup_script.sql` (included in this repo). It:

- Creates/normalizes `public.users` (Auth → App mapping).
- Adds `public.is_owner(uid)` helper.
- Enables a permissive, universal OWNER bypass on all public tables.
- Creates `public.audit_log` with triggers on every table (INSERT/UPDATE/DELETE).
- Adds RLS so OWNERs can read the entire audit log (optionally users see their own rows).

Safe to re-run; it's idempotent.

## 3) Create first OWNER
Supabase → Authentication → Add user → set email/password, auto-confirm.

Copy the Auth UID.

Map into `public.users`:

```sql
insert into public.users (id, email, role)
values ('PASTE_AUTH_UID', 'owner@example.com', 'OWNER')
on conflict (id) do update set email = excluded.email, role = excluded.role;
```

Roles are uppercased automatically by a trigger.

## 4) Wire the UI
- Ensure a route to `/audit-log` renders your System Audit Log page.
- Side menu item: "System Audit Log" → `/audit-log`.
- Verify route guards wait for session to load before checking role:
  - If `session === undefined`, show a loader instead of blocking.

## 5) Verify security & logging

### A) OWNER access
Log in as the OWNER and confirm all previously blocked pages now open.

### B) Audit logging
Insert/Update/Delete in any module (Inventory, Garage, Sales).

Check System Audit Log shows the three events with diffs (changed fields).

### C) Non-OWNER access (optional)
Log in as Assistant/Technician: ensure they only see permitted pages and (optionally) their own audit rows.

## 6) Operations

### Retention (optional):
```sql
create or replace function public.purge_old_audit()
returns void language sql as $$
  delete from public.audit_log where at < now() - interval '180 days';
$$;
```
Run monthly via pg_cron or manually.

**Rollback:** The script includes safe drop statements to detach triggers if needed.

## 7) Troubleshooting

**Page still looks like Dashboard:** route import mismatch. Ensure `/audit-log` imports the correct component, clear Vite cache (`rm -rf node_modules/.vite`).

**Blocked as OWNER:** check for RESTRICTIVE policies via:
```sql
select schemaname, tablename, policyname, permissive
from pg_policies where schemaname in ('public','storage')
order by schemaname, tablename;
```
Remove/adjust restrictive ones or OR-in `public.is_owner(auth.uid())`.

**No audit rows:** confirm triggers exist:
```sql
select event_object_table as table, trigger_name
from information_schema.triggers
where trigger_name like 'trg_audit_%';
```

You're done. Ship it!