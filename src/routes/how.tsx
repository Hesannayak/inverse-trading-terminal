import { createFileRoute } from "@tanstack/react-router";
import { HowPage } from "@/components/pages/how-page";

export const Route = createFileRoute("/how")({
  head: () => ({
    meta: [
      { title: "How it works — inverse" },
      { name: "description", content: "How leveraged longs and shorts work against a liquidity pool — fees, mechanics and risks." },
      { property: "og:title", content: "How it works — inverse" },
      { property: "og:description", content: "How leveraged longs and shorts work against a liquidity pool — fees, mechanics and risks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowPage,
});
