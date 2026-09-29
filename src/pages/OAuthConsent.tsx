import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// Minimal typed wrapper for the beta supabase.auth.oauth namespace
type OAuthResult = { data: any; error: { message: string } | null };
const oauth = (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError('This link is missing its authorization request.');
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/login?next=' + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError('No redirect was returned. Please try again.'); }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? 'An app';

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <CardTitle>{error ? 'Something went wrong' : details ? `Connect ${clientName}` : 'Loading…'}</CardTitle>
          <CardDescription>
            {error
              ? `Could not load this request: ${error}`
              : details
                ? `${clientName} wants to access your expenses and add new ones on your behalf.`
                : 'Checking your request'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!details && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
          {details && !error && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>Deny</Button>
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Approve
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
