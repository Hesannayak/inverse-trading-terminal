import { createFileRoute } from "@tanstack/react-router";
import { PoolPage } from "@/components/pages/pool-page";

export const Route = createFileRoute("/pool")({
  head: () => ({
    meta: [
      { title: "Pool — inverse" },
      { name: "description", content: "Provide BNB liquidity for leveraged longs and shorts and earn trading fees." },
      { property: "og:title", content: "Pool — inverse" },
      { property: "og:description", content: "Provide BNB liquidity for leveraged longs and shorts and earn trading fees." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PoolPage,
});
