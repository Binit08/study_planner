export function PaperSkeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-amber-50 via-yellow-50/70 to-amber-50 border-2 border-slate-200 rounded-2xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-label="Loading study sets">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-5 min-h-[290px] flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <PaperSkeleton className="h-6 w-24 rounded-lg" />
              <PaperSkeleton className="h-4 w-16 rounded-md" />
            </div>
            <PaperSkeleton className="h-7 w-4/5" />
            <PaperSkeleton className="h-4 w-full" />
            <PaperSkeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-slate-200">
              <PaperSkeleton className="h-10" />
              <PaperSkeleton className="h-10" />
              <PaperSkeleton className="h-10" />
            </div>
            <PaperSkeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlannerSkeleton() {
  return (
    <div className="space-y-8 pb-16" aria-label="Loading study planner">
      <div className="space-y-3 border-b-2 border-dashed border-slate-200 pb-6">
        <PaperSkeleton className="h-6 w-56" />
        <PaperSkeleton className="h-10 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white p-5 wobbly-border-sm hard-shadow-sm space-y-2">
            <PaperSkeleton className="h-4 w-24" />
            <PaperSkeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-4">
          <PaperSkeleton className="h-7 w-48" />
          <PaperSkeleton className="h-16 w-full" />
          <PaperSkeleton className="h-16 w-full" />
          <PaperSkeleton className="h-16 w-full" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-3">
            <PaperSkeleton className="h-7 w-44" />
            <PaperSkeleton className="h-24 w-full" />
          </div>
          <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-3">
            <PaperSkeleton className="h-7 w-40" />
            <PaperSkeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudyDeckSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto" aria-label="Loading study deck">
      <div className="bg-white p-6 wobbly-border-sm hard-shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <PaperSkeleton className="h-6 w-28" />
          <PaperSkeleton className="h-6 w-20" />
        </div>
        <PaperSkeleton className="h-9 w-2/3" />
        <PaperSkeleton className="h-4 w-full" />
      </div>
      <div className="bg-white p-8 wobbly-border-sm hard-shadow space-y-6 min-h-[300px] flex flex-col justify-between">
        <div className="flex justify-between">
          <PaperSkeleton className="h-6 w-20" />
          <PaperSkeleton className="h-6 w-24" />
        </div>
        <div className="space-y-3 max-w-lg mx-auto w-full">
          <PaperSkeleton className="h-7 w-full" />
          <PaperSkeleton className="h-7 w-4/5 mx-auto" />
        </div>
        <PaperSkeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

