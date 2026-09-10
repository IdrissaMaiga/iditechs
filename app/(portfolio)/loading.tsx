// Suspense fallback for the portfolio routes. In normal flow rather than a fixed
// overlay so the navbar (rendered by the layout) stays put while a page loads.
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712]">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-blue-400"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
