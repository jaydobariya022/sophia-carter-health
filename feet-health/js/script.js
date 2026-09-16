// ── Copyright year ──────────────────────────────────────────────────────────
var yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

// ── Attribution param forwarding ─────────────────────────────────────────────
// Reads approved tracking params from the landing page URL (set by your ad platform)
// and appends them to every ClickBank outbound link.
// utm_campaign is remapped to tid; all others below pass through as-is.
// Any old/unwanted params already on a ClickBank href are stripped first.

var ATTRIBUTION_MAP = [
  ['utm_content', 'tid'],
  ['fbclid', 'fbclid'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['utm_content', 'utm_content'],
  ['utm_term', 'utm_term'],
  ['utm_id', 'utm_id']
];

var CLICKBANK_BASE_PARAMS = ['vendor', 'affiliate', 'cbpage', 'affop'];
var OUTBOUND_LINK_SELECTOR = 'a[href*="hop.clickbank.net"], a[id^="cta"]';

function isModifiedClick(e) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
}

function getCleanClickBankUrl(baseUrl) {
  var url = new URL(baseUrl, window.location.href);

  if (url.hostname !== 'hop.clickbank.net') {
    return url;
  }

  var cleanParams = new URLSearchParams();
  CLICKBANK_BASE_PARAMS.forEach(function (key) {
    var val = url.searchParams.get(key);
    if (val) cleanParams.set(key, val);
  });

  url.search = cleanParams.toString();
  return url;
}

function appendForwardedParams(baseUrl) {
  try {
    var src = new URLSearchParams(window.location.search);
    var url = getCleanClickBankUrl(baseUrl);

    ATTRIBUTION_MAP.forEach(function (pair) {
      var srcKey = pair[0];
      var destKey = pair[1];
      var val = src.get(srcKey);
      if (!val) return;                  // param not in page URL → skip
      url.searchParams.set(destKey, val);
    });

    return url.toString();
  } catch (e) {
    return baseUrl; // safety fallback: return original link unchanged
  }
}

function updateForwardedLink(link) {
  var destination = appendForwardedParams(link.href);
  try { link.setAttribute('href', destination); } catch (err) { }
  return destination;
}

// Attach click handler to every ClickBank hop link AND any element with id^="cta"
document.querySelectorAll(OUTBOUND_LINK_SELECTOR).forEach(function (link) {
  updateForwardedLink(link);

  link.addEventListener('click', function (e) {
    var destination = updateForwardedLink(link);
    var newTab = link.target === '_blank' || isModifiedClick(e);

    if (newTab) {
      // Browser handles the updated href for new-tab clicks.
      return;
    }

    // Same-tab: prevent default and navigate programmatically
    e.preventDefault();
    window.location.href = destination;
  });
});
