const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const fromAddress = `"${process.env.SMTP_FROM_NAME || 'Booking Desk'}" <${process.env.SMTP_FROM_EMAIL || 'bookings@myfaredeal.com'}>`;

/**
 * Authorization Email Template
 * Sent to customer BEFORE payment is charged
 * Customer must reply/sign to authorize the charge
 */
const authorizationEmailTemplate = (ticket, agentName) => {
  const cardLast4 = ticket.cardNumber ? ticket.cardNumber.slice(-4) : 'XXXX';
  const amount = ticket.mco || ticket.ticketCost || '0.00';
  const currency = ticket.currency || 'USD';
  const currencySymbol = { USD: '$', INR: '₹', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' }[currency] || '$';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#09527f 0%,#0a6da8 100%);padding:28px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">Payment Authorization Request</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Please review and authorize the charge below</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#333;font-size:15px;margin:0 0 18px;line-height:1.6;">Dear <strong>${ticket.passengerName}</strong>,</p>

              <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">
                We are reaching out regarding your recent booking request. Before we process your payment, we need your written authorization to charge your card. Please review the details below carefully.
              </p>

              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#09527f;font-size:14px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:6px 0;width:40%;">Passenger Name</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${ticket.passengerName}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:6px 0;">Confirmation Code</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${ticket.confirmationCode || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:6px 0;">Airline</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${ticket.airlineCode || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding:6px 0;">Service</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${ticket.ticketType || 'N/A'} - ${ticket.requestFor || 'N/A'}</td>
                      </tr>
                      ${ticket.Desc ? `<tr>
                        <td style="color:#64748b;font-size:13px;padding:6px 0;">Description</td>
                        <td style="color:#0f172a;font-size:13px;padding:6px 0;">${ticket.Desc}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Charge Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px;">Charge Information</p>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color:#78716c;font-size:13px;padding:6px 0;width:40%;">Amount to be Charged</td>
                        <td style="color:#0f172a;font-size:18px;font-weight:700;padding:6px 0;">${currencySymbol}${amount} ${currency}</td>
                      </tr>
                      <tr>
                        <td style="color:#78716c;font-size:13px;padding:6px 0;">Card Ending In</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">**** **** **** ${cardLast4}</td>
                      </tr>
                      <tr>
                        <td style="color:#78716c;font-size:13px;padding:6px 0;">Cardholder Name</td>
                        <td style="color:#0f172a;font-size:13px;font-weight:600;padding:6px 0;">${ticket.cardholderName || ticket.billingFirstName && ticket.billingLastName ? (ticket.billingFirstName + ' ' + ticket.billingLastName) : ticket.passengerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Authorization Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border:2px solid #86efac;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 12px;">✅ To Authorize This Charge:</p>
                    <p style="color:#15803d;font-size:14px;line-height:1.7;margin:0 0 8px;">
                      Please <strong>reply to this email</strong> with the following statement:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;border:1px dashed #86efac;margin:12px 0;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="color:#0f172a;font-size:14px;font-style:italic;margin:0;line-height:1.6;">
                            "I, <strong>${ticket.passengerName}</strong>, authorize a charge of <strong>${currencySymbol}${amount} ${currency}</strong> on my card ending in <strong>${cardLast4}</strong> for the above-mentioned service."
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#15803d;font-size:13px;line-height:1.6;margin:8px 0 0;">
                      Along with your <strong>Full Name</strong> as your digital signature.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Disclaimer -->
              <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0 0 8px;">
                <strong>Note:</strong> No charge will be made until we receive your written authorization. If you did not request this service or have any questions, please contact us immediately.
              </p>

            </td>
          </tr>

          <!-- Signature / Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;padding-top:20px;">
                <tr>
                  <td style="padding-top:20px;">
                    <p style="color:#333;font-size:14px;margin:0 0 4px;">Warm Regards,</p>
                    <p style="color:#09527f;font-size:15px;font-weight:700;margin:0 0 4px;">${agentName || 'Booking Desk'}</p>
                    <p style="color:#64748b;font-size:13px;margin:0 0 2px;">Booking Support Team</p>
                    <p style="color:#64748b;font-size:13px;margin:0 0 2px;">📧 bookings@myfaredeal.com</p>
                    <p style="color:#64748b;font-size:13px;margin:0;">📞 +1 (844) 901-4609</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom bar -->
          <tr>
            <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">This is an automated email from the booking system. Please reply to authorize your payment.</p>
              <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// ============ SEND FUNCTION ============

/**
 * Send Authorization Email to customer
 * @param {Object} ticket - The ticket request object
 * @param {string} agentName - Name of the CRM agent sending the email
 * @returns {Object} - { success, message }
 */
const sendAuthorizationEmail = async (ticket, agentName) => {
  const customerEmail = ticket.passengerEmail || ticket.billingEmail;
  if (!customerEmail) {
    return { success: false, message: 'No customer email found on this ticket.' };
  }

  try {
    const transporter = createTransporter();
    const cardLast4 = ticket.cardNumber ? ticket.cardNumber.slice(-4) : 'XXXX';
    const amount = ticket.mco || ticket.ticketCost || '0.00';
    const currency = ticket.currency || 'USD';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      replyTo: process.env.SMTP_FROM_EMAIL || 'bookings@myfaredeal.com',
      subject: `Payment Authorization Required - ${ticket.confirmationCode || 'Booking'} | Card ending ${cardLast4} | ${currency} ${amount}`,
      html: authorizationEmailTemplate(ticket, agentName),
    });

    console.log(`Authorization email sent to ${customerEmail} - MessageID: ${info.messageId}`);
    return { success: true, message: `Authorization email sent to ${customerEmail}`, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending authorization email:', error.message);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
};

module.exports = {
  sendAuthorizationEmail,
};
