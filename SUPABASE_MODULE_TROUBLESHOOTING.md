# Supabase Module Export Error Troubleshooting

## Error Description
```
Uncaught SyntaxError: The requested module '/node_modules/@supabase/postgrest-js/dist/cjs/index.js?v=24cc5212' does not provide an export named 'default'
```

## Root Cause
This error occurs due to a mismatch between ES modules and CommonJS modules in the Supabase PostgREST client. The module is trying to import a default export that doesn't exist.

## Solutions Implemented

### 1. **Vite Configuration Updates**
- Added proper module resolution for Supabase packages
- Excluded Supabase modules from pre-bundling
- Added global definition for browser compatibility
- Added deduplication for Supabase client

### 2. **Supabase Client Configuration**
- Updated client configuration with proper options
- Added fallback client for development
- Implemented dynamic imports as backup

### 3. **Cache Clearing**
- Cleared Vite cache to force re-bundling
- Restarted development server

## Quick Fixes

### Option 1: Use the Updated Configuration
The Vite config has been updated to handle Supabase modules properly. Restart your development server:

```bash
npm run dev-fast
```

### Option 2: Clear Cache and Restart
```bash
# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Restart development server
npm run dev-fast
```

### Option 3: Use Fallback Client
If the main client still has issues, use the fallback client:

```typescript
// Instead of:
import { supabase } from '@/integrations/supabase/client';

// Use:
import { supabase } from '@/integrations/supabase/client-fallback';
```

## Prevention

### 1. **Module Resolution**
Always ensure Supabase modules are properly excluded from pre-bundling:

```typescript
// vite.config.ts
optimizeDeps: {
  exclude: [
    '@supabase/supabase-js',
    '@supabase/postgrest-js',
    '@supabase/storage-js',
    '@supabase/realtime-js'
  ]
}
```

### 2. **Global Definition**
Add global definition for browser compatibility:

```typescript
// vite.config.ts
define: {
  global: 'globalThis',
}
```

### 3. **Client Configuration**
Use proper client configuration:

```typescript
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

## Testing

Use the test utility to verify the connection:

```typescript
import { testSupabaseConnection } from '@/utils/supabaseTest';

// Test connection
const isConnected = await testSupabaseConnection();
console.log('Supabase connected:', isConnected);
```

## Alternative Solutions

### 1. **Downgrade Supabase Version**
If issues persist, try downgrading to a stable version:

```bash
npm install @supabase/supabase-js@2.38.0
```

### 2. **Use CDN Version**
For development, you can use the CDN version:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### 3. **Dynamic Imports**
Use dynamic imports to avoid module resolution issues:

```typescript
const { createClient } = await import('@supabase/supabase-js');
```

## Monitoring

Check the browser console for:
- Module resolution errors
- Import/export mismatches
- Network errors

## Support

If the issue persists:
1. Check Supabase GitHub issues
2. Verify package versions compatibility
3. Consider using the fallback client
4. Report the issue with detailed error logs 