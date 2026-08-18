export async function CreatedNotice({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  if (!created) return null;

  return (
    <p className="notice" role="status">
      {created === "confirm"
        ? "Account created. Open the confirmation link we emailed you, then sign in."
        : "Account created. Sign in to continue."}
    </p>
  );
}
