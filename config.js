// Form-mail endpoint for the callback form.
window.CALLBACK_API_URL = window.CALLBACK_API_URL || 'https://formsubmit.co/kua.center@gmail.com';

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
