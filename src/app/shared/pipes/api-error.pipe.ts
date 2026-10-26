import { inject, Pipe, PipeTransform } from '@angular/core';
import { apiErrorMessage } from '../../core/http/api-error-key';
import { TranslationService } from '../../core/services/translation.service';

/** Keep the OPS payload so language changes also update an already visible error. */
@Pipe({ name: 'apiError', standalone: true, pure: false })
export class ApiErrorPipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(error: unknown, fallbackKey: string): string {
    return apiErrorMessage(error, this.translation, {}, fallbackKey);
  }
}
