import { Pipe, PipeTransform } from '@angular/core';
import { formatPhoneDisplay } from '../utils/phone.util';

@Pipe({
  name: 'phoneFormat',
  standalone: true
})
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatPhoneDisplay(value);
  }
}
