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
