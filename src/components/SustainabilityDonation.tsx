import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

const sustainabilityAmounts = [2000, 5000, 10000, 20000];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface SustainabilityDonationProps {
  selectedAmount: number | null;
  customAmount: string;
  onAmountSelect: (amount: number) => void;
  onCustomAmountChange: (amount: string) => void;
}

export default function SustainabilityDonation({
  selectedAmount,
  customAmount,
  onAmountSelect,
  onCustomAmountChange,
}: SustainabilityDonationProps) {
  const getFinalAmount = () => {
    if (customAmount) return parseInt(customAmount);
    return selectedAmount;
  };

  const finalAmount = getFinalAmount();

  return (
    <Card className="border border-border/50 bg-card/50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <CardTitle className="text-lg">Donasi untuk keberlanjutan Jakarta Mengabdi</CardTitle>
            <CardDescription className="mt-2">
              Opsi tambahan (Opsional)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Dukungan tambahan Anda membantu kami terus melayani Jakarta dengan lebih baik. Setiap kontribusi untuk keberlanjutan platform kami sangat berarti.
        </p>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Pilih Nominal Donasi (Opsional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {sustainabilityAmounts.map(amount => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount && !customAmount ? "gold" : "outline"}
                size="sm"
                onClick={() => {
                  onAmountSelect(amount);
                  onCustomAmountChange("");
                }}
                className="text-sm"
              >
                {formatRupiah(amount)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-sustainability" className="text-sm font-medium">
            Masukkan nominal lain
          </Label>
          <Input
            id="custom-sustainability"
            type="number"
            placeholder="Masukkan jumlah lain"
            value={customAmount}
            onChange={e => {
              onCustomAmountChange(e.target.value);
              if (e.target.value) {
                onAmountSelect(null as any);
              }
            }}
            min={1000}
            className="text-sm"
          />
        </div>

        {finalAmount > 0 && (
          <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Donasi untuk Keberlanjutan</span>
            <span className="text-base font-bold text-primary">{formatRupiah(finalAmount)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
