// Centralized configuration for the KUAC site.
window.KUAC_CONFIG = Object.freeze({
  formEndpoint: 'https://formsubmit.co/uau.krai1@gmail.com',
  apiBaseUrl: 'https://kua-center-api.onrender.com',
  callbackEndpoint: 'https://kua-center-api.onrender.com/api/callbacks',
  liveSiteUrl: 'https://kua-center.onrender.com/',
  successQuery: '?callback=sent',
  successHash: '#contact',
  dashboardAccessCode: 'KUAC-OPS-2026',
  issueNotificationSubject: 'KUAC | Access Code Issued',
  paymentVerificationEndpoint: '',
  tawkPropertyId: '6a023f80ee7ca01c362e9164',
  tawkWidgetId: '1joccg43k',
  tawkDirectChatUrl: 'https://tawk.to/1joccg43k',
  paymentProofSubject: 'KUAC | Payment Proof Received',
  subject: 'KUAC | Support Request Received',
  template: 'box',
  autoresponse: [
    'Thank you for contacting KUAC.',
    '',
    'Your request has been received successfully and is now being reviewed by our support team.',
    '',
    'What happens next:',
    '1. We review the details you submitted.',
    '2. We check the most appropriate support path for your request.',
    '3. We will contact you by email with the next steps if further assistance is available.',
    '',
    'If you need to add anything to your request, simply reply to this email.',
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
  const formEndpoint = config.formEndpoint || form.dataset.formEndpoint || form.action;

  form.action = formEndpoint;
  form.dataset.formEndpoint = formEndpoint;

  const captchaField = form.querySelector('input[name="_captcha"]');
  if (captchaField) {
    captchaField.remove();
  }

  const templateField = form.querySelector('input[name="_template"]');
  if (templateField) {
    templateField.value = config.template || templateField.value;
  }

  const subjectField = form.querySelector('input[name="_subject"]');
  if (subjectField) {
    subjectField.value = config.subject || subjectField.value;
  }

  const urlField = form.querySelector('input[name="_url"]');
  if (urlField) {
    urlField.value = getCallbackNextUrl().split('?')[0];
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
      const name = (emailField && form.querySelector('input[name="name"]')?.value || '').trim();
      const greeting = name ? `Hello ${name},` : 'Hello,';
      const message = config.autoresponse || autoresponseField.value;
      autoresponseField.value = message.replace(/^Thank you for contacting KUAC\./, `${greeting}\n\nThank you for contacting KUAC.`);
    }
  });
})();
