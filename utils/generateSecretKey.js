import { randomBytes } from "crypto";

export const generateCsrfToken = () => randomBytes(24).toString("hex");

export const generateSecretKey = () => randomBytes(64).toString("hex");

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("CSRF token:", generateCsrfToken());
  console.log("Secret key:", generateSecretKey());
}
