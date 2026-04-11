import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import md5 from "https://esm.sh/blueimp-md5" // Library ini jauh lebih stabil untuk bundling

// Helper SHA-1
async function sha1(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // HEADER CORS (Penting agar browser tidak memblokir)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    const F_USER = Deno.env.get('FASPAY_USER_ID') || '';
    const F_PASS = Deno.env.get('FASPAY_PASSWORD') || '';
    const F_MERCHANT = Deno.env.get('FASPAY_MERCHANT_ID') || '';

    if (body.action === 'request_payment') {
      const { bill_no, amount, cust_name, email } = body;
      
      // Rumus Signature: sha1(md5(user+pass+bill_no+amount))
      const stringToHash = F_USER + F_PASS + bill_no + amount;
      const md5Result = md5(stringToHash); // Menggunakan blueimp-md5
      const signature = await sha1(md5Result);

      const faspayData = {
        merchant_id: F_MERCHANT,
        merchant_name: "Jakarta Mengabdi",
        bill_no,
        bill_date: new Date().toISOString().replace('T', ' ').split('.')[0],
        bill_total: amount,
        bill_desc: "Donasi Jakarta Mengabdi",
        cust_no: "123456",
        cust_name,
        email,
        return_url: "http://localhost:8080/donasi/status",
        signature
      };

      const response = await fetch("https://xpress-sandbox.faspay.co.id/v4/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faspayData)
      });

      const result = await response.json();
      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
})