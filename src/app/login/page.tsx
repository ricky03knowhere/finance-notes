'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <AuthShell
      description="Masuk untuk mengakses wallet, transaksi, dan ringkasan finansial kamu."
      footer={
        <>
          Belum punya akun? <Link className="font-medium text-primary" href="/register">Daftar</Link>
        </>
      }
      title="Masuk ke Finora"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signInWithPassword(values);

          if (error) {
            toast.error(error.message);
            return;
          }

          toast.success('Login berhasil');
          router.push('/wallet');
          router.refresh();
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" placeholder="nama@email.com" {...form.register('email')} />
          {form.formState.errors.email ? <p className="text-sm text-red-500">{form.formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input id="login-password" type="password" placeholder="••••••••" {...form.register('password')} />
          {form.formState.errors.password ? <p className="text-sm text-red-500">{form.formState.errors.password.message}</p> : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link className="text-muted-foreground hover:text-foreground" href="/forgot-password">
            Lupa password?
          </Link>
        </div>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Memproses...' : 'Masuk'}
        </Button>
        <Button className="w-full" type="button" variant="outline" onClick={handleGoogleSignIn}>
          Masuk dengan Google
        </Button>
      </form>
    </AuthShell>
  );
}