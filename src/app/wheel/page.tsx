import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { buildShareMetadata } from "@/lib/share-metadata";
import { WheelClient } from "./wheel-client";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return buildShareMetadata({
    title: "Mercator — Kolo Sreče",
    description:
      "Mercator posebna akcija Kolo Sreče! Preizkusite svojo srečo in osvojite ekskluzivne nagrade.",
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
