const BarbershopLoading = () => {
  return (
    <main className="space-y-6 pb-8">
      <div className="bg-muted h-[18.5625rem] w-full animate-pulse" />

      <div className="space-y-6 px-5">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>

        <div className="bg-muted h-24 w-full animate-pulse rounded-2xl" />
        <div className="bg-muted h-40 w-full animate-pulse rounded-2xl" />

        <div className="space-y-3">
          <div className="bg-muted h-5 w-28 animate-pulse rounded" />
          <div className="bg-muted h-28 w-full animate-pulse rounded-2xl" />
          <div className="bg-muted h-28 w-full animate-pulse rounded-2xl" />
        </div>
      </div>
    </main>
  );
};

export default BarbershopLoading;
