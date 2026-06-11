export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col">{children}</div>
    </main>
  );
}
