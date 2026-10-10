/** Build-time configuration read from Vite env vars. */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}
