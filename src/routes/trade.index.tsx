import { createFileRoute } from "@tanstack/react-router";
import { TradePage } from "@/components/trade/trade-page";

export const Route = createFileRoute("/trade/")({
  head: () => ({
    meta: [
      { title: "Trade — inverse" },
      { name: "description", content: "Long or short any BEP-20 token on BNB Chain against a liquidity pool." },
      { property: "og:title", content: "Trade — inverse" },
      { property: "og:description", content: "Long or short any BEP-20 token on BNB Chain against a liquidity pool." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <TradePage token={null} />,
});
