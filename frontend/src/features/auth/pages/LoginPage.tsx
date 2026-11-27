import { Navigate } from "react-router";
import { LoginForm } from "../components/LoginForm";
import { useLoginSession } from "../hooks/useLogin";

export default function LoginPage() {
  const { user, isLoading } = useLoginSession();
  if (isLoading) return <div className="p-6 text-sm">Restoring session…</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="grid min-h-svh bg-[url('/images/moody-crimson.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex flex-col gap-6 px-5 py-10 sm:p-8 lg:gap-4 lg:p-10">
        <div className="flex justify-start">
          <a href="#">
            <img
              src="/logo/logo.png"
              alt="District 13"
              className="h-8 w-auto object-contain"
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center py-4 sm:py-6 lg:py-0">
          <div className="w-full max-w-sm sm:max-w-100">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
