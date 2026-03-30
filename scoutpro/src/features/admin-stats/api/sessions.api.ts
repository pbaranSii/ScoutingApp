import { supabase } from "@/lib/supabase";

const SESSION_ID_KEY = "scoutpro:current_session_id";

function getDeviceType(): string {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
}

function getBrowser(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Inne";
}

export async function startSession(): Promise<string | null> {
  try {
    const deviceType = getDeviceType();
    const browser = getBrowser();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

    const { data, error } = await (supabase as any).rpc("user_session_start", {
      p_device_type: deviceType,
      p_browser: browser,
      p_ip_address: null,
      p_user_agent: userAgent,
    });

    if (error) {
      console.warn("session start failed", error);
      return null;
    }

    const sessionId = data as string;
    try {
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        } catch {
      /* ignore */
    }
    return sessionId;
  } catch (e) {
    console.warn("session start error", e);
    return null;
  }
}

export async function endSession(): Promise<void> {
  try {
    let sessionId: string | null = null;
    try {
      sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      sessionStorage.removeItem(SESSION_ID_KEY);
    } catch {
      /* ignore */
    }

    await (supabase as any).rpc("user_session_end", {
      p_session_id: sessionId,
    });
  } catch (e) {
    console.warn("session end error", e);
  }
}
