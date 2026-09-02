declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

// Supabase Edge Functions resolve this URL import in the Deno runtime.
// @ts-ignore Remote URL imports are not resolved by the default VS Code TypeScript server.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Yetkilendirme gerekli.');

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authorization } } },
    );
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) throw new Error('Geçersiz oturum.');

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { ticketId } = await request.json() as { ticketId?: string };
    if (!ticketId) throw new Error('ticketId gerekli.');

    const { data: ticket, error: ticketError } = await adminClient
      .from('tickets')
      .select('id, company_id, machine_name, position, maintenance_type, urgency, description')
      .eq('id', ticketId)
      .single();
    if (ticketError || !ticket) throw new Error('Arıza kaydı bulunamadı.');

    const { data: caller } = await adminClient
      .from('profiles')
      .select('company_id')
      .eq('id', authData.user.id)
      .single();
    if (!caller || caller.company_id !== ticket.company_id) throw new Error('Yetkisiz istek.');

    const { data: maintenanceUsers } = await adminClient
      .from('profiles')
      .select('id')
      .eq('company_id', ticket.company_id)
      .eq('role', 'bakimci')
      .or(`maintenance_type.eq.${ticket.maintenance_type},maintenance_type.eq.genel`);
    const userIds = (maintenanceUsers ?? []).map((profile: { id: string }) => profile.id);
    if (userIds.length === 0) return json({ sent: 0 });

    const { data: tokens } = await adminClient
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);
    const messages = (tokens ?? []).map(({ token }: { token: string }) => ({
      to: token,
      sound: 'default',
      title: ticket.urgency === 'hat_durusu' ? 'Acil arıza bildirimi' : 'Yeni arıza bildirimi',
      body: `${ticket.machine_name}${ticket.position ? `, pozisyon ${ticket.position}` : ''}: ${ticket.description}`,
      data: { url: `/(bakimci)/${ticket.id}` },
      channelId: 'tickets',
    }));

    if (messages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
    }
    return json({ sent: messages.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Bildirim gönderilemedi.' }, 400);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}