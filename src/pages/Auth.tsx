export default function Auth() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold text-bp-green">BufferPong</h1>
      <p className="text-bp-muted">
        Sign in to register for the Retreat '26 tournament.
      </p>
      <button
        type="button"
        className="rounded-md bg-bp-green px-5 py-3 text-sm font-medium text-bp-cream shadow-sm hover:bg-bp-green-50"
      >
        Continue with Google
      </button>
      <p className="text-xs text-bp-muted">
        Anyone can browse the bracket and rules without signing in.
      </p>
    </div>
  );
}
