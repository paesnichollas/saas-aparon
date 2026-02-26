const OwnerReportsLoading = () => {
  return (
    <main className="space-y-6">
      <div className="bg-muted h-7 w-40 animate-pulse rounded" />

      <div className="bg-muted h-[5.5rem] w-full animate-pulse rounded-2xl" />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="bg-muted h-44 w-full animate-pulse rounded-2xl" />
        <div className="bg-muted h-44 w-full animate-pulse rounded-2xl" />
        <div className="bg-muted h-44 w-full animate-pulse rounded-2xl" />
      </div>

      <div className="bg-muted h-[20rem] w-full animate-pulse rounded-2xl" />
      <div className="bg-muted h-[11rem] w-full animate-pulse rounded-2xl" />
    </main>
  );
};

export default OwnerReportsLoading;
