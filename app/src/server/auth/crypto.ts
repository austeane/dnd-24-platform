import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const PASSWORD_KEY_LENGTH = 64;

export interface SecretHash {
  salt: string;
  hash: string;
}

export async function hashSecret(
  secret: string,
  salt = randomBytes(16).toString("hex"),
): Promise<SecretHash> {
  const derived = await scrypt(secret, salt, PASSWORD_KEY_LENGTH) as Buffer;

  return {
    salt,
    hash: derived.toString("hex"),
  };
}

export async function verifySecret(
  secret: string,
  expected: SecretHash,
): Promise<boolean> {
  const derived = await hashSecret(secret, expected.salt);
  const actualBuffer = Buffer.from(derived.hash, "hex");
  const expectedBuffer = Buffer.from(expected.hash, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(24).toString("base64url");
  return {
    token,
    tokenHash: hashSessionToken(token),
  };
}
