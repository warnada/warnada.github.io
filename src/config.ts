import { parseLicensePolicy } from '@/lib/jamendo';

const env = import.meta.env;
/** Client ID Jamendo (publik by design, terlihat di browser). Kosong = hanya katalog demo. */
export const JAMENDO_CLIENT_ID: string = (env.VITE_JAMENDO_CLIENT_ID ?? '').trim();
export const LICENSE_POLICY = parseLicensePolicy(env.VITE_JAMENDO_LICENSE_POLICY);
