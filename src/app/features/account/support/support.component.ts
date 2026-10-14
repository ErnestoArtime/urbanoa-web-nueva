import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucideMessageCircle, LucidePlus } from '@lucide/angular';
import { SupportService, type SupportThread } from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-account-support',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    LucideChevronRight,
    LucideMessageCircle,
    LucidePlus,
    DetailPanelHeaderComponent,
    TranslatePipe,
    LoaderComponent,
  ],
  template: `
    <div class="page account-static-page support-page">
      <app-loader [visible]="support.loading()" [message]="'common.loading' | translate" />
      <app-detail-panel-header [title]="'account.support.title' | translate" backRoute="/app/account" />
      @if (support.source() === 'error') {
        <div class="data-notice" role="alert">
          <span>{{ 'account.support.loadError' | translate }}</span>
          <button type="button" class="btn btn-secondary" [disabled]="support.loading()" (click)="support.load()">
            {{ 'common.retry' | translate }}
          </button>
        </div>
      }

      <div class="support-heading">
        <div>
          <p class="support-kicker">{{ 'account.support.center' | translate }}</p>
          <p class="support-intro">{{ 'account.support.inboxIntro' | translate }}</p>
        </div>
        @if (support.unreadCount()) {
          <span class="unread-summary" role="status" aria-live="polite">{{
            'account.support.unreadCount' | translate: { count: support.unreadCount() }
          }}</span>
        }
      </div>

      @if (support.threads().length) {
        @if (support.openThreads().length) {
          <p class="section-title">{{ 'account.support.openThreads' | translate }}</p>
          <div class="thread-list">
            @for (thread of support.openThreads(); track thread.id) {
              <ng-container *ngTemplateOutlet="threadCard; context: { $implicit: thread }" />
            }
          </div>
        }
        @if (support.closedThreads().length) {
          <p class="section-title">{{ 'account.support.closedThreads' | translate }}</p>
          <div class="thread-list muted-list">
            @for (thread of support.closedThreads(); track thread.id) {
              <ng-container *ngTemplateOutlet="threadCard; context: { $implicit: thread }" />
            }
          </div>
        }
      } @else if (!support.loading() && support.source() === 'remote') {
        <section class="support-empty card">
          <span class="empty-icon"><svg lucideMessageCircle size="34" strokeWidth="1.8" aria-hidden="true"></svg></span>
          <h2>{{ 'account.support.emptyTitle' | translate }}</h2>
          <p>{{ 'account.support.emptyDetail' | translate }}</p>
        </section>
      }

      <a class="support-fab" routerLink="/app/account/support/new" [attr.aria-label]="'account.support.newMessage' | translate">
        <svg lucidePlus size="24" strokeWidth="2.4" aria-hidden="true"></svg>
        <span>{{ 'account.support.newMessage' | translate }}</span>
      </a>
    </div>

    <ng-template #threadCard let-thread>
      <a class="thread-card" [class.unread]="thread.unread" [routerLink]="['/app/account/support', thread.id]">
        <span class="thread-icon"><svg lucideMessageCircle size="20" strokeWidth="2" aria-hidden="true"></svg></span>
        <span class="thread-copy">
          <span class="thread-title-row">
            <strong>{{ typeKey(thread) | translate }}</strong>
            @if (thread.unread) {
              <span class="visually-hidden">{{ 'account.support.unread' | translate }}</span>
              <span class="unread-dot" aria-hidden="true"></span>
            }
          </span>
          <span class="thread-preview">{{ thread.messages.at(-1)?.body || ('account.support.attachment' | translate) }}</span>
          <span class="thread-meta">
            {{ statusKey(thread) | translate }}
            @if (thread.cityName) {
              · {{ thread.cityName }}
            }
            @if (thread.plate) {
              · {{ thread.plate }}
            }
          </span>
        </span>
        <span class="thread-date">{{ thread.updatedAt | date: 'dd/MM/yy' }}</span>
        <svg class="thread-chevron" lucideChevronRight size="18" strokeWidth="2" aria-hidden="true"></svg>
      </a>
    </ng-template>
  `,
  styleUrl: './support.component.css',
})
export class AccountSupportComponent implements OnInit {
  readonly support = inject(SupportService);

  ngOnInit(): void {
    void this.support.load();
  }

  typeKey(thread: SupportThread): string {
    return `account.support.type.${thread.type}`;
  }

  statusKey(thread: SupportThread): string {
    return `account.support.status.${thread.status}`;
  }
}
