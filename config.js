// FormSubmit endpoint for the static callback form.
window.CALLBACK_FORM_ENDPOINT = 'https://formsubmit.co/kua.center@gmail.com';

function getCallbackNextUrl() {
  const fallbackUrl = 'https://kua-center.onrender.com/?callback=sent#contact';

  try {
    const currentUrl = new URL(window.location.href);

    if (currentUrl.protocol === 'http:' || currentUrl.protocol === 'https:') {
      return `${currentUrl.origin}${currentUrl.pathname}?callback=sent#contact`;
    }
  } catch (error) {
    return fallbackUrl;
  }

  return fallbackUrl;
}

(function configureCallbackForm() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  form.action = window.CALLBACK_FORM_ENDPOINT;
  form.dataset.formEndpoint = window.CALLBACK_FORM_ENDPOINT;

  const templateField = form.querySelector('input[name="_template"]');
  if (templateField) {
    templateField.value = 'box';
  }

  const captchaField = form.querySelector('input[name="_captcha"]');
  if (captchaField) {
    captchaField.remove();
  }

  const subjectField = form.querySelector('input[name="_subject"]');
  if (subjectField) {
    subjectField.value = 'KUAC | Support Request Received';
  }

  const nextField = form.querySelector('input[name="_next"]');
  if (nextField) {
    nextField.value = getCallbackNextUrl();
  }

  form.addEventListener('submit', function () {
    const replyToField = form.querySelector('input[name="_replyto"]');
    const emailField = form.querySelector('input[name="email"]');

    if (replyToField && emailField) {
      replyToField.value = emailField.value.trim();
    }

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
        'KUAC Support Team',
      ].join('\n');
    }
  });
})();
