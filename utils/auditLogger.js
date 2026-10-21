import AuditLog from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';

export async function logAuditEvent({ action, req, user, details, target }) {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
        const userAgent = req ? (req.headers['user-agent'] || '') : '';

        // Priority resolution of user info
        let email = user?.email || req?.user?.email || req?.body?.performedBy?.email || req?.headers?.['x-user-email'];
        let name = user?.name || req?.user?.name || req?.body?.performedBy?.name || req?.headers?.['x-user-name'];
        let role = user?.role || req?.user?.role || req?.body?.performedBy?.role || req?.headers?.['x-user-role'];
        let userId = user?._id || user?.id || req?.user?._id || req?.user?.id || req?.body?.performedBy?.id || req?.headers?.['x-user-id'] || null;

        // If still not resolved and Authorization header is present
        if (!email && req?.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.decode(token);
                if (decoded) {
                    email = decoded.email;
                    name = decoded.name;
                    role = decoded.role;
                    userId = decoded.id;
                }
            } catch (e) {}
        }

        // Operational admin fallback: if an internal order/delivery/inventory action has no explicit session, attribute to Admin Nell
        const isAuthFlowAction = action.startsWith('LOGIN') || action.startsWith('OTP') || action.startsWith('REGISTER');
        if (!email && !isAuthFlowAction) {
            email = 'admin@archon.com';
            name = 'Admin Nell';
            role = 'admin';
        }

        const performedBy = {
            email: email || 'Anonymous/System',
            name: name || 'Anonymous',
            role: role || 'system',
            userId: userId || null
        };

        const log = new AuditLog({
            action,
            performedBy,
            target: target || '',
            details,
            ip,
            userAgent
        });

        await log.save();
        return log;
    } catch (err) {
        console.error('AuditLog error:', err.message);
    }
}
