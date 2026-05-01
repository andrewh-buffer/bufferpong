import { NavLink, Outlet, Link } from "react-router-dom";
import { Trophy, User, BookOpen, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const tabs = [
  { to: "/my-match", label: "My match", icon: Swords },
  { to: "/bracket", label: "Bracket", icon: Trophy },
  { to: "/rules", label: "Rules", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell() {
  const { session, loading } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b border-bp-cream-dark bg-bp-cream/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold text-bp-green">
            BufferPong
          </Link>
          {!loading && !session ? (
            <Link
              to="/auth"
              className="text-xs font-medium text-bp-green underline"
            >
              Sign in
            </Link>
          ) : (
            <span className="text-xs text-bp-muted">Retreat '26</span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-bp-cream-dark bg-bp-cream">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2 text-xs",
                  isActive ? "text-bp-green" : "text-bp-muted",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
