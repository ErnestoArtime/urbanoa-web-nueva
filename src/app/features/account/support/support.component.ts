import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucideMessageCircle, LucidePlus } from '@lucide/angular';
import { SupportService, type SupportThread } from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

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
  ],
  template: `
    <div class="page account-static-page support-page">
      <app-detail-panel-header [title]="'account.support.title' | translate" backRoute="/app/account" />

      <div class="support-heading">
        <div>
          <p class="support-kicker">{{ 'account.support.center' | translate }}</p>
          <p class="support-intro">{{ 'account.support.inboxIntro' | translate }}</p>
        </div>
        @if (support.unreadCount()) {
          <span class="unread-summary">{{ 'account.support.unreadCount' | translate: { count: support.unreadCount() } }}</span>
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
      } @else {
        <section class="support-empty card">
          <span class="empty-icon"><svg lucideMessageCircle size="34" strokeWidth="1.8"></svg></span>
          <h2>{{ 'account.support.emptyTitle' | translate }}</h2>
          <p>{{ 'account.support.emptyDetail' | translate }}</p>
        </section>
      }

      <a class="support-fab" routerLink="/app/account/support/new" [attr.aria-label]="'account.support.newMessage' | translate">
        <svg lucidePlus size="24" strokeWidth="2.4"></svg>
        <span>{{ 'account.support.newMessage' | translate }}</span>
      </a>
    </div>

    <ng-template #threadCard let-thread>
      <a class="thread-card" [class.unread]="thread.unread" [routerLink]="['/app/account/support', thread.id]">
        <span class="thread-icon"><svg lucideMessageCircle size="20" strokeWidth="2"></svg></span>
        <span class="thread-copy">
          <span class="thread-title-row">
            <strong>{{ typeKey(thread) | translate }}</strong>
            @if (thread.unread) {
              <span class="unread-dot" [attr.aria-label]="'account.support.unread' | translate"></span>
            }
          </span>
          <span class="thread-preview">{{ thread.messages.at(-1)?.body }}</span>
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
        <svg class="thread-chevron" lucideChevronRight size="18" strokeWidth="2"></svg>
      </a>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }
    .support-page {
      position: relative;
      min-height: 100%;
      padding-bottom: 6rem;
    }
    .support-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.4rem 0.15rem 0.2rem;
    }
    .support-kicker {
      color: var(--color-primary);
      font-size: var(--text-xs);
      font-weight: var(--font-extra);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .support-intro {
      max-width: 34rem;
      margin-top: 0.25rem;
      color: var(--color-text-muted);
      line-height: var(--line-readable);
    }
    .unread-summary {
      flex: none;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-pill);
      background: var(--color-accent-soft);
      color: var(--color-primary-dark);
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
    }
    .thread-list {
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .thread-card {
      position: relative;
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr) auto 18px;
      align-items: center;
      gap: 0.7rem;
      padding: 0.9rem 0.85rem;
      border-bottom: 1px solid var(--color-border);
      color: inherit;
      text-decoration: none;
      transition:
        background 0.18s ease,
        transform 0.18s ease;
    }
    .thread-card:last-child {
      border-bottom: 0;
    }
    .thread-card:hover {
      background: color-mix(in srgb, var(--color-active) 36%, var(--color-surface));
      text-decoration: none;
    }
    .thread-card.unread {
      background: color-mix(in srgb, var(--color-accent-soft) 22%, var(--color-surface));
    }
    .thread-icon {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 13px;
      background: #dbe5de;
      color: var(--color-primary-dark);
    }
    .thread-card.unread .thread-icon {
      background: var(--color-accent-soft);
    }
    .thread-copy {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.12rem;
    }
    .thread-title-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .thread-title-row strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      flex: none;
      border-radius: 50%;
      background: var(--color-primary);
    }
    .thread-preview {
      overflow: hidden;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .thread-meta {
      color: var(--color-primary-dark);
      font-size: var(--text-2xs);
      font-weight: var(--font-bold);
    }
    .thread-date {
      align-self: start;
      padding-top: 0.15rem;
      color: var(--color-text-muted);
      font-size: var(--text-2xs);
      font-weight: var(--font-bold);
    }
    .thread-chevron {
      color: var(--color-text-muted);
    }
    .muted-list {
      opacity: 0.78;
    }
    .support-empty {
      display: grid;
      justify-items: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .empty-icon {
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      margin-bottom: 1rem;
      border-radius: 24px;
      background: #dbe5de;
      color: var(--color-primary);
      transform: rotate(-3deg);
    }
    .support-empty h2 {
      font-size: var(--text-lg);
    }
    .support-empty p {
      max-width: 26rem;
      margin-top: 0.35rem;
      color: var(--color-text-muted);
      line-height: var(--line-readable);
    }
    .support-fab {
      position: fixed;
      z-index: 20;
      right: 1.15rem;
      bottom: calc(var(--bottom-nav-height) + 1rem);
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.8rem 1rem;
      border-radius: var(--radius-pill);
      background: #9cf1ee;
      color: #143c3a;
      box-shadow: 0 7px 22px rgba(20, 83, 79, 0.22);
      font-weight: var(--font-extra);
      text-decoration: none;
    }
    .support-fab:hover {
      text-decoration: none;
      transform: translateY(-1px);
    }
    @media (min-width: 960px) {
      .support-fab {
        position: absolute;
        bottom: 1.4rem;
      }
    }
  `,
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
