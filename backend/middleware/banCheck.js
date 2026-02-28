/**
 * banCheck.js
 * Applied after protect() on regular user routes.
 * Banned users receive 403 on any authenticated request.
 */
const banCheck = (req, res, next) => {
  if (req.user?.isBanned) {
    return res.status(403).json({
      success: false,
      code: 'ACCOUNT_BANNED',
      message: 'Your account has been suspended. Contact support if you believe this is an error.',
    });
  }
  next();
};

module.exports = banCheck;
