import { createFileRoute } from "@tanstack/react-router";
import { MarketsPage } from "@/components/pages/markets-page";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — inverse" },
      { name: "description", content: "Every tradeable BEP-20 token on BNB Chain: price, OI, liquidity and oracle status." },
      { property: "og:title", content: "Markets — inverse" },
      { property: "og:description", content: "Every tradeable BEP-20 token on BNB Chain: price, OI, liquidity and oracle status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketsPage,
});
