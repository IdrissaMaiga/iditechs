// Suspense fallback for the portfolio routes. Deliberately minimal: the previous
// version faked a progress bar on a 120ms interval with invented status text, and
// positioned 20 divs with Math.random() during render, which mismatched on hydration.
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-blue-400"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
