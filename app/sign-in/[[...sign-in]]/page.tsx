import { SignIn } from "@clerk/nextjs";

/**
 * Clerk sign-in page. Redirect after sign-in is set via
 * NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
