import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

const PRELOAD_DELAY_MS = 4000;

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return of(null);
    return timer(PRELOAD_DELAY_MS).pipe(mergeMap(() => load()));
  }
}
