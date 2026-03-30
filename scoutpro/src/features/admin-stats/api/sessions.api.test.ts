import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { endSession, startSession } from "./sessions.api";

const SESSION_ID_KEY = "scoutpro:current_session_id";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const mockRpc = vi.mocked(supabase).rpc as ReturnType<typeof vi.fn>;

function mockSessionStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    _store: store,
  };
}

describe("sessions.api", () => {
  let sessionStorageMock: ReturnType<typeof mockSessionStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock = mockSessionStorage();
    vi.stubGlobal("sessionStorage", sessionStorageMock);
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("startSession", () => {
    it("calls user_session_start RPC with device_type, browser, user_agent", async () => {
      mockRpc.mockResolvedValue({ data: "session-uuid-123", error: null });

      await startSession();

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith("user_session_start", {
        p_device_type: "desktop",
        p_browser: "Chrome",
        p_ip_address: null,
        p_user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    });

    it("stores returned session id in sessionStorage on success", async () => {
      mockRpc.mockResolvedValue({ data: "stored-session-id", error: null });

      const result = await startSession();

      expect(result).toBe("stored-session-id");
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        SESSION_ID_KEY,
        "stored-session-id"
      );
    });

    it("returns null and does not throw when RPC errors", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await startSession();

      expect(result).toBeNull();
      expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("endSession", () => {
    it("calls user_session_end with session_id from sessionStorage", async () => {
      sessionStorageMock._store[SESSION_ID_KEY] = "existing-session-id";

      await endSession();

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith("user_session_end", {
        p_session_id: "existing-session-id",
      });
    });

    it("calls user_session_end with null when no session in storage", async () => {
      await endSession();

      expect(mockRpc).toHaveBeenCalledWith("user_session_end", {
        p_session_id: null,
      });
    });

    it("removes session id from sessionStorage before calling RPC", async () => {
      sessionStorageMock._store[SESSION_ID_KEY] = "sid";
      await endSession();
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(SESSION_ID_KEY);
    });
  });
});
