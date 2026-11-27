import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import { cn } from "cn";
import { Link } from "react-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginForm } from "../hooks/useLogin";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    control,
    isSubmitting,
    showPassword,
    togglePasswordVisibility,
    onSubmit,
  } = useLoginForm();

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-5 lg:gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <h1 className="text-2xl font-bold leading-tight sm:text-[28px] md:text-[32px]">
          Masuk untuk melanjutkan ke ruang kerja anda
        </h1>
        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input id="username" autoComplete="username" {...field} />
            </Field>
          )}
        />
        <Controller
          name="password"
          control={control}
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
                    onClick={togglePasswordVisibility}
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
          <Button type="submit" className="h-11.25" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner />
                <span>Signing in…</span>
              </>
            ) : (
              "Login"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
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
