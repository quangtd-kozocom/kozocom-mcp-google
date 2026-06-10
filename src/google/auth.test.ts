import { beforeEach, describe, expect, it, vi } from "vitest";

const embeddedOAuthMock = vi.hoisted(() => ({
  value: null as { client_id: string; client_secret?: string } | null,
}));

const googleMock = vi.hoisted(() => {
  const constructorArgs: unknown[][] = [];
  const authUrlOptions: Record<string, unknown>[] = [];
  const tokenOptions: Record<string, unknown>[] = [];

  class OAuth2 {
    private readonly redirectUri?: string;

    constructor(...args: unknown[]) {
      constructorArgs.push(args);
      const options = args[0];
      this.redirectUri =
        typeof options === "object" && options && "redirectUri" in options
          ? String(options.redirectUri)
          : typeof args[2] === "string"
            ? args[2]
            : undefined;
    }

    generateCodeVerifierAsync() {
      return Promise.resolve({ codeVerifier: "verifier", codeChallenge: "challenge" });
    }

    generateAuthUrl(options: Record<string, unknown>) {
      authUrlOptions.push(options);
      const url = new URL("http://auth.local/oauth");
      if (this.redirectUri) url.searchParams.set("redirect_uri", this.redirectUri);
      for (const [key, value] of Object.entries(options)) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(" "));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
      return url.toString();
    }

    getToken(options: Record<string, unknown>) {
      tokenOptions.push(options);
      return Promise.resolve({
        tokens: {
          access_token: "access",
          refresh_token: "refresh",
          scope: "scope-a scope-b",
        },
      });
    }

    setCredentials = vi.fn();
    on = vi.fn();
  }

  return { OAuth2, constructorArgs, authUrlOptions, tokenOptions };
});

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
}));

vi.mock("googleapis", () => ({
  Auth: {
    ClientAuthentication: { None: "None" },
    CodeChallengeMethod: { S256: "S256" },
  },
  google: {
    auth: { OAuth2: googleMock.OAuth2 },
    oauth2: vi.fn(() => ({
      userinfo: {
        get: vi.fn(() => Promise.resolve({ data: { email: "user@example.com" } })),
      },
    })),
  },
}));

vi.mock("open", () => ({ default: vi.fn(() => Promise.resolve()) }));
vi.mock("./generated/oauth-client.js", () => ({
  get EMBEDDED_OAUTH_CLIENT() {
    return embeddedOAuthMock.value;
  },
}));

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { clearToken, loadToken, readClientSecret, runLoginFlow, saveToken } from "./auth.js";
import { TOKEN_PATH, TOKEN_PROXY_URL } from "../config/constants.js";
import { NotAuthenticatedError } from "../core/result.js";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);
const mockRm = vi.mocked(rm);

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  embeddedOAuthMock.value = null;
  googleMock.constructorArgs.length = 0;
  googleMock.authUrlOptions.length = 0;
  googleMock.tokenOptions.length = 0;
});

describe("loadToken", () => {
  it("returns parsed credentials", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ access_token: "a", refresh_token: "r" }));
    expect(await loadToken()).toEqual({ access_token: "a", refresh_token: "r" });
  });

  it("returns null when no token file exists", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    expect(await loadToken()).toBeNull();
  });
});

describe("saveToken", () => {
  it("creates the config dir and writes JSON with 0600 perms", async () => {
    mockMkdir.mockResolvedValue(undefined as never);
    mockWriteFile.mockResolvedValue();
    await saveToken({ access_token: "a", refresh_token: "r" });
    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(
      TOKEN_PATH,
      expect.stringContaining("access_token"),
      { mode: 0o600 },
    );
  });
});

describe("clearToken", () => {
  it("returns true when a token was removed", async () => {
    mockRm.mockResolvedValue();
    expect(await clearToken()).toBe(true);
  });

  it("returns false when nothing to remove", async () => {
    mockRm.mockRejectedValue(new Error("ENOENT"));
    expect(await clearToken()).toBe(false);
  });
});

