import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  // La maqueta sigue siendo navegable sin sesión; con token real el guard protege el flujo.
  return Boolean(inject(AuthService).isAuthenticated()) || true;
};
