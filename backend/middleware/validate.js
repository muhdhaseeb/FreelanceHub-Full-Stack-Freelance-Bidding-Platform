const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (!role || !['client', 'freelancer'].includes(role)) errors.push('Role must be client or freelancer');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
  next();
};
const validateLogin = (req, res, next) => {
  if (!req.body.email || !req.body.password) return res.status(400).json({ success: false, message: 'Email and password required' });
  next();
};
const validateJob = (req, res, next) => {
  const { title, description, budgetMin, budgetMax, deadline } = req.body;
  const errors = [];
  if (!title || title.trim().length < 5) errors.push('Title must be at least 5 characters');
  if (!description || description.trim().length < 20) errors.push('Description must be at least 20 characters');
  if (!budgetMin || isNaN(budgetMin) || budgetMin < 1) errors.push('Valid minimum budget required');
  if (!budgetMax || isNaN(budgetMax) || Number(budgetMax) < Number(budgetMin)) errors.push('Maximum budget must be >= minimum');
  if (!deadline || new Date(deadline) <= new Date()) errors.push('Deadline must be in the future');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
  next();
};
const validateBid = (req, res, next) => {
  const { jobId, amount, proposal } = req.body;
  const errors = [];
  if (!jobId) errors.push('Job ID required');
  if (!amount || isNaN(amount) || amount < 1) errors.push('Valid bid amount required');
  if (!proposal || proposal.trim().length < 20) errors.push('Proposal must be at least 20 characters');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
  next();
};
module.exports = { validateRegister, validateLogin, validateJob, validateBid };
