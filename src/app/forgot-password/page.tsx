'use client';

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

const resetSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <AuthShell
      description="Kirim tautan reset password ke email kamu."
      footer={<Link className="font-medium text-primary" href="/login">Kembali ke login</Link>}
      title="Lupa password"
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo: `${window.location.origin}/login`,
          });

          if (error) {
            toast.error(error.message);
            return;
          }

          toast.success('Tautan reset password telah dikirim.');
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" placeholder="nama@email.com" {...form.register('email')} />
          {form.formState.errors.email ? <p className="text-sm text-red-500">{form.formState.errors.email.message}</p> : null}
        </div>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Mengirim...' : 'Kirim Reset Link'}
        </Button>
      </form>
    </AuthShell>
  );
}