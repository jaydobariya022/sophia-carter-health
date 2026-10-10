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
    var consentInput = formElement.querySelector('input[name="marketing_consent"]');
    var submitBtn = formElement.querySelector('button[type="submit"]');

    var nameVal = nameInput ? nameInput.value.trim() : '';
    var emailVal = emailInput ? emailInput.value.trim() : '';
    var consentVal = consentInput ? consentInput.checked : false;

    if (!nameVal || !emailVal) {
      alert('Please enter both your name and email address to claim your free book.');
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      if (!submitBtn.getAttribute('data-original-text')) {
        submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
      }
      submitBtn.innerText = 'SENDING EMAIL & PREPARING PDF...';
    }

    var payload = {
      full_name: nameVal,
      email: emailVal,
      product_id: 'weight-loss-reset',
      marketing_consent: consentVal,
      source: 'weight_loss_landing_page'
    };

    fetch('/api/pdf-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('API server returned status ' + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'GET INSTANT ACCESS NOW';
        }

        if (!data.success) {
          alert(data.error || 'Failed to process request. Please try again.');
          return;
        }

        // Fire Meta Pixel Lead Event
        if (typeof fbq === 'function') {
          try {
            fbq('track', 'Lead', {
              content_name: data.productName || '7-Minute Weight Loss Reset EBook',
              category: 'Free Download'
            });
          } catch (err) { }
        }

        // Hide form container and show success box
        var formCard = formElement.closest('.lead-form-card');
        var successBox = document.getElementById(successBoxId);

        if (formCard && successBox) {
          formElement.style.display = 'none';
          successBox.style.display = 'block';
        }

        // Trigger PDF File Download automatically
        var pdfUrl = data.downloadUrl || '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';
        var link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'The-7-Minute-Weight-Loss-Reset.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(function (err) {
        console.warn('[PDF Download Fallback Activated]', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'GET INSTANT ACCESS NOW';
        }

        // Fire Meta Pixel Lead Event
        if (typeof fbq === 'function') {
          try {
            fbq('track', 'Lead', {
              content_name: '7-Minute Weight Loss Reset EBook',
              category: 'Free Download'
            });
          } catch (err) { }
        }

        // Fallback: Show success box & trigger direct PDF download gracefully
        var formCard = formElement.closest('.lead-form-card');
        var successBox = document.getElementById(successBoxId);

        if (formCard && successBox) {
          formElement.style.display = 'none';
          successBox.style.display = 'block';
        }

        var pdfUrl = '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';
        var link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'The-7-Minute-Weight-Loss-Reset.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
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
