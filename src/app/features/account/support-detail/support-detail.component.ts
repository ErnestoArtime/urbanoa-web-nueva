import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideHeadphones, LucideImage, LucideMessageSquareReply, LucideUserRound } from '@lucide/angular';
import { SupportService } from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-support-detail',
  imports: [
    DatePipe,
    RouterLink,
    LucideHeadphones,
    LucideImage,
    LucideMessageSquareReply,
    LucideUserRound,
    DetailPanelHeaderComponent,
    TranslatePipe,
  ],
  template: `
    <div class="page account-static-page support-detail-page">
      <app-detail-panel-header [title]="'account.support.detailTitle' | translate" backRoute="/app/account/support" />
      @if (thread(); as item) {
        <header class="thread-header card">
          <div>
            <p class="thread-reference">#{{ referenceId(item.id) }}</p>
            <h1>{{ typeKey() | translate }}</h1>
            <p>{{ subtypeKey() | translate }} · {{ item.cityName || ('account.support.generic' | translate) }}</p>
          </div>
          <span class="status-pill" [class.closed]="item.status === 'closed'">{{ statusKey() | translate }}</span>
        </header>

        <section class="conversation" [attr.aria-label]="'account.support.conversation' | translate">
          @for (message of item.messages; track message.id) {
            <article class="message" [class.from-support]="message.author === 'support'">
              <span class="message-avatar">
                @if (message.author === 'support') {
                  <svg lucideHeadphones size="19" strokeWidth="2"></svg>
                } @else {
                  <svg lucideUserRound size="19" strokeWidth="2"></svg>
                }
              </span>
              <div class="message-bubble">
                <div class="message-author">
                  <strong>{{ (message.author === 'support' ? 'account.support.agent' : 'account.support.you') | translate }}</strong>
                  <time [attr.datetime]="message.createdAt">{{ message.createdAt | date: 'dd/MM/yyyy · HH:mm' }}</time>
                </div>
                <p>{{ message.body }}</p>
                @if (message.attachment; as attachment) {
                  <a class="message-attachment" [href]="attachment.dataUrl" target="_blank" rel="noopener">
                    @if (attachment.type.startsWith('image/')) {
                      <img [src]="attachment.dataUrl" [alt]="attachment.name" />
                    } @else {
                      <svg lucideImage size="18"></svg><span>{{ attachment.name }}</span>
                    }
                  </a>
                }
              </div>
            </article>
          }
        </section>

        <div class="reply-bar">
          <a class="btn btn-primary" [routerLink]="['/app/account/support', item.id, 'reply']">
            <svg lucideMessageSquareReply size="18" strokeWidth="2.2"></svg>
            {{ 'account.support.reply' | translate }}
          </a>
        </div>
      } @else {
        <section class="missing-thread card">
          <h1>{{ 'account.support.notFoundTitle' | translate }}</h1>
          <p>{{ 'account.support.notFoundDetail' | translate }}</p>
          <a routerLink="/app/account/support" class="btn btn-primary mt-2">{{ 'account.support.backToInbox' | translate }}</a>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .support-detail-page {
      min-height: 100%;
      padding-bottom: 5.5rem;
    }
    .thread-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border-left: 4px solid var(--color-primary);
    }
    .thread-reference {
      color: var(--color-primary);
      font-size: var(--text-2xs);
      font-weight: var(--font-extra);
      letter-spacing: 0.08em;
    }
    .thread-header h1 {
      margin-top: 0.12rem;
      font-size: var(--text-lg);
    }
    .thread-header div > p:last-child {
      margin-top: 0.2rem;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .status-pill {
      flex: none;
      padding: 0.32rem 0.6rem;
      border-radius: var(--radius-pill);
      background: var(--color-accent-soft);
      color: var(--color-primary-dark);
      font-size: var(--text-2xs);
      font-weight: var(--font-extra);
    }
    .status-pill.closed {
      background: #e3e6e1;
      color: var(--color-text-muted);
    }
    .conversation {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem 0;
    }
    .message {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      margin-left: min(12%, 4.5rem);
    }
    .message.from-support {
      margin-right: min(12%, 4.5rem);
      margin-left: 0;
    }
    .message-avatar {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: none;
      border-radius: 12px;
      background: var(--color-primary);
      color: #fff;
    }
    .from-support .message-avatar {
      background: #dbe5de;
      color: var(--color-primary-dark);
    }
    .message-bubble {
      min-width: 0;
      flex: 1;
      padding: 0.8rem 0.9rem;
      border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
      border-radius: 4px 16px 16px 16px;
      background: color-mix(in srgb, var(--color-accent-soft) 18%, var(--color-surface));
    }
    .from-support .message-bubble {
      border-color: var(--color-border);
      border-radius: 16px 4px 16px 16px;
      background: #dbe5de;
    }
    .message-author {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.8rem;
      margin-bottom: 0.35rem;
    }
    .message-author strong {
      font-size: var(--text-sm);
    }
    .message-author time {
      color: var(--color-text-muted);
      font-size: var(--text-2xs);
      white-space: nowrap;
    }
    .message-bubble > p {
      line-height: var(--line-readable);
      white-space: pre-wrap;
    }
    .message-attachment {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      max-width: 100%;
      margin-top: 0.7rem;
      color: var(--color-primary-dark);
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
    }
    .message-attachment img {
      display: block;
      width: min(100%, 260px);
      max-height: 220px;
      border-radius: var(--radius-md);
      object-fit: cover;
    }
    .reply-bar {
      position: fixed;
      z-index: 20;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      justify-content: flex-end;
      padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-surface) 94%, transparent);
      backdrop-filter: blur(12px);
    }
    .missing-thread {
      padding: 2rem;
      text-align: center;
    }
    .missing-thread p {
      margin-top: 0.35rem;
      color: var(--color-text-muted);
    }
    @media (min-width: 960px) {
      .reply-bar {
        position: sticky;
        bottom: 0;
        margin: 0 -1rem -1.25rem;
      }
    }
  `,
})
export class AccountSupportDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly support = inject(SupportService);
  private readonly threadId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly thread = computed(() => this.support.threads().find((item) => item.id === this.threadId));

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.support.getById(this.threadId)) await this.support.load();
    await this.support.markAsRead(this.threadId);
  }

  typeKey(): string {
    return `account.support.type.${this.thread()?.type ?? 'inquiry'}`;
  }

  subtypeKey(): string {
    return `account.support.subtype.${this.thread()?.subtype ?? 'information'}`;
  }

  statusKey(): string {
    return `account.support.status.${this.thread()?.status ?? 'submitted'}`;
  }

  referenceId(id: string): string {
    return id
      .replace(/^support-/i, '')
      .slice(0, 8)
      .toUpperCase();
  }
}
