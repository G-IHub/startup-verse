export default function SentryErrorFallback() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
      role="alert"
    >
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Please refresh the page or try again later.
      </p>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        onClick={() => window.location.reload()}
      >
        Refresh page
      </button>
    </div>
  );
}
