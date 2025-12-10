import HybridMethodsPresentation from "@/components/presentation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function Home() {
  return (
    <NuqsAdapter>
      <HybridMethodsPresentation />
    </NuqsAdapter>
  );
}
