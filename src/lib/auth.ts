import 'server-only';

import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CurrentUser = {
  id: string;
  email: string;
  full_name?: string | null;
};

async function getDevelopmentUser(): Promise<CurrentUser> {
  const email = 'dev@finora.local';

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName: 'Development User',
    },
    update: {},
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
  };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    if (process.env.NODE_ENV === 'development') {
      return getDevelopmentUser();
    }

    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    full_name: data.user.user_metadata?.full_name ?? null,
  } satisfies CurrentUser;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    // Login route tetap dipakai di production; development langsung memakai user dev.
    redirect('/login');
  }

  return user;
}