import { Pipe, PipeTransform } from '@angular/core';
import { formatEuro } from '../../core/utils/euro-format';

@Pipe({ name: 'euro' })
export class EuroPipe implements PipeTransform {
  transform(amount: number): string {
    return formatEuro(amount);
  }
}
