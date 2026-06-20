'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function BecomeAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBecomeAdmin = async () => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/become-admin');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/set-admin', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message });
        // Refresh session
        window.location.reload();
      } else {
        setError(data.error || 'Failed to become admin');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container max-w-md mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Become Admin</h1>
          <p className="text-text-secondary mt-2">
            This will give you admin access to the site
          </p>
        </div>

        {result?.success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-green-500">{result.message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-red-500">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {!session?.user ? (
            <Button 
              onClick={() => router.push('/auth/signin?callbackUrl=/become-admin')}
              className="w-full"
            >
              Sign In First
            </Button>
          ) : (
            <Button 
              onClick={handleBecomeAdmin}
              disabled={isLoading || result?.success}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Make Me Admin'}
            </Button>
          )}

          <p className="text-sm text-text-muted text-center">
            {session?.user 
              ? `Logged in as: ${session.user.email}`
              : 'Please sign in to continue'}
          </p>
        </div>
      </Card>
    </div>
  );
}
