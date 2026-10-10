import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { NlbOnayClient } from "./nlb-onay-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function NlbOnayPage({ searchParams }: Props) {
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: await searchParams,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <NlbOnayClient sessionId={sessionId} />
    </>
  );
}
