// ── Copyright year ──────────────────────────────────────────────────────────
var yearTarget = document.querySelector('[data-year]');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

// ── Lead Capture & PDF Download Logic ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  function processLeadDownload(event, formElement, successBoxId) {
    event.preventDefault();

    var nameInput = formElement.querySelector('input[name="full_name"]');
    var emailInput = formElement.querySelector('input[name="email"]');

    var nameVal = nameInput ? nameInput.value.trim() : '';
    var emailVal = emailInput ? emailInput.value.trim() : '';

    if (!nameVal || !emailVal) {
      alert('Please enter both your name and email address to claim your free book.');
      return;
    }

    // Basic email format check
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Fire Meta Pixel Lead Event (if Meta Pixel script is active)
    if (typeof fbq === 'function') {
      try {
        fbq('track', 'Lead', {
          content_name: '7-Minute Weight Loss Reset EBook',
          category: 'Free Download'
        });
      } catch (err) {
        console.log('Pixel track lead:', err);
      }
    }

    // Hide form container and show success box
    var formCard = formElement.closest('.lead-form-card');
    var successBox = document.getElementById(successBoxId);

    if (formCard && successBox) {
      formCard.style.display = 'none';
      successBox.style.display = 'block';
    }

    // Trigger PDF File Download automatically
    var pdfPath = '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';
    var link = document.createElement('a');
    link.href = pdfPath;
    link.download = 'The-7-Minute-Weight-Loss-Reset.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Attach submit handler to Hero Form
  var heroForm = document.getElementById('hero-lead-form');
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      processLeadDownload(e, heroForm, 'hero-download-success');
    });
  }

  // Attach submit handler to Bottom Form
  var bottomForm = document.getElementById('bottom-lead-form');
  if (bottomForm) {
    bottomForm.addEventListener('submit', function (e) {
      processLeadDownload(e, bottomForm, 'bottom-download-success');
    });
  }
});

// ── Attribution param forwarding (preserves URL tracking) ────────────────────
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
      if (!val) return;
      url.searchParams.set(destKey, val);
    });

    return url.toString();
  } catch (e) {
    return baseUrl;
  }
}

function updateForwardedLink(link) {
  var destination = appendForwardedParams(link.href);
  try { link.setAttribute('href', destination); } catch (err) { }
  return destination;
}

document.querySelectorAll(OUTBOUND_LINK_SELECTOR).forEach(function (link) {
  updateForwardedLink(link);

  link.addEventListener('click', function (e) {
    var destination = updateForwardedLink(link);
    var newTab = link.target === '_blank' || isModifiedClick(e);

    if (newTab) {
      return;
    }

    e.preventDefault();
    window.location.href = destination;
  });
});
