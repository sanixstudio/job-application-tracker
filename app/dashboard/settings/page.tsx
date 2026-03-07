import { ExtensionKeyCard } from "../ExtensionKeyCard";

/**
 * Settings page — API key for browser extension, integrations.
 * Industry standard: extension/API keys live in Settings or Integrations, not the main dashboard.
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Manage your Trackr extension and integrations.
        </p>
      </header>
      <section className="space-y-4" aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="sr-only">
          Integrations and extension
        </h2>
        <ExtensionKeyCard />
      </section>
    </div>
  );
}
