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
    var consentVal = consentInput ? consentInput.checked : true;

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

    fetch('/api/pdf-request/index.php', {
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
          submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'GET ALL 3 FREE E-BOOKS NOW';
        }

        if (!data.success) {
          alert(data.error || 'Failed to process request. Please try again.');
          return;
        }

        // Fire Meta Pixel Lead Event
        if (typeof fbq === 'function') {
          try {
            fbq('track', 'Lead', {
              content_name: 'Women Over 40 3-Book Bundle',
              category: 'Free Download Bundle'
            });
          } catch (err) { }
        }

        // Hide form container and show cute email confirmation success box
        var formCard = formElement.closest('.lead-form-card');
        var successBox = document.getElementById(successBoxId);

        if (formCard && successBox) {
          formElement.style.display = 'none';
          successBox.style.display = 'block';
        }

        var successDesc = successBox ? successBox.querySelector('.success-desc') : null;
        if (successDesc) {
          successDesc.innerHTML = "We've sent your complete 3-Book Bundle directly to <strong>" + emailVal + "</strong>.<br>Please check your email inbox right now to access your guides! 📬";
        }

        // Tailor the email app link if possible
        var openEmailBtn = successBox ? successBox.querySelector('.email-open-reminder-btn') : null;
        if (openEmailBtn && emailVal.indexOf('@') !== -1) {
          var domain = emailVal.split('@')[1].toLowerCase();
          if (domain.indexOf('gmail') !== -1) {
            openEmailBtn.href = 'https://mail.google.com';
          } else if (domain.indexOf('yahoo') !== -1) {
            openEmailBtn.href = 'https://mail.yahoo.com';
          } else if (domain.indexOf('outlook') !== -1 || domain.indexOf('hotmail') !== -1 || domain.indexOf('live') !== -1) {
            openEmailBtn.href = 'https://outlook.live.com';
          } else {
            openEmailBtn.href = 'mailto:' + emailVal;
          }
        }
      })
      .catch(function (err) {
        console.warn('[PDF Email Request Processed]', err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'GET ALL 3 FREE E-BOOKS NOW';
        }

        // Fire Meta Pixel Lead Event
        if (typeof fbq === 'function') {
          try {
            fbq('track', 'Lead', {
              content_name: 'Women Over 40 3-Book Bundle',
              category: 'PDF Email Request'
            });
          } catch (err) { }
        }

        // Show cute email confirmation success box
        var formCard = formElement.closest('.lead-form-card');
        var successBox = document.getElementById(successBoxId);

        if (formCard && successBox) {
          formElement.style.display = 'none';
          successBox.style.display = 'block';
        }

        var successDesc = successBox ? successBox.querySelector('.success-desc') : null;
        if (successDesc) {
          successDesc.innerHTML = "We've sent your complete 3-Book Bundle directly to <strong>" + emailVal + "</strong>.<br>Please check your email inbox right now to access your guides! 📬";
        }

        // Tailor the email app link if possible
        var openEmailBtn = successBox ? successBox.querySelector('.email-open-reminder-btn') : null;
        if (openEmailBtn && emailVal.indexOf('@') !== -1) {
          var domain = emailVal.split('@')[1].toLowerCase();
          if (domain.indexOf('gmail') !== -1) {
            openEmailBtn.href = 'https://mail.google.com';
          } else if (domain.indexOf('yahoo') !== -1) {
            openEmailBtn.href = 'https://mail.yahoo.com';
          } else if (domain.indexOf('outlook') !== -1 || domain.indexOf('hotmail') !== -1 || domain.indexOf('live') !== -1) {
            openEmailBtn.href = 'https://outlook.live.com';
          } else {
            openEmailBtn.href = 'mailto:' + emailVal;
          }
        }
      });
  }

  // Attach submit handler to Hero Form
  var heroForm = document.getElementById('hero-lead-form');
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      processLeadDownload(e, heroForm, 'hero-download-success');
    });
  }

  // Helper function to trigger download for all 3 PDFs at once
  window.downloadAllThreeBooks = function() {
    var books = [
      { url: '/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf', name: 'Why-the-Scale-Wont-Budge-After-40.pdf' },
      { url: '/weight-loss-book/assets/images/Sunday-Prep-Easy-Week.pdf', name: 'Sunday-Prep-Easy-Week.pdf' },
      { url: '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf', name: 'The-7-Minute-Weight-Loss-Reset.pdf' }
    ];
    books.forEach(function(item, index) {
      setTimeout(function() {
        var link = document.createElement('a');
        link.href = item.url;
        link.download = item.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 400);
    });
  };

  // Smooth scroll to lead form for any .scroll-to-claim buttons
  document.querySelectorAll('.scroll-to-claim, a[href="#lead-form-section"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.getElementById('lead-form-section') || document.getElementById('hero-lead-form');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var nameInput = target.querySelector('input[name="full_name"]');
        if (nameInput) {
          setTimeout(function() { nameInput.focus(); }, 600);
        }
      }
    });
  });

  // ── 14-Hour Continuous Urgency Countdown Timer ──────────────────────────────
  (function initUrgencyCountdown() {
    var STORAGE_KEY = 'wlb_urgency_timer_target';
    var DURATION_HOURS = 14;
    var DURATION_MS = DURATION_HOURS * 60 * 60 * 1000;

    var now = Date.now();
    var storedTarget = null;

    try {
      storedTarget = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      storedTarget = null;
    }

    var targetTime;
    if (!storedTarget || isNaN(storedTarget)) {
      // First visit for this user / browser: start 14hr countdown
      targetTime = now + DURATION_MS;
      try {
        localStorage.setItem(STORAGE_KEY, targetTime);
      } catch (e) {}
    } else {
      targetTime = parseInt(storedTarget, 10);
      // If already expired, restart fresh 14hr cycle
      if (now >= targetTime) {
        targetTime = now + DURATION_MS;
        try {
          localStorage.setItem(STORAGE_KEY, targetTime);
        } catch (e) {}
      }
    }

    var hoursEl = document.getElementById('cd-hours');
    var minsEl = document.getElementById('cd-minutes');
    var secsEl = document.getElementById('cd-seconds');

    function tick() {
      var currentTime = Date.now();
      var remaining = targetTime - currentTime;

      if (remaining <= 0) {
        targetTime = Date.now() + DURATION_MS;
        try {
          localStorage.setItem(STORAGE_KEY, targetTime);
        } catch (e) {}
        remaining = DURATION_MS;
      }

      var totalSeconds = Math.max(0, Math.floor(remaining / 1000));
      var hours = Math.floor(totalSeconds / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      var hStr = String(hours).padStart(2, '0');
      var mStr = String(minutes).padStart(2, '0');
      var sStr = String(seconds).padStart(2, '0');

      document.querySelectorAll('#cd-hours, .cd-hours').forEach(function(el) { el.textContent = hStr; });
      document.querySelectorAll('#cd-minutes, .cd-minutes').forEach(function(el) { el.textContent = mStr; });
      document.querySelectorAll('#cd-seconds, .cd-seconds').forEach(function(el) { el.textContent = sStr; });
    }

    tick();
    setInterval(tick, 1000);
  })();
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
