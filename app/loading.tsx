const Loading = () => {
  return (
    <main className="space-y-6 px-5 py-6">
      <div className="flex items-center justify-between">
        <div className="bg-muted h-6 w-24 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-muted size-9 animate-pulse rounded-md" />
          <div className="bg-muted size-9 animate-pulse rounded-md" />
        </div>
      </div>

      <div className="bg-muted h-10 w-full animate-pulse rounded-full" />
      <div className="bg-muted h-[8rem] w-full animate-pulse rounded-2xl" />

      <section className="space-y-3">
        <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        <div className="flex gap-3 overflow-hidden">
          <div className="bg-muted h-[12.5rem] min-w-[18.125rem] animate-pulse rounded-xl" />
          <div className="bg-muted h-[12.5rem] min-w-[18.125rem] animate-pulse rounded-xl" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        <div className="flex gap-3 overflow-hidden">
          <div className="bg-muted h-[12.5rem] min-w-[18.125rem] animate-pulse rounded-xl" />
          <div className="bg-muted h-[12.5rem] min-w-[18.125rem] animate-pulse rounded-xl" />
        </div>
      </section>
    </main>
  );
};

export default Loading;
