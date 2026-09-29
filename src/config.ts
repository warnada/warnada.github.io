import type { LicensePolicy } from '@/lib/jamendo';

const env = import.meta.env;
/** Client ID Jamendo (publik by design, terlihat di browser). Kosong = hanya katalog demo. */
export const JAMENDO_CLIENT_ID: string = (env.VITE_JAMENDO_CLIENT_ID ?? '').trim();
/** Bawaan 'commercial' (tanpa NC) sampai syarat penggunaan Jamendo untuk kasus ini dipastikan. */
export const LICENSE_POLICY: LicensePolicy = env.VITE_JAMENDO_LICENSE_POLICY === 'all' ? 'all' : 'commercial';
