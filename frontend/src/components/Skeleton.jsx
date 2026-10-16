const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-zinc-100" />
    <div className="p-3 space-y-2.5">
      <div className="h-3 bg-zinc-100 rounded w-1/3" />
      <div className="h-4 bg-zinc-100 rounded w-full" />
      <div className="h-3 bg-zinc-100 rounded w-1/2" />
      <div className="h-5 bg-zinc-100 rounded w-1/3" />
      <div className="h-3 bg-zinc-100 rounded w-2/3" />
      <div className="h-8 bg-zinc-100 rounded-lg w-full mt-2" />
    </div>
  </div>
);

const SkeletonProductDetails = () => (
  <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 pt-24 animate-pulse">
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16 items-start">
      <div className="lg:w-5/12 w-full">
        <div className="h-[500px] bg-zinc-100 rounded-2xl" />
      </div>
      <div className="lg:w-4/12 w-full space-y-5">
        <div className="h-8 bg-zinc-100 rounded w-3/4" />
        <div className="h-4 bg-zinc-100 rounded w-1/4" />
        <div className="h-12 bg-zinc-100 rounded w-1/3" />
        <div className="h-24 bg-zinc-100 rounded w-full" />
        <div className="h-16 bg-zinc-100 rounded w-full" />
      </div>
      <div className="lg:w-3/12 w-full">
        <div className="h-64 bg-zinc-100 rounded-2xl" />
      </div>
    </div>
  </div>
);

const SkeletonRow = ({ lines = 1 }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-zinc-100 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
    ))}
  </div>
);

export { SkeletonCard, SkeletonProductDetails, SkeletonRow };