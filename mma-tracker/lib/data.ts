// Active data provider — selected by NEXT_PUBLIC_DATA_PROVIDER env var
// Set to "supabase" to use Supabase, anything else (or unset) uses localStorage

import type { DataProvider } from "./data-provider";
import { LocalStorageProvider } from "./local-provider";

function createProvider(): DataProvider {
  if (process.env.NEXT_PUBLIC_DATA_PROVIDER === "supabase") {
    // Dynamic import would be cleaner but we need sync export.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SupabaseProvider } = require("./supabase-provider");
    return new SupabaseProvider();
  }
  return new LocalStorageProvider();
}

export const db = createProvider();

// Re-export types for convenience
export type {
  DataProvider,
  GroupMember,
  SparringSession,
  DbSession,
  ShoutboxMessage,
  LocalUser,
} from "./data-provider";
