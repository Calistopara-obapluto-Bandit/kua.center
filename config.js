// Static-site submission endpoint for the callback form.
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
    note.innerHTML = 'Put the <strong>client\'s email</strong> in the email field, not KUAC\'s. KUAC receives the request at <strong>kua.center@gmail.com</strong>, and the client gets the auto-reply.';
  }

  const hint = card.querySelector('.tm-form-hint');
  if (hint) {
    hint.textContent = "Next step: press Send to KUAC. The support inbox gets the request, and the email field must contain the client's address for the auto-reply.";
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

(function injectCallbackAttachmentField() {
  const form = document.getElementById('callbackForm');
  if (!form || document.getElementById('attachment')) {
    return;
  }

  const messageField = form.querySelector('#message');
  if (!messageField) {
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'tm-file-wrap';
  wrap.innerHTML = [
    '<label for="attachment" class="tm-file-label">Attach a photo or document</label>',
    '<input id="attachment" name="attachment" type="file" class="tm-input tm-file-input" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" />',
    '<p class="tm-file-help">Optional. You can include a photo, ID scan, or other supporting file with the request.</p>',
  ].join('');

  messageField.insertAdjacentElement('afterend', wrap);
})();
