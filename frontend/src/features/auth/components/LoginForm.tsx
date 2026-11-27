import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import z from "zod";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
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
  const [showPassword, setShowPassword] = useState(false);
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
      className={cn("flex flex-col gap-5 lg:gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <h1 className="text-2xl font-bold leading-tight sm:text-[28px] md:text-[32px]">
          Masuk untuk melanjutkan ke ruang kerja anda
        </h1>
        <Controller
          name="username"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input id="username" autoComplete="username" {...field} />
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
              <InputGroup className="h-11.25">
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...field}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <IconEyeOff className="size-6" />
                    ) : (
                      <IconEye className="size-6" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          )}
        />

        <Field className="space-y-2">
          <Button
            type="submit"
            className="h-11.25"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in…" : "Login"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Butuh akses?{" "}
            <Link to="/signup" className="underline underline-offset-4">
              Hubungi admin untuk mendaftar
            </Link>
          </p>
        </Field>
      </FieldGroup>
    </form>
  );
}
