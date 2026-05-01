// Submission endpoint for the callback form.
window.CALLBACK_FORM_ENDPOINT = window.CALLBACK_FORM_ENDPOINT || 'https://formsubmit.co/kua.center@gmail.com';

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
    note.innerHTML = 'Fill in the client details, add a file if it helps, then submit the request. KUAC receives it at <strong>kua.center@gmail.com</strong> and the client gets the auto-reply.';
  }

  const hint = card.querySelector('.tm-form-hint');
  if (hint) {
    hint.textContent = 'Next step: press Submit Request. The support inbox receives the request, and the client email is used for the auto-reply.';
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
