export const isAbsoluteUrl = (p: string) => /^https:\/\//i.test(p);

/** Path relatif -> URL di origin sendiri (mengikuti BASE_URL); URL absolut tepercaya dipakai apa adanya. */
export function mediaUrl(path: string): string {
  return isAbsoluteUrl(path) ? path : `${import.meta.env.BASE_URL}${path}`;
}
