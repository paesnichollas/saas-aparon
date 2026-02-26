const BookingsLoading = () => {
  return (
    <main className="space-y-5 px-5 py-6">
      <div className="bg-muted h-7 w-44 animate-pulse rounded" />

      <section className="space-y-3">
        <div className="bg-muted h-5 w-28 animate-pulse rounded" />
        <div className="bg-muted h-28 w-full animate-pulse rounded-2xl" />
        <div className="bg-muted h-28 w-full animate-pulse rounded-2xl" />
      </section>

      <section className="space-y-3">
        <div className="bg-muted h-5 w-28 animate-pulse rounded" />
        <div className="bg-muted h-28 w-full animate-pulse rounded-2xl" />
      </section>

      <section className="space-y-3">
        <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        <div className="bg-muted h-24 w-full animate-pulse rounded-2xl" />
      </section>
    </main>
  );
};

export default BookingsLoading;
