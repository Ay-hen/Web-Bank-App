import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicesService } from '../services/services.service';

export const authGuard: CanActivateFn = (route, state) => {
  const expectedRole = route.data['role'] as string;
  const requiredPermission = route.data['permission'] as string; // optional

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

  // Role mismatch
  if (expectedRole && expectedRole !== userRole) {
    switch (userRole) {
      case 'user':
        routerService.navigate(['/user-dashboard']);
        break;
      case 'admin':
        routerService.navigate(['/dashboard']);
        break;
      default:
        routerService.navigate(['/unauthorized']);
    }
    return false;
  }

  // Permission check (only if required)
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    routerService.navigate([currentUrl]);
    return false;
  }

  return true;

};
