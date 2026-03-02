/**
 * emailService.js
 * Nodemailer with Gmail SMTP.
 * Uses an App Password — not your real Gmail password.
 * Setup: Google Account → Security → 2-Step Verification → App Passwords
 */
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    logger.warn({ msg: 'Email service not connected', error: error.message });
  } else {
    logger.info({ msg: 'Email service ready', user: process.env.GMAIL_USER });
  }
});

// ── HTML Templates ────────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    .header { background: #0f172a; padding: 28px 32px; border-bottom: 1px solid #334155; }
    .header-brand { font-size: 20px; font-weight: 700; color: #f1f5f9; }
    .header-brand span { color: #38bdf8; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #f1f5f9; font-weight: 600; margin-bottom: 12px; }
    .text { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-bottom: 16px; }
    .highlight-box { background: #0f172a; border: 1px solid #334155; border-left: 4px solid #38bdf8; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .highlight-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .highlight-value { font-size: 15px; color: #f1f5f9; font-weight: 600; }
    .amount { font-size: 28px; color: #10b981; font-weight: 700; font-family: monospace; }
    .btn { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 20px 0; }
    .btn-danger { background: #ef4444; color: #ffffff; }
    .footer { background: #0f172a; padding: 20px 32px; border-top: 1px solid #334155; }
    .footer-text { font-size: 12px; color: #475569; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-brand">Free<span>Lance</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <div class="footer-text">
        This is an automated message from FreeLance Platform.<br/>
        If you did not expect this email, you can safely ignore it.
      </div>
    </div>
  </div>
</body>
</html>
`;

// ── Send functions ─────────────────────────────────────────────────────────────

/**
 * Password Reset Email
 */
const sendPasswordReset = async ({ to, name, resetUrl }) => {
  const content = `
    <div class="greeting">Hi ${name},</div>
    <p class="text">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#f1f5f9">1 hour</strong>.</p>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p class="text">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
    <div class="highlight-box">
      <div class="highlight-label">Security tip</div>
      <div class="highlight-value" style="font-size:13px;color:#94a3b8">Never share this link with anyone. FreeLance staff will never ask for it.</div>
    </div>
  `;
  await transporter.sendMail({
    from: `"FreeLance Platform" <${process.env.GMAIL_USER}>`,
    to, subject: 'Reset your FreeLance password',
    html: baseTemplate(content),
  });
  logger.info({ msg: 'Password reset email sent', to });
};

/**
 * New Bid Received (to client)
 */
const sendNewBidReceived = async ({ to, clientName, freelancerName, jobTitle, bidAmount, jobUrl }) => {
  const content = `
    <div class="greeting">Hi ${clientName},</div>
    <p class="text">You have received a new bid on your job posting.</p>
    <div class="highlight-box">
      <div class="highlight-label">Job</div>
      <div class="highlight-value">${jobTitle}</div>
    </div>
    <div class="highlight-box">
      <div class="highlight-label">Freelancer</div>
      <div class="highlight-value">${freelancerName}</div>
    </div>
    <div class="highlight-box">
      <div class="highlight-label">Bid Amount</div>
      <div class="amount">$${bidAmount}</div>
    </div>
    <div style="text-align:center">
      <a href="${jobUrl}" class="btn">Review Bid</a>
    </div>
    <p class="text">Log in to view the full proposal and accept or reject this bid.</p>
  `;
  await transporter.sendMail({
    from: `"FreeLance Platform" <${process.env.GMAIL_USER}>`,
    to, subject: `New bid on "${jobTitle}"`,
    html: baseTemplate(content),
  });
  logger.info({ msg: 'New bid email sent', to, jobTitle, bidAmount });
};

/**
 * Bid Accepted (to freelancer)
 */
const sendBidAccepted = async ({ to, freelancerName, jobTitle, bidAmount, jobUrl }) => {
  const content = `
    <div class="greeting">Congratulations, ${freelancerName}!</div>
    <p class="text">Your bid has been accepted. The client has secured payment and you can now begin work on the project.</p>
    <div class="highlight-box">
      <div class="highlight-label">Project</div>
      <div class="highlight-value">${jobTitle}</div>
    </div>
    <div class="highlight-box">
      <div class="highlight-label">Your Agreed Rate</div>
      <div class="amount">$${bidAmount}</div>
    </div>
    <p class="text" style="margin-top:16px">Payment is held securely in escrow and will be released to you once the client approves your completed work.</p>
    <div style="text-align:center">
      <a href="${jobUrl}" class="btn">Go to Project</a>
    </div>
  `;
  await transporter.sendMail({
    from: `"FreeLance Platform" <${process.env.GMAIL_USER}>`,
    to, subject: `Your bid was accepted — "${jobTitle}"`,
    html: baseTemplate(content),
  });
  logger.info({ msg: 'Bid accepted email sent', to, jobTitle });
};

/**
 * Payment Released (to freelancer)
 */
const sendPaymentReleased = async ({ to, freelancerName, jobTitle, amount }) => {
  const content = `
    <div class="greeting">Payment released, ${freelancerName}!</div>
    <p class="text">The client has approved your work and released your payment for the following project.</p>
    <div class="highlight-box">
      <div class="highlight-label">Project</div>
      <div class="highlight-value">${jobTitle}</div>
    </div>
    <div class="highlight-box">
      <div class="highlight-label">Amount Released</div>
      <div class="amount">$${amount}</div>
    </div>
    <p class="text" style="margin-top:16px">Great work completing this project. Your earnings have been recorded and the contract is now closed.</p>
  `;
  await transporter.sendMail({
    from: `"FreeLance Platform" <${process.env.GMAIL_USER}>`,
    to, subject: `Payment of $${amount} released — "${jobTitle}"`,
    html: baseTemplate(content),
  });
  logger.info({ msg: 'Payment released email sent', to, jobTitle, amount });
};

module.exports = {
  sendPasswordReset,
  sendNewBidReceived,
  sendBidAccepted,
  sendPaymentReleased,
};
