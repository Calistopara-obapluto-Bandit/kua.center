// Centralized configuration for the KUAC site.
window.KUAC_CONFIG = Object.freeze({
  formEndpoint: 'https://formsubmit.co/kua.center@gmail.com',
  callbackEndpoint: 'https://kua-center.onrender.com/api/callbacks',
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

(function configureCallbackForm() {
  const form = document.getElementById('callbackForm');
  if (!form) {
    return;
  }

  const config = window.KUAC_CONFIG || {};
  const formEndpoint = config.callbackEndpoint || form.dataset.formEndpoint || form.action;

  form.action = formEndpoint;
  form.dataset.formEndpoint = formEndpoint;
})();
