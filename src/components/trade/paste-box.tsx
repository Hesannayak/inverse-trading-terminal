import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isValidAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTradeStore } from "@/store/trade-store";

export function PasteBox() {
  const navigate = useNavigate();
  const pasteValue = useTradeStore((s) => s.pasteValue);
  const setPasteValue = useTradeStore((s) => s.setPasteValue);
  const [error, setError] = useState<string | null>(null);

  const go = () => {
    const addr = pasteValue.trim();
    if (!isValidAddress(addr)) {
      setError("Enter a valid 0x… contract address");
      return;
    }
    setError(null);
    navigate({ to: "/trade/$token", params: { token: addr.toLowerCase() } });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteValue(text.trim());
      setError(null);
    } catch {
      setError("Clipboard unavailable — paste manually");
    }
  };

  return (
    <div className="border border-border bg-card p-2">
      <div className="flex gap-1">
        <Input
          placeholder="Paste any BEP-20 contract address…"
          value={pasteValue}
          onChange={(e) => {
            setPasteValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && go()}
          className="num h-11 border-border bg-elevated text-[12px]"
        />
        <Button
          variant="outline"
          className="h-11 shrink-0 border-border bg-elevated px-3 text-[12px]"
          onClick={paste}
        >
          Paste
        </Button>
        <Button className="h-11 shrink-0 bg-long px-4 text-[12px] font-semibold text-background hover:bg-long/85" onClick={go}>
          Go
        </Button>
      </div>
      {error && <p className="mt-1 text-[10px] text-short">{error}</p>}
      {!error && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Long or short any BEP-20 token against the liquidity pool.
        </p>
      )}
    </div>
  );
}
