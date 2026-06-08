const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Builds a drag-to-bookmarks-bar `javascript:` href that opens the clip popup.
 * Set NEXT_PUBLIC_APP_URL to your deployed origin before copying the result.
 */
export function buildBookmarkletHref(appUrl: string = DEFAULT_APP_URL): string {
  const base = appUrl.replace(/\/$/, "");

  return `javascript:(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);window.open('${base}/clip?url='+u+'&title='+t,'articleClipper','width=480,height=640,scrollbars=yes,resizable=yes')})();`;
}

/** Ready-to-copy bookmarklet for the configured NEXT_PUBLIC_APP_URL. */
export const BOOKMARKLET_HREF = buildBookmarkletHref();
