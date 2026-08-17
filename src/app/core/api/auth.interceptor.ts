import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OpsSessionService } from './ops-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(OpsSessionService).token();
  if (!token || !request.url.includes('/api/')) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
