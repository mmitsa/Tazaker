const { forbidden } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Role hierarchy for permission checking
 * Higher index = more permissions
 */
const roleHierarchy = {
  receptionist: 0,
  doctor: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Check if user has required role
 * @param {Array|string} allowedRoles - Role(s) allowed to access
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Role check attempted without authentication');
        return forbidden(res, 'Authentication required');
      }

      const userRole = req.user.role;

      // Check if user has allowed role
      if (!roles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.userId,
          userRole,
          requiredRoles: roles,
        });
        return forbidden(res, 'Insufficient permissions');
      }

      logger.debug('Role check passed', {
        userId: req.user.userId,
        role: userRole,
      });

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return forbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Check if user has minimum role level
 * @param {string} minRole - Minimum role required
 * @returns {Function} Express middleware
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return forbidden(res, 'Authentication required');
      }

      const userRole = req.user.role;
      const userLevel = roleHierarchy[userRole];
      const minLevel = roleHierarchy[minRole];

      if (userLevel === undefined || minLevel === undefined) {
        logger.error('Invalid role in hierarchy check', { userRole, minRole });
        return forbidden(res, 'Invalid role');
      }

      if (userLevel < minLevel) {
        logger.warn('Insufficient role level', {
          userId: req.user.userId,
          userRole,
          userLevel,
          minRole,
          minLevel,
        });
        return forbidden(res, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Role level check error:', error);
      return forbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Allow only super admin
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Allow admin or super admin
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Allow doctor or higher
 */
const requireDoctor = requireMinRole('doctor');

/**
 * Allow any authenticated user
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Authentication required');
  }
  next();
};

/**
 * Check if user is accessing their own resource
 * @param {string} paramName - Request parameter containing user ID
 * @returns {Function} Express middleware
 */
const requireOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return forbidden(res, 'Authentication required');
      }

      const resourceUserId = parseInt(req.params[paramName]);
      const currentUserId = req.user.userId;

      // Super admins and admins can access any resource
      if (['super_admin', 'admin'].includes(req.user.role)) {
        return next();
      }

      // Check ownership
      if (resourceUserId !== currentUserId) {
        logger.warn('Ownership check failed', {
          userId: currentUserId,
          attemptedAccess: resourceUserId,
        });
        return forbidden(res, 'You can only access your own resources');
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return forbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Check if doctor is accessing their own clinic's resources
 * @param {string} paramName - Request parameter containing clinic ID
 * @returns {Function} Express middleware
 */
const requireClinicAccess = (paramName = 'clinicId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return forbidden(res, 'Authentication required');
      }

      // Admins can access any clinic
      if (['super_admin', 'admin'].includes(req.user.role)) {
        return next();
      }

      // For doctors, check clinic assignment
      if (req.user.role === 'doctor') {
        const requestedClinicId = parseInt(req.params[paramName] || req.body[paramName]);

        // TODO: Fetch doctor's clinic from database
        // For now, we'll store clinic_id in token or fetch from DB
        // This is a placeholder - implement actual check

        // Example: if (req.user.clinicId !== requestedClinicId)
        //   return forbidden(res, 'Access denied to this clinic');
      }

      next();
    } catch (error) {
      logger.error('Clinic access check error:', error);
      return forbidden(res, 'Permission check failed');
    }
  };
};

module.exports = {
  requireRole,
  requireMinRole,
  requireSuperAdmin,
  requireAdmin,
  requireDoctor,
  requireAuth,
  requireOwnership,
  requireClinicAccess,
  roleHierarchy,
};
