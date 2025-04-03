// permissions.model.ts

// 1. Define all possible permissions with clear categories
export enum Permission {
    // Dashboard access
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',
    
    // Authentication/User management
    RESET_PASSWORD = 'RESET_PASSWORD',
    MANAGE_USERS = 'MANAGE_USERS',         // Create, block users
    MANAGE_ADMINS_PERMISSIONS = 'MANAGE_ADMINS_PERMISSIONS',
    
    // Monitoring
    VIEW_ADMIN_ACTIVITY = 'VIEW_ADMIN_ACTIVITY',
    
    // Feedback system
    SEND_FEEDBACK = 'SEND_FEEDBACK',
    VIEW_FEEDBACK = 'VIEW_FEEDBACK',
    
    // Reports
    GENERATE_REPORTS = 'GENERATE_REPORTS',
    
    // Transactions
    MANAGE_TRANSACTIONS = 'MANAGE_TRANSACTIONS',
    
    // Notifications
    NOTIFICATION_MANAGEMENT = 'NOTIFICATION_MANAGEMENT',
    
    // System
    MANAGE_SETTINGS = 'MANAGE_SETTINGS'
}

// 2. Strongly typed role definitions
export enum AppRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    AUDITOR = 'auditor',
    USER = 'user'
}

  // 3. Enhanced user permissions interface
export interface UserPermissions {
    userId?: string;          // For future use with backend
    roles: AppRole[];         // Use enum instead of string
    permissions: Permission[]; // Direct permissions (override roles)
    isCustomAdmin?: boolean;  // Flag for customizable admin permissions
}

  // 4. Default role permissions with better organization
const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
    [AppRole.SUPER_ADMIN]: [
        Permission.VIEW_DASHBOARD,
        Permission.RESET_PASSWORD,
        Permission.MANAGE_USERS,
        Permission.MANAGE_ADMINS_PERMISSIONS,
        Permission.VIEW_ADMIN_ACTIVITY,
        Permission.VIEW_FEEDBACK,
        Permission.GENERATE_REPORTS,
        Permission.MANAGE_TRANSACTIONS,
        Permission.NOTIFICATION_MANAGEMENT,
        Permission.MANAGE_SETTINGS
    ],
    
    [AppRole.ADMIN]: [], // Empty because it will be dynamic from backend
    
    [AppRole.AUDITOR]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_FEEDBACK
    ],
    
    [AppRole.USER]: [
        Permission.VIEW_DASHBOARD,
        Permission.SEND_FEEDBACK,
        Permission.VIEW_FEEDBACK
    ]
};

// 5. Permission service utilities
export class PermissionService {
    static getDefaultPermissions(role: AppRole): Permission[] {
      return [...DEFAULT_ROLE_PERMISSIONS[role]]; // Return copy
    }

    static mergePermissions(userPermissions: UserPermissions): Permission[] {
        const rolePermissions = userPermissions.roles.flatMap(role => 
        this.getDefaultPermissions(role)
    );

      // Combine role permissions with direct permissions
        return [...new Set([...rolePermissions, ...userPermissions.permissions])];
    }

    static hasPermission(
        userPermissions: UserPermissions, 
        requiredPermission: Permission
    ): boolean {
        const effectivePermissions = this.mergePermissions(userPermissions);
        return effectivePermissions.includes(requiredPermission);
    }
}