import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { FacebookClient } from "./facebook-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function FacebookPage({ searchParams }: Props) {
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: await searchParams,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <FacebookClient sessionId={sessionId} />
    </>
  );
}
