/**
 * MetaboDrop Editorial Review Page Script
 * - Dynamic Year Updater
 * - Tracking Attribution URL Forwarder (ClickBank TID / UTMs)
 * - Meta Pixel Outbound Click Tracking
 * - Sticky Bottom CTA Bar Scroll Visibility
 * - FAQ Interactive Accordion
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Dynamic Year Updater
  var yearElements = document.querySelectorAll('[data-year]');
  var currentYear = new Date().getFullYear();
  yearElements.forEach(function (el) {
    el.textContent = currentYear;
  });

  // 2. ClickBank Affiliate Link Attribution Forwarder
  var BASE_AFFILIATE_URL = 'https://hop.clickbank.net/?vendor=metabodrop&affiliate=encorain&lid=235060&tid=email';

  function buildAffiliateUrl() {
    try {
      var currentParams = new URLSearchParams(window.location.search);
      var targetUrl = new URL(BASE_AFFILIATE_URL);

      // Check if tid is passed in incoming query, or map from utm_content / tid
      var customTid = currentParams.get('tid') || currentParams.get('utm_content') || currentParams.get('utm_source');
      if (customTid) {
        targetUrl.searchParams.set('tid', customTid);
      }

      // Forward other standard UTM parameters if present
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (param) {
        if (currentParams.has(param)) {
          targetUrl.searchParams.set(param, currentParams.get(param));
        }
      });

      return targetUrl.toString();
    } catch (e) {
      return BASE_AFFILIATE_URL;
    }
  }

  var finalAffiliateUrl = buildAffiliateUrl();

  // Apply to all CTA links marked with .affiliate-link or [data-affiliate]
  var ctaLinks = document.querySelectorAll('a.affiliate-link, a[data-affiliate]');
  ctaLinks.forEach(function (link) {
    link.href = finalAffiliateUrl;
    link.target = '_blank';
    link.rel = 'noopener sponsored';

    // Meta Pixel Outbound Click Tracking
    link.addEventListener('click', function () {
      if (typeof fbq === 'function') {
        try {
          fbq('track', 'InitiateCheckout', {
            content_name: 'MetaboDrop Official Website',
            content_category: 'Health Supplement Review',
            value: 49.00,
            currency: 'USD'
          });
        } catch (err) {
          console.warn('[Tracking]', err);
        }
      }
    });
  });

  // 3. Sticky Bottom CTA Bar Visibility on Scroll
  var stickyBar = document.getElementById('sticky-bottom-bar');
  if (stickyBar) {
    var hasScrolledPastHero = false;
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY > 550) {
        if (!hasScrolledPastHero) {
          stickyBar.classList.add('visible');
          hasScrolledPastHero = true;
        }
      } else {
        if (hasScrolledPastHero) {
          stickyBar.classList.remove('visible');
          hasScrolledPastHero = false;
        }
      }
    }, { passive: true });
  }

  // 4. FAQ Accordion Handler
  var faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function (question) {
    question.addEventListener('click', function () {
      var parent = question.parentElement;
      var answer = parent.querySelector('.faq-answer');
      var icon = question.querySelector('.faq-toggle-icon');

      var isOpen = answer.style.display === 'block';

      // Close all answers
      document.querySelectorAll('.faq-answer').forEach(function (ans) {
        ans.style.display = 'none';
      });
      document.querySelectorAll('.faq-toggle-icon').forEach(function (ic) {
        ic.textContent = '+';
      });

      // Toggle current
      if (!isOpen) {
        answer.style.display = 'block';
        if (icon) icon.textContent = '−';
      }
    });
  });
});
