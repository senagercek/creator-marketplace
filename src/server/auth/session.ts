import crypto from "crypto";

const SESSION_COOKIE_NAME = "cm_user_session";
const SECRET = process.env.SESSION_SECRET || "dev-session-secret-at-least-32-chars-long";

export function signUserId(userId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(userId);
  const digest = hmac.digest("hex");
  return `${userId}.${digest}`;
}

export function verifySignedUserId(signedValue: string): string | null {
  if (!signedValue || !signedValue.includes(".")) {
    return null;
  }

  const [userId, receivedDigest] = signedValue.split(".");
  if (!userId || !receivedDigest) {
    return null;
  }

  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(userId);
  const expectedDigest = hmac.digest("hex");

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(receivedDigest, "hex"),
      Buffer.from(expectedDigest, "hex")
    );
    return isMatch ? userId : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
