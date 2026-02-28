"use client";

// OnboardingModal is no longer needed — username is set at login.
// Kept as a no-op so existing imports don't break.

export default function OnboardingModal(_props: {
  userId?: string;
  hasUsername: boolean;
  onOnboardingComplete?: (username: string) => void;
}) {
  return null;
}
