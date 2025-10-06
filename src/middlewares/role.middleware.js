// RBAC middleware for Express
// Usage: app.use('/admin', authMiddleware, roleMiddleware(['admin']))

module.exports = function(requiredRoles) {
  return function(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: No user role found' });
    }
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
