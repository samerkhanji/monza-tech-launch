
import React from 'react';
import { QueryClient as TanstackQueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new TanstackQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

interface QueryClientProps {
  children: React.ReactNode;
}

export const QueryClient: React.FC<QueryClientProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
