import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import MyMatch from "@/pages/MyMatch";
import Bracket from "@/pages/Bracket";
import Rules from "@/pages/Rules";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/my-match" replace />} />
              <Route path="/bracket" element={<Bracket />} />
              <Route path="/rules" element={<Rules />} />

              <Route
                path="/my-match"
                element={
                  <RequireAuth>
                    <MyMatch />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <Admin />
                  </RequireAuth>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/my-match" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
