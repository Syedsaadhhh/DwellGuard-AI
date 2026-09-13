import crypto from "crypto";

export interface TokenGenerator {
  generateToken(): { rawToken: string; tokenHash: string };
  hashToken(rawToken: string): string;
}

export class CryptoTokenGenerator implements TokenGenerator {
  /**
   * Generates a cryptographically strong random token with at least 192 bits (24 bytes) of entropy,
   * returned as a 48-character hex string, along with its SHA-256 hash.
   */
  generateToken(): { rawToken: string; tokenHash: string } {
    // 32 bytes = 256 bits of entropy (exceeds the 192-bit minimum requirement)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    return { rawToken, tokenHash };
  }

  hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }
}
