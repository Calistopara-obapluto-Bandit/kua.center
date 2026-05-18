// Centralized configuration for the KUAC site.
window.KUAC_CONFIG = Object.freeze({
  formEndpoint: 'https://formsubmit.co/kua.center@gmail.com',
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
    '<b>Hi {{ name }},</b>',
    '',
    'Thank you for contacting KUAC. Your request has been received and is now being reviewed by our team.',
    '',
    'For reference, your ticket ID is <b>{{ ticketId }}</b>.',
    '',
    'If a payment is required for your request, we can accept bank transfer, KUAC gift card, or digital currency.',
    'We will share the next payment steps with you by email if needed.',
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
