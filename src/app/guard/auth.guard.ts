import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicesService } from '../services/services.service';

export const authGuard: CanActivateFn = (route, state) => {
  const expectedRole = route.data['role'] as string;
  const requiredPermission = route.data['permission'] as string;

  const authService = inject(ServicesService);
  const routerService = inject(Router);

  const currentUrl = authService.getCurrentUrl();

  const userRole = authService.getRole();
  const userPermissions = authService.getPermissionNames();

  // Not logged in → redirect to login
  if (!authService.isLoggedIn()) {
    routerService.navigate(['/login']);
    return false;
  }

  // Role mismatch → redirect based on current role
  if (expectedRole && expectedRole !== userRole) {
    switch (userRole?.toLowerCase()) {
      case 'user':
        routerService.navigate(['/user-feedback']);
        break;
      case 'admin':
        routerService.navigate(['/dashboard']);
        break;
      default:
        routerService.navigate(['/unauthorized']);
    }
    return false;
  }

  // Normalize required permission
  const normalizedRequiredPermission = requiredPermission
    ? requiredPermission.toUpperCase().replace(/\s+/g, '_')
    : null;

  // Normalize user permissions
  const normalizedUserPermissions = userPermissions.map((perm: string) =>
    perm.toUpperCase().replace(/\s+/g, '_')
  );

  // Permission check
  if (normalizedRequiredPermission && !normalizedUserPermissions.includes(normalizedRequiredPermission)) {
    routerService.navigate([currentUrl]); // Optional: you could use /unauthorized too
    return false;
  }

  return true;
};

