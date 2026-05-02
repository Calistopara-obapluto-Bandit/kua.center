// FormSubmit endpoint for the static callback form.
window.CALLBACK_FORM_ENDPOINT = 'https://formsubmit.co/kua.center@gmail.com';

(function rewriteCallbackCopy() {
  const card = document.querySelector('.tm-callback-card');
  if (!card) {
    return;
  }

  const title = card.querySelector('h3');
  if (title) {
    title.textContent = 'Start a callback request';
  }

  const note = card.querySelector('.tm-callback-note');
  if (note) {
    note.innerHTML = 'Put the <strong>client\'s email</strong> in the email field, not KUAC\'s. FormSubmit will receive the request and deliver it to KUAC.';
  }

  const hint = card.querySelector('.tm-form-hint');
  if (hint) {
    hint.textContent = "Next step: press Send to KUAC, and we’ll take care of the rest.";
  }

  const toggle = card.querySelector('.tm-callback-toggle');
  if (toggle) {
    toggle.innerHTML = 'Start a callback request <i class="fas fa-chevron-down tm-callback-toggle-icon" aria-hidden="true"></i>';
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
