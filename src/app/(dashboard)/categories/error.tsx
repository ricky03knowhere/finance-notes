'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CategoriesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-xl">
      <CardHeader>
        <CardTitle>Kategori tidak dapat dimuat</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Coba lagi</Button>
      </CardContent>
    </Card>
  );
}