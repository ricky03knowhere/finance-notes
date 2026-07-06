'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  return (
    <AuthShell
      description="Buat akun baru untuk menyimpan data keuangan secara aman."
      footer={
        <>
          Sudah punya akun? <Link className="font-medium text-primary" href="/login">Masuk</Link>
        </>
      }
      title="Buat akun Finora"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                full_name: values.fullName,
              },
            },
          });

          if (error) {
            toast.error(error.message);
            return;
          }

          toast.success('Pendaftaran berhasil. Cek email untuk verifikasi.');
          router.push('/login');
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="register-name">Nama Lengkap</Label>
          <Input id="register-name" placeholder="Nama kamu" {...form.register('fullName')} />
          {form.formState.errors.fullName ? <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input id="register-email" placeholder="nama@email.com" {...form.register('email')} />
          {form.formState.errors.email ? <p className="text-sm text-red-500">{form.formState.errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input id="register-password" type="password" placeholder="••••••••" {...form.register('password')} />
          {form.formState.errors.password ? <p className="text-sm text-red-500">{form.formState.errors.password.message}</p> : null}
        </div>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Mendaftarkan...' : 'Daftar'}
        </Button>
      </form>
    </AuthShell>
  );
}