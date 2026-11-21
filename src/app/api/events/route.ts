import { connection } from "next/server";
import { getRealtimeEmitter } from "@/lib/store";

export async function GET() {
  await connection();
  const emitter = getRealtimeEmitter();
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      send({ type: "connected", timestamp: Date.now() });

      const onChange = (event: { reason: string; timestamp: number }) => {
        send({ type: "state_changed", ...event });
      };

      emitter.on("state_changed", onChange);
      const heartbeat = setInterval(() => {
        send({ type: "ping", timestamp: Date.now() });
      }, 20000);

      cleanup = () => {
        clearInterval(heartbeat);
        emitter.off("state_changed", onChange);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
