import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/portfolio-page";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — inverse" },
      { name: "description", content: "Your open leveraged positions, trade history and performance on BNB Chain." },
      { property: "og:title", content: "Portfolio — inverse" },
      { property: "og:description", content: "Your open leveraged positions, trade history and performance on BNB Chain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortfolioPage,
});
