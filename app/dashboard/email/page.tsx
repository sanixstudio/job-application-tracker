import { EmailInboundCard } from "../EmailInboundCard";
import { EmailSuggestionsCard } from "../EmailSuggestionsCard";

/**
 * Email page — forward application emails and manage suggestions.
 * Dedicated tab keeps email workflow separate from dashboard and applications (SaaS nav best practice).
 */
export default function EmailPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Email
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Forward application emails to Trackr; we’ll suggest adding or updating applications.
        </p>
      </header>
      <section className="space-y-4" aria-labelledby="email-heading">
        <h2 id="email-heading" className="sr-only">
          Forward and suggestions
        </h2>
        <EmailInboundCard />
        <EmailSuggestionsCard />
      </section>
    </div>
  );
}
