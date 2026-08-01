import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactElement, type ReactNode, useMemo } from 'react';

import { createQueryClient } from '@/infrastructure/query/queryClient';

export function QueryProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const client = useMemo(() => createQueryClient(), []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