describe("readClientSecret", () => {
  it("parses a Desktop ('installed') OAuth client config", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ installed: { client_id: "cid", client_secret: "secret" } }),
    );
    expect(await readClientSecret()).toEqual({ client_id: "cid", client_secret: "secret" });
  });

  it("parses a Web OAuth client config", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ web: { client_id: "wid", client_secret: "wsec" } }),
    );
    expect(await readClientSecret()).toEqual({ client_id: "wid", client_secret: "wsec" });
  });

  it("accepts a public OAuth client with only client_id", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: { client_id: "cid" } }));
    expect(await readClientSecret()).toEqual({ client_id: "cid", client_secret: undefined });
  });

  it("prefers an embedded OAuth client over a stale default config file", async () => {
    embeddedOAuthMock.value = { client_id: "embedded", client_secret: "embedded-secret" };
    mockReadFile.mockResolvedValue(
      JSON.stringify({ installed: { client_id: "local", client_secret: "local-secret" } }),
    );

    expect(await readClientSecret()).toEqual({
      client_id: "embedded",
      client_secret: "embedded-secret",
    });
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it("throws NotAuthenticatedError when the file is missing", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    await expect(readClientSecret()).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("throws when client_id is absent", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: {} }));
    await expect(readClientSecret()).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

/** Stub global fetch: proxy URL → canned response, everything else (the loopback
 *  callback) → real fetch. Returns the captured proxy request bodies. */
function stubProxy(response: Response): { calls: { body: unknown }[]; realFetch: typeof fetch } {
  const realFetch = globalThis.fetch;
  const calls: { body: unknown }[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === TOKEN_PROXY_URL) {
      calls.push({ body: JSON.parse(String(init?.body)) });
      return Promise.resolve(response.clone());
    }
    return realFetch(input, init);
  });
  return { calls, realFetch };
}

describe("runLoginFlow", () => {
  it("does PKCE then exchanges the code via the token proxy (no secret)", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: { client_id: "cid" } }));
    mockMkdir.mockResolvedValue(undefined as never);
    mockWriteFile.mockResolvedValue();
    const { calls, realFetch } = stubProxy(
      new Response(
        JSON.stringify({
          access_token: "access",
          refresh_token: "refresh",
          scope: "scope-a scope-b",
          token_type: "Bearer",
          expires_in: 3599,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await runLoginFlow({
      openBrowser: false,
      timeoutMs: 1_000,
      onUrl: (authUrl) => {
        const url = new URL(authUrl);
        expect(url.searchParams.get("code_challenge")).toBe("challenge");
        expect(url.searchParams.get("code_challenge_method")).toBe("S256");
        const redirectUri = url.searchParams.get("redirect_uri");
        if (!redirectUri) throw new Error("Missing redirect_uri.");
        void realFetch(`${redirectUri}?code=auth-code`);
      },
    });

    expect(result).toEqual({ email: "user@example.com", scopes: ["scope-a", "scope-b"] });
    expect(googleMock.constructorArgs[0]).toEqual([
      {
        clientId: "cid",
        redirectUri: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/oauth2callback$/),
        clientAuthentication: "None",
      },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.body).toEqual({
      grant_type: "authorization_code",
      code: "auth-code",
      code_verifier: "verifier",
      redirect_uri: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/oauth2callback$/),
    });
  });

  it("rejects when the proxy/Google returns a token error", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ installed: { client_id: "cid" } }));
    const { realFetch } = stubProxy(
      new Response(JSON.stringify({ error: "invalid_grant", error_description: "Bad Request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      runLoginFlow({
        openBrowser: false,
        timeoutMs: 1_000,
        onUrl: (authUrl) => {
          const redirectUri = new URL(authUrl).searchParams.get("redirect_uri");
          if (!redirectUri) throw new Error("Missing redirect_uri.");
          void realFetch(`${redirectUri}?code=auth-code`);
        },
      }),
    ).rejects.toThrow(/Bad Request/);
  });
});
