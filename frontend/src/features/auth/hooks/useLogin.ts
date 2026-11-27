import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../context/auth-context";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";

/** Provides auth session state for the login page guard. */
export function useLoginSession() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

/** Manages login form state, validation, password visibility, and submission. */
export function useLoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data.username.trim(), data.password);
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (error) {
      toast.add({
        title: "Login Gagal",
        description:
          error instanceof Error ? error.message : "Unable to sign in.",
        type: "error",
      });
    }
  }

  return {
    control: form.control,
    isSubmitting: form.formState.isSubmitting,
    showPassword,
    togglePasswordVisibility: () => setShowPassword((prev) => !prev),
    onSubmit: form.handleSubmit(onSubmit),
  };
}
