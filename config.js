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
    note.innerHTML = 'Enter your <strong>active email</strong>. KUAC will receive the request, and the auto-reply will go to that address.';
  }

  const hint = card.querySelector('.tm-form-hint');
  if (hint) {
    hint.textContent = "Next step: press Send to KUAC and we’ll take care of the rest.";
  }

  const toggle = card.querySelector('.tm-callback-toggle');
  if (toggle) {
    toggle.innerHTML = 'Request a callback <i class="fas fa-chevron-down tm-callback-toggle-icon" aria-hidden="true"></i>';
  }

  const submitButton = card.querySelector('.tm-btn-submit');
  if (submitButton) {
    submitButton.textContent = 'Send to KUAC';
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

(function rewriteFooterLinks() {
  const footerLeft = document.querySelector('.tm-footer-links-left');
  if (footerLeft) {
    footerLeft.innerHTML = '<span class="tm-footer-label">Stay Connected</span><a href="mailto:kua.center@gmail.com">kua.center@gmail.com</a>';
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