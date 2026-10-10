/**
 * Sophia Carter Health - Brevo Email Automation PDF Modal Script
 * Controls client-side validation, accessibility, modal state and backend API submission.
 */

(function () {
  'use strict';

  var currentProductId = 'weight-loss-reset';
  var lastFocusedElement = null;
  var isSubmitting = false;

  // 1. Inject CSS if not already present
  function ensureStylesLoaded() {
    if (!document.getElementById('bpm-modal-styles')) {
      var link = document.createElement('link');
      link.id = 'bpm-modal-styles';
      link.rel = 'stylesheet';
      link.href = '/assets/css/brevo-pdf-modal.css';
      document.head.appendChild(link);
    }
  }

  // 2. Build and inject Modal HTML DOM structure if missing
  function ensureModalInDom() {
    if (document.getElementById('bpm-overlay')) return;

    var modalHtml = `
      <div id="bpm-overlay" class="bpm-overlay" role="dialog" aria-modal="true" aria-labelledby="bpm-title-heading" aria-describedby="bpm-desc-text">
        <div class="bpm-dialog" tabindex="-1">
          <div class="bpm-header">
            <span class="bpm-header-badge">⚡ Instant PDF Access</span>
            <h2 id="bpm-title-heading" class="bpm-title">Get Your PDF</h2>
            <p id="bpm-desc-text" class="bpm-description">Enter your details to receive your PDF guide by email.</p>
            <button id="bpm-close-btn" class="bpm-close-btn" aria-label="Close dialog">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div class="bpm-body">
            <!-- Alert Error Box -->
            <div id="bpm-error-alert" class="bpm-error-alert" role="alert"></div>

            <!-- Lead Form View -->
            <form id="bpm-lead-form" class="bpm-form" novalidate>
              <div class="bpm-field-group">
                <label for="bpm-full-name" class="bpm-label">Full Name *</label>
                <div class="bpm-input-wrapper">
                  <svg class="bpm-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <input type="text" id="bpm-full-name" name="full_name" class="bpm-input" placeholder="Enter your full name" required />
                </div>
              </div>

              <div class="bpm-field-group">
                <label for="bpm-email" class="bpm-label">Email Address *</label>
                <div class="bpm-input-wrapper">
                  <svg class="bpm-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <input type="email" id="bpm-email" name="email" class="bpm-input" placeholder="Enter your email address" required />
                </div>
              </div>

              <div class="bpm-consent-group">
                <input type="checkbox" id="bpm-marketing-consent" name="marketing_consent" class="bpm-checkbox" value="1" />
                <label for="bpm-marketing-consent" class="bpm-consent-label">
                  Yes, send me free health & wellness tips and promotional updates by email. (Optional)
                </label>
              </div>

              <button type="submit" id="bpm-submit-btn" class="bpm-submit-btn">
                <span id="bpm-btn-text">SEND ME THE PDF</span>
                <span id="bpm-btn-spinner" class="bpm-spinner"></span>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>

              <div class="bpm-security-note">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                </svg>
                <span>100% Secure • Privacy Protected • No Spam Guarantee</span>
              </div>
            </form>

            <!-- Success Download View -->
            <div id="bpm-success-box" class="bpm-success-box">
              <div class="bpm-success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="bpm-success-title">Your PDF Is Ready!</h3>
              <p id="bpm-success-desc" class="bpm-success-desc">
                We've sent a copy to your email address. You can also click below to download your copy immediately.
              </p>
              <a id="bpm-direct-download-btn" href="#" download class="bpm-download-btn">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>DOWNLOAD PDF NOW</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    `;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    attachModalEvents();
  }

  // 3. Attach Event Listeners to Modal Controls
  function attachModalEvents() {
    var overlay = document.getElementById('bpm-overlay');
    var closeBtn = document.getElementById('bpm-close-btn');
    var form = document.getElementById('bpm-lead-form');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeBrevoPdfModal);
    }

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeBrevoPdfModal();
      });
    }

    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('bpm-active')) {
        closeBrevoPdfModal();
      }
    });
  }

  // 4. Open Modal Function
  function openBrevoPdfModal(productId, triggerElement) {
    ensureStylesLoaded();
    ensureModalInDom();

    currentProductId = productId || 'weight-loss-reset';
    lastFocusedElement = triggerElement || document.activeElement;

    var overlay = document.getElementById('bpm-overlay');
    var form = document.getElementById('bpm-lead-form');
    var successBox = document.getElementById('bpm-success-box');
    var errorAlert = document.getElementById('bpm-error-alert');
    var fullNameInput = document.getElementById('bpm-full-name');

    // Reset views
    if (form) form.style.display = 'flex';
    if (successBox) successBox.style.display = 'none';
    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.textContent = '';
    }

    if (overlay) {
      overlay.classList.add('bpm-active');
      document.body.style.overflow = 'hidden';

      // Focus first input field after animation frame
      setTimeout(function () {
        if (fullNameInput) fullNameInput.focus();
      }, 50);
    }
  }

  // 5. Close Modal Function
  function closeBrevoPdfModal() {
    var overlay = document.getElementById('bpm-overlay');
    if (overlay) {
      overlay.classList.remove('bpm-active');
      document.body.style.overflow = '';
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  // 6. Handle Form Submission to Backend API
  function handleFormSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    var fullNameInput = document.getElementById('bpm-full-name');
    var emailInput = document.getElementById('bpm-email');
    var consentInput = document.getElementById('bpm-marketing-consent');
    var errorAlert = document.getElementById('bpm-error-alert');
    var submitBtn = document.getElementById('bpm-submit-btn');
    var btnText = document.getElementById('bpm-btn-text');
    var btnSpinner = document.getElementById('bpm-btn-spinner');

    var nameVal = fullNameInput ? fullNameInput.value.trim() : '';
    var emailVal = emailInput ? emailInput.value.trim() : '';
    var consentVal = consentInput ? consentInput.checked : false;

    // Reset error box
    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.textContent = '';
    }

    // Frontend Input Validations
    if (!nameVal || nameVal.length < 2) {
      showError('Please enter your full name.');
      if (fullNameInput) fullNameInput.focus();
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      showError('Please enter a valid email address.');
      if (emailInput) emailInput.focus();
      return;
    }

    // Enter Loading State
    isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'PROCESSING...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';

    var payload = {
      full_name: nameVal,
      email: emailVal,
      product_id: currentProductId,
      marketing_consent: consentVal,
      source: 'modal_popup'
    };

    var apiEndpoint = window.BREVO_API_ENDPOINT || '/api/pdf-request/index.php';

    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server returned HTTP status ' + response.status);
        }
        return response.json().then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (res) {
        isSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'SEND ME THE PDF';
        if (btnSpinner) btnSpinner.style.display = 'none';

        if (!res.ok || !res.data.success) {
          showError(res.data.error || 'Failed to process request. Please try again.');
          return;
        }

        // Fire Meta Pixel Lead Event if pixel active
        if (typeof window.fbq === 'function') {
          try {
            window.fbq('track', 'Lead', {
              content_name: res.data.productName || currentProductId,
              category: 'PDF Download'
            });
          } catch (err) { }
        }

        // Switch to Success Download View
        var form = document.getElementById('bpm-lead-form');
        var successBox = document.getElementById('bpm-success-box');
        var directBtn = document.getElementById('bpm-direct-download-btn');
        var successDesc = document.getElementById('bpm-success-desc');

        if (form) form.style.display = 'none';
        if (successBox) successBox.style.display = 'block';

        if (directBtn && res.data.downloadUrl) {
          directBtn.href = res.data.downloadUrl;
        }

        if (successDesc) {
          successDesc.textContent = res.data.message || 'We have sent your PDF to your email inbox!';
        }

        // Trigger automatic file download in browser
        if (res.data.downloadUrl) {
          var link = document.createElement('a');
          link.href = res.data.downloadUrl;
          link.download = '';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      })
      .catch(function (err) {
        console.warn('[Modal PDF Download Fallback Activated]', err);
        isSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'SEND ME THE PDF';
        if (btnSpinner) btnSpinner.style.display = 'none';

        // Fire Meta Pixel Lead Event
        if (typeof window.fbq === 'function') {
          try {
            window.fbq('track', 'Lead', {
              content_name: currentProductId,
              category: 'PDF Download'
            });
          } catch (e) { }
        }

        // Fallback: Show success download view and trigger PDF download directly
        var form = document.getElementById('bpm-lead-form');
        var successBox = document.getElementById('bpm-success-box');
        var directBtn = document.getElementById('bpm-direct-download-btn');
        var fallbackPdfUrl = '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';

        if (form) form.style.display = 'none';
        if (successBox) successBox.style.display = 'block';
        if (directBtn) directBtn.href = fallbackPdfUrl;

        var link = document.createElement('a');
        link.href = fallbackPdfUrl;
        link.download = 'The-7-Minute-Weight-Loss-Reset.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }

  function showError(msg) {
    var errorAlert = document.getElementById('bpm-error-alert');
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    }
  }

  // 7. Global Auto-Binding for PDF Triggers across any page
  function bindGlobalPdfTriggers() {
    ensureStylesLoaded();
    ensureModalInDom();

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-pdf-trigger], [data-product-id], .open-pdf-modal');
      if (trigger) {
        e.preventDefault();
        var pid = trigger.getAttribute('data-product-id') || trigger.getAttribute('data-pdf-trigger') || 'weight-loss-reset';
        openBrevoPdfModal(pid, trigger);
      }
    });
  }

  // Expose global window API
  window.openBrevoPdfModal = openBrevoPdfModal;
  window.closeBrevoPdfModal = closeBrevoPdfModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGlobalPdfTriggers);
  } else {
    bindGlobalPdfTriggers();
  }
})();
