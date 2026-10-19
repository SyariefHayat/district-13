import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import z from "zod";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../context/auth-context";
import { toast } from "@/components/ui/toast";

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Enter your username.")
    .max(60, "Username must be 60 characters or fewer."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(255, "Password must be 255 characters or fewer."),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    try {
      await login(data.username.trim(), data.password);
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (error) {
      toast.add({
        title: "Sign in failed",
        description:
          error instanceof Error ? error.message : "Unable to sign in.",
        type: "error",
      });
    }
  }
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your username and password to sign in
          </p>
        </div>
        <Controller
          name="username"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                placeholder="Username"
                autoComplete="username"
                {...field}
              />
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field }) => (
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...field}
              />
            </Field>
          )}
        />
        <Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
