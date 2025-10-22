# QUICK_START.md

## Monza S.A.L. — Quick Start (≈5 minutes)

### 1) Clone & set environment
```bash
git clone <YOUR_REPO_URL> monza-sal
cd monza-sal

# Frontend .env (Vite)
cp .env.example .env.local || true
# Then edit .env.local and set:
# VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
# VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 2) Apply DB setup in Supabase
Open Supabase → SQL Editor.

Paste the contents of `production_setup_script.sql` from this repo.

Run it (safe to re-run).

### 3) Create your first OWNER
Supabase → Authentication → Add user → Auto-confirm.

Copy the Auth UID (UUID).

Supabase → SQL Editor → Run:

```sql
insert into public.users (id, email, role)
values ('PASTE_AUTH_UID', 'owner@example.com', 'OWNER')
on conflict (id) do update set email = excluded.email, role = excluded.role;
```

### 4) Start the app
```bash
npm i
npm run dev
```

### 5) Log in
Use the OWNER credentials.

Visit System Audit Log: verify entries appear when you create/edit/delete records.

### 6) Smoke tests
Create a test car / update / delete → confirm all actions show in System Audit Log.

That's it. You're live!