/**
 * Article Clipper bookmarklet — readable source
 *
 * 1. Replace YOUR_APP_URL with your hosted Next.js origin (no trailing slash).
 * 2. Minify the IIFE body into a single line.
 * 3. Prefix with javascript: and save as a browser bookmark.
 *
 * Or import BOOKMARKLET_HREF from src/lib/bookmarklet.ts after setting
 * NEXT_PUBLIC_APP_URL in .env.local.
 */
(function () {
  var YOUR_APP_URL = "https://articles-knowledge-graph.vercel.app/";
  var url = encodeURIComponent(window.location.href);
  var title = encodeURIComponent(window.document.title);
  window.open(
    YOUR_APP_URL + "/clip?url=" + url + "&title=" + title,
    "articleClipper",
    "width=480,height=640,scrollbars=yes,resizable=yes",
  );
})();

/**
 * Minified javascript: string (replace YOUR_APP_URL before use):
 *
 * javascript:(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);window.open('YOUR_APP_URL/clip?url='+u+'&title='+t,'articleClipper','width=480,height=640,scrollbars=yes,resizable=yes')})();
 */
