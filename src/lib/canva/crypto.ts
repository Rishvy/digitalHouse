import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCODING = "hex";

function getKey(): Buffer {
  const key = process.env.CANVA_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("CANVA_TOKEN_ENCRYPTION_KEY is not set");
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);
  
  const authTag = cipher.getAuthTag().toString(ENCODING);
  return `${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, ENCODING, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
