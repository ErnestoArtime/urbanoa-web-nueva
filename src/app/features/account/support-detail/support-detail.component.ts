import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideHeadphones, LucideImage, LucideMessageSquareReply, LucideUserRound } from '@lucide/angular';
import { SupportAttachment, SupportMessage, SupportService } from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-account-support-detail',
  imports: [
    RouterLink,
    LucideHeadphones,
    LucideImage,
    LucideMessageSquareReply,
    LucideUserRound,
    DetailPanelHeaderComponent,
    TranslatePipe,
    LoaderComponent,
  ],
  template: `
    <div class="page account-static-page support-detail-page">
      <app-loader [visible]="support.loading()" [message]="'common.loading' | translate" />
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
                  <svg lucideHeadphones size="19" strokeWidth="2" aria-hidden="true"></svg>
                } @else {
                  <svg lucideUserRound size="19" strokeWidth="2" aria-hidden="true"></svg>
                }
              </span>
              <div class="message-bubble">
                <div class="message-author">
                  <strong>{{ (message.author === 'support' ? 'account.support.agent' : 'account.support.you') | translate }}</strong>
                  <time [attr.datetime]="message.createdAt || null">{{ messageDate(message.createdAt) }}</time>
                </div>
                <p>{{ message.body }}</p>
                @for (attachment of attachmentsFor(message); track $index) {
                  <a
                    class="message-attachment"
                    [href]="attachment.dataUrl"
                    [attr.download]="attachment.dataUrl.startsWith('data:') ? attachment.name : null"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @if (attachment.type.startsWith('image/')) {
                      <img [src]="attachment.dataUrl" [alt]="attachment.name" />
                    } @else {
                      <svg lucideImage size="18" aria-hidden="true"></svg><span>{{ attachment.name }}</span>
                    }
                  </a>
                }
              </div>
            </article>
          }
        </section>

        @if (item.status !== 'closed') {
          <div class="reply-bar">
            <a class="btn btn-primary" [routerLink]="['/app/account/support', item.id, 'reply']">
              <svg lucideMessageSquareReply size="18" strokeWidth="2.2" aria-hidden="true"></svg>
              {{ 'account.support.reply' | translate }}
            </a>
          </div>
        }
      } @else if (support.source() === 'error') {
        <div class="data-notice" role="alert">
          <span>{{ 'account.support.loadError' | translate }}</span>
          <button type="button" class="btn btn-secondary" (click)="retry()">{{ 'common.retry' | translate }}</button>
        </div>
      } @else if (!support.loading()) {
        <section class="missing-thread card">
          <h1>{{ 'account.support.notFoundTitle' | translate }}</h1>
          <p>{{ 'account.support.notFoundDetail' | translate }}</p>
          <a routerLink="/app/account/support" class="btn btn-primary mt-2">{{ 'account.support.backToInbox' | translate }}</a>
        </section>
      }
    </div>
  `,
  styleUrl: './support-detail.component.css',
})
export class AccountSupportDetailComponent {
  private readonly translations = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  readonly support = inject(SupportService);
  private readonly currentId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? '',
  });
  private get threadId(): string {
    return this.currentId();
  }
  readonly thread = computed(() => this.support.getById(this.threadId));

  messageDate(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const lang = this.translations.currentLang$();
    return new Intl.DateTimeFormat(lang === 'uk' ? 'en-GB' : lang, {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  }

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        if (id) void this.initialize(id);
      });
  }

  private async initialize(id: string): Promise<void> {
    if (!this.support.getById(id)) await this.support.load();
    if (id === this.threadId && this.support.getById(id)) await this.support.markAsRead(id);
  }

  async retry(): Promise<void> {
    const id = this.threadId;
    await this.support.load();
    await this.initialize(id);
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

  attachmentsFor(message: SupportMessage): SupportAttachment[] {
    return message.attachments ?? (message.attachment ? [message.attachment] : []);
  }

  referenceId(id: string): string {
    return id
      .replace(/^support-/i, '')
      .slice(0, 8)
      .toUpperCase();
  }
}
