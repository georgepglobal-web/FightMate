// Migration hook — no longer needed with localStorage provider.
// Kept as a no-op so existing imports don't break.

export function useSessionMigration(_userId: string | null) {
  return {
    migrationNeeded: false,
    migrating: false,
    migrationResult: null as null,
    migrate: () => {},
    dismiss: () => {},
  };
}
