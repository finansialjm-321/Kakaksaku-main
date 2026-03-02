import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Clock, XCircle, Loader2, RefreshCw, Code } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);

  const trxId = searchParams.get("trx_id");
  const billNo = searchParams.get("bill_no") || searchParams.get("bill_ref");

  const fetchStatus = async () => {
    if (!billNo) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('swift-api', {
        body: { action: 'check_status', bill_no: billNo }
      });
      setInquiryResult(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, [billNo]);

  const pCode = inquiryResult?.payment_status_code || searchParams.get("status");
  const isSuccess = pCode === "2";
  const isPending = pCode === "1" || pCode === "0";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Card className={`shadow-xl border-t-8 rounded-3xl ${isSuccess ? 'border-t-green-500' : isPending ? 'border-t-orange-500' : 'border-t-red-500'}`}>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                {loading ? <Loader2 className="animate-spin text-gray-400" /> : 
                 isSuccess ? <CheckCircle2 className="text-green-500 w-12 h-12" /> : 
                 isPending ? <Clock className="text-orange-500 w-12 h-12" /> : <XCircle className="text-red-500 w-12 h-12" />}
              </div>
              <h1 className="text-2xl font-black">{isSuccess ? "Terima Kasih!" : isPending ? "Menunggu Bayar" : "Gagal"}</h1>
              <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2">
                <div className="flex justify-between"><span>No. Ref</span><b>{billNo}</b></div>
                <div className="flex justify-between"><span>ID Transaksi</span><b>{trxId}</b></div>
              </div>
              <Button variant="outline" className="w-full" onClick={fetchStatus} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Refresh Status</Button>
              <Button variant="ghost" className="text-[10px] uppercase text-gray-400" onClick={() => setShowJson(!showJson)}><Code className="mr-1 h-3 w-3" /> Raw JSON untuk UAT</Button>
            </CardContent>
          </Card>
          {showJson && inquiryResult && (
            <div className="bg-slate-900 p-4 rounded-xl overflow-auto text-[10px] text-green-400 font-mono">
              <pre>{JSON.stringify(inquiryResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}