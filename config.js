// FormSubmit endpoint for the static callback form.
window.CALLBACK_FORM_ENDPOINT = 'https://formsubmit.co/kua.center@gmail.com';

(function rewriteCallbackCopy() {
  const card = document.querySelector('.tm-callback-card');
  if (!card) {
    return;
  }

  const title = card.querySelector('h3');
  if (title) {
    title.textContent = 'Request a callback';
  }

  const note = card.querySelector('.tm-callback-note');
  if (note) {
    note.innerHTML = 'Enter your <strong>active email</strong>. We will send the confirmation and follow-up to that address.';
  }

  const hint = card.querySelector('.tm-form-hint');
  if (hint) {
    hint.textContent = 'Click Submit Request to send your request securely. A confirmation email will follow shortly.';
  }

  const toggle = card.querySelector('.tm-callback-toggle');
  if (toggle) {
    toggle.innerHTML = 'Request a callback <i class="fas fa-chevron-down tm-callback-toggle-icon" aria-hidden="true"></i>';
  }

  const submitButton = card.querySelector('.tm-btn-submit');
  if (submitButton) {
    submitButton.textContent = 'Submit Request';
  }
})();

(function wireCallbackFormEndpoint() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  form.action = window.CALLBACK_FORM_ENDPOINT;
  form.dataset.formEndpoint = window.CALLBACK_FORM_ENDPOINT;
})();

(function wireCallbackTemplate() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  const templateField = form.querySelector('input[name="_template"]');
  if (templateField) {
    templateField.value = 'box';
  }
})();

(function wireCallbackCaptcha() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  const captchaField = form.querySelector('input[name="_captcha"]');
  if (captchaField) {
    captchaField.remove();
  }
})();

(function wireCallbackSubject() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  const subjectField = form.querySelector('input[name="_subject"]');
  if (subjectField) {
    subjectField.value = 'KUAC | Support Request Received';
  }
})();

(function wireCallbackReplyTo() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', function () {
    const replyToField = form.querySelector('input[name="_replyto"]');
    const emailField = form.querySelector('input[name="email"]');

    if (replyToField && emailField) {
      replyToField.value = emailField.value.trim();
    }
  });
})();

(function wireCallbackAutoresponse() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', function () {
    const autoresponseField = form.querySelector('input[name="_autoresponse"]');
    const nameField = form.querySelector('input[name="name"]');
    const displayName = nameField ? nameField.value.trim() : '';
    const recipientName = displayName || 'KUAC client';

    if (autoresponseField) {
      autoresponseField.value = [
        `Dear ${recipientName},`,
        '',
        'Thank you for contacting KUAC. Your request has been successfully submitted and is now being reviewed by our team.',
        '',
        'We are currently matching your request with relevant support partners who may be able to assist you.',
        '',
        'What happens next:',
        '- We review the details you shared.',
        '- We look for a suitable support partner.',
        '- If a partner is available, you will be contacted directly.',
        '',
        'Submitting a request on KUAC is completely free.',
        '',
        'If you need to add anything, simply reply to this email.',
        '',
        'Kind regards,',
        'KUAC Support Team'
      ].join('\n');
    }
  });
})();

(function rewriteFooterLinks() {
  const footerLeft = document.querySelector('.tm-footer-links-left');
  if (footerLeft) {
    footerLeft.innerHTML = '<span class="tm-footer-label">Connect with KUAC</span><a href="mailto:kua.center@gmail.com">kua.center@gmail.com</a>';
  }

  const footerLinks = document.querySelector('.tm-footer-links-right');
  if (!footerLinks) {
    return;
  }

  const links = footerLinks.querySelectorAll('a');
  if (links.length > 1) {
    const siteLink = links[1];
    siteLink.href = 'https://kua-center.onrender.com/';
    siteLink.target = '_blank';
    siteLink.rel = 'noopener';
    siteLink.setAttribute('aria-label', 'Open KUAC homepage');
    siteLink.innerHTML = '<i class="fas fa-home"></i>';
  }
})();

