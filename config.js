// Centralized config for the static callback form.
window.KUAC_CONFIG = Object.freeze({
  formEndpoint: 'https://formsubmit.co/kua.center@gmail.com',
  liveSiteUrl: 'https://kua-center.onrender.com/',
  successQuery: '?callback=sent',
  successHash: '#contact',
  subject: 'KUAC | Support Request Received',
  template: 'box',
  autoresponse: [
    'Dear KUAC client,',
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
  ].join('\n'),
});

function getCallbackNextUrl() {
  const fallbackUrl = `${window.KUAC_CONFIG.liveSiteUrl}${window.KUAC_CONFIG.successQuery}${window.KUAC_CONFIG.successHash}`;

  try {
    const currentUrl = new URL(window.location.href);

    if (currentUrl.protocol === 'http:' || currentUrl.protocol === 'https:') {
      return `${currentUrl.origin}${currentUrl.pathname}${window.KUAC_CONFIG.successQuery}${window.KUAC_CONFIG.successHash}`;
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

  const config = window.KUAC_CONFIG || {};
  const formEndpoint = form.dataset.formEndpoint || config.formEndpoint || form.action;

  form.action = formEndpoint;
  form.dataset.formEndpoint = formEndpoint;

  const templateField = form.querySelector('input[name="_template"]');
  if (templateField) {
    templateField.value = config.template || templateField.value;
  }

  const captchaField = form.querySelector('input[name="_captcha"]');
  if (captchaField) {
    captchaField.remove();
  }

  const subjectField = form.querySelector('input[name="_subject"]');
  if (subjectField) {
    subjectField.value = config.subject || subjectField.value;
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

    if (autoresponseField) {
      autoresponseField.value = config.autoresponse || autoresponseField.value;
    }
  });
})();
