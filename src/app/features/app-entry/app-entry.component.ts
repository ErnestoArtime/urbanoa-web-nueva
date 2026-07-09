import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OperationsService } from '../../core/services/operations.service';

@Component({
  selector: 'app-entry',
  template: '',
})
export class AppEntryComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly operationsService = inject(OperationsService);

  ngOnInit(): void {
    const target = this.operationsService.hasActiveParkings() ? '/app/home' : '/app/parking';
    void this.router.navigate([target], { replaceUrl: true });
  }
}