(function rewritePartnerPricing() {
  const partnerSection = document.querySelector('.tm-partner-section');
  if (!partnerSection) {
    return;
  }

  const cards = partnerSection.querySelectorAll('.tm-partner-card');
  if (cards[1]) {
    const unlockCard = cards[1];
    const price = unlockCard.querySelector('strong');
    const description = unlockCard.querySelector('p');

    if (price) {
      price.textContent = '€15.50 per request';
    }

    if (description) {
      description.textContent = 'Preview the request first, then pay once to unlock the full details and contact options for that lead.';
    }
  }

  if (cards[2]) {
    const proCard = cards[2];
    const price = proCard.querySelector('strong');
    const description = proCard.querySelector('p');

    if (price) {
      price.textContent = '€55.99 per month';
    }

    if (description) {
      description.textContent = 'Monthly access to every new request, ideal for partners who need ongoing visibility and faster follow-up.';
    }
  }
})();

(function injectRuntimePolish() {
  if (document.getElementById('kuac-runtime-polish')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'kuac-runtime-polish';
  style.textContent = `
    .tm-navbar {
      padding: 14px 0;
      background: linear-gradient(180deg, rgba(8, 26, 38, 0.5), rgba(8, 26, 38, 0.12));
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
    }

    .tm-navbar.scroll {
      padding: 10px 0;
      background-color: rgba(250, 252, 251, 0.95);
      box-shadow: 0 14px 30px rgba(18, 65, 73, 0.1);
      backdrop-filter: blur(18px);
    }

    #infinite {
      overflow: hidden;
    }

    #infinite::before,
    #infinite::after {
      content: "";
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }

    #infinite::before {
      width: 320px;
      height: 320px;
      top: -120px;
      right: -80px;
      background: radial-gradient(circle, rgba(141, 186, 174, 0.22) 0%, rgba(141, 186, 174, 0) 72%);
    }

    #infinite::after {
      width: 420px;
      height: 420px;
      left: -220px;
      bottom: -210px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 72%);
    }

    .tm-hero-text-container {
      position: relative;
      z-index: 1;
    }

    .tm-hero-text-container-inner {
      padding: 38px 42px 36px;
      max-width: 960px;
      margin-left: auto;
      margin-right: auto;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: linear-gradient(180deg, rgba(8, 26, 38, 0.56), rgba(8, 26, 38, 0.26));
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.22);
      backdrop-filter: blur(12px);
    }

    .tm-hero-badges {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 26px;
    }

    .tm-hero-badges span {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.94);
      font-size: 0.84rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
    }

    .tm-hero-badges i {
      color: #cceee7;
    }

    .tm-section-title {
      position: relative;
    }

    .tm-section-title::after {
      content: "";
      display: block;
      width: 72px;
      height: 4px;
      margin-top: 16px;
      border-radius: 999px;
      background: linear-gradient(90deg, #155e67 0%, rgba(21, 94, 103, 0.12) 100%);
    }

    .text-center .tm-section-title::after {
      margin-left: auto;
      margin-right: auto;
    }

    .tm-trust-card,
    .tm-about-panel,
    .tm-support-card,
    .tm-partner-card,
    .tm-callback-card,
    .tm-contact-card {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }

    .tm-trust-card:hover,
    .tm-about-panel:hover,
    .tm-support-card:hover,
    .tm-partner-card:hover,
    .tm-callback-card:hover,
    .tm-contact-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 28px 58px rgba(16, 40, 51, 0.14);
      border-color: rgba(21, 94, 103, 0.22);
    }

    .tm-callback-card,
    .tm-contact-card,
    .tm-support-card,
    .tm-partner-card,
    .tm-about-panel,
    .tm-trust-card {
      overflow: hidden;
    }

    .tm-callback-toggle,
    .tm-btn-submit {
      border-radius: 999px;
    }

    .tm-footer-links,
    .tm-footer-grid {
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    @media (max-width: 767px) {
      .tm-hero-text-container-inner {
        padding: 28px 22px;
        border-radius: 20px;
      }

      .tm-hero-badges {
        gap: 10px;
      }

      .tm-hero-badges span {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  document.head.appendChild(style);
})();

(function injectHeroBadges() {
  const heroActions = document.querySelector('.tm-hero-actions');
  if (!heroActions || document.querySelector('.tm-hero-badges')) {
    return;
  }

  const badges = document.createElement('div');
  badges.className = 'tm-hero-badges';
  badges.setAttribute('aria-label', 'KUAC highlights');
  badges.innerHTML = [
    '<span><i class="fas fa-shield-alt" aria-hidden="true"></i> Confidential intake</span>',
    '<span><i class="fas fa-route" aria-hidden="true"></i> EU travel guidance</span>',
    '<span><i class="fas fa-headset" aria-hidden="true"></i> Fast partner follow-up</span>',
  ].join('');

  heroActions.insertAdjacentElement('afterend', badges);
})();
