import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashSecret,
  hashSessionToken,
  verifySecret,
} from "./crypto.ts";

describe("auth crypto helpers", () => {
  it("hashes and verifies secrets", async () => {
    const secret = await hashSecret("correct horse battery staple");

    await expect(
      verifySecret("correct horse battery staple", secret),
    ).resolves.toBe(true);
    await expect(verifySecret("wrong", secret)).resolves.toBe(false);
  });

  it("creates opaque session tokens and stable hashes", () => {
    const { token, tokenHash } = createSessionToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tokenHash).toBe(hashSessionToken(token));
    expect(tokenHash).not.toBe(token);
  });
});
