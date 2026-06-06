(function() {
    // 1. Define Footer HTML
    const footerHTML = `
    <footer class="site-common-footer">
        <div class="footer-inner-container">
            <div class="footer-links-row">
                <a href="disclaimer.html" class="footer-link-item">Disclaimer</a>
                <span class="footer-link-divider">|</span>
                <a href="privacy-policy.html" class="footer-link-item">Privacy Policy</a>
                <span class="footer-link-divider">|</span>
                <a href="terms.html" class="footer-link-item">Terms & Conditions</a>
                <span class="footer-link-divider">|</span>
                <a href="contact.html" class="footer-link-item">Contact</a>
            </div>
            
            <p class="footer-copyright-text">© 2026 - Sophia Carter - All Rights Reserved</p>
            
            <p class="footer-disclaimer-paragraph">
                This site is not a part of the Facebook website or Facebook Inc. Additionally, This site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
            </p>
            
            <p class="footer-disclaimer-paragraph">
                The information on this website has not been evaluated by the Food & Drug Administration or any other medical body. We do not aim to diagnose, treat, cure or prevent any illness or disease. Information is shared for educational purposes only. You should always consult your doctor before acting on any content on this website, especially if you are pregnant, nursing, taking medication or have a medical condition.
            </p>
        </div>
    </footer>
    `;

    // 2. Define Footer Styles
    const footerStyles = `
    .site-common-footer {
        padding-block: 40px 45px;
        border-top: 1px solid #d9d9d9;
        background-color: #faf8f3;
        color: #000000;
        text-align: center;
        font-family: 'Poppins', 'Source Sans 3', system-ui, -apple-system, sans-serif;
    }
    .footer-inner-container {
        width: min(100% - 40px, 1000px);
        margin-inline: auto;
        display: grid;
        justify-items: center;
    }
    .footer-links-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 8px 12px;
        margin-bottom: 16px;
    }
    .footer-link-item {
        color: #000000;
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        transition: color 0.2s ease, text-decoration 0.2s ease;
    }
    .footer-link-item:hover {
        color: #c9a77d;
        text-decoration: underline;
    }
    .footer-link-divider {
        color: #cccccc;
        font-size: 14px;
        user-select: none;
    }
    .footer-copyright-text {
        font-size: 13px;
        font-weight: 700;
        color: #000000;
        margin-top: 0;
        margin-bottom: 24px;
    }
    .footer-disclaimer-paragraph {
        max-width: 780px;
        margin-inline: auto;
        margin-top: 0;
        margin-bottom: 16px;
        color: #555555;
        font-size: 12px;
        line-height: 1.6;
        text-align: center;
    }
    .footer-disclaimer-paragraph:last-of-type {
        margin-bottom: 0;
    }
    @media (max-width: 600px) {
        .footer-links-row {
            gap: 6px 10px;
        }
        .footer-link-item {
            font-size: 13px;
        }
        .footer-disclaimer-paragraph {
            font-size: 11px;
            padding-inline: 10px;
        }
    }
    `;

    // 3. Inject CSS Styles
    const styleElement = document.createElement('style');
    styleElement.textContent = footerStyles;
    document.head.appendChild(styleElement);

    // 4. Inject HTML into Target Container
    const targetElement = document.getElementById('footer');
    if (targetElement) {
        targetElement.innerHTML = footerHTML;
    } else {
        // Fallback: If #footer doesn't exist, append to body
        document.addEventListener('DOMContentLoaded', () => {
            const retryTarget = document.getElementById('footer');
            if (retryTarget) {
                retryTarget.innerHTML = footerHTML;
            }
        });
    }
})();
