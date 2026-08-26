import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCamera, LucideImage, LucidePaperclip, LucideTrash2 } from '@lucide/angular';
import { SupportService, type FeedbackSubtype, type FeedbackType, type SupportAttachment } from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';

interface SelectOption<T extends string> {
  value: T;
  labelKey: string;
}

const FEEDBACK_TYPES: SelectOption<FeedbackType>[] = [
  { value: 'incident', labelKey: 'account.support.type.incident' },
  { value: 'suggestion', labelKey: 'account.support.type.suggestion' },
  { value: 'inquiry', labelKey: 'account.support.type.inquiry' },
  { value: 'service-complaint', labelKey: 'account.support.type.service-complaint' },
  { value: 'compliment', labelKey: 'account.support.type.compliment' },
];

const FEEDBACK_SUBTYPES: SelectOption<FeedbackSubtype>[] = [
  { value: 'app', labelKey: 'account.support.subtype.app' },
  { value: 'citizen-services', labelKey: 'account.support.subtype.citizen-services' },
  { value: 'information', labelKey: 'account.support.subtype.information' },
  { value: 'regulations', labelKey: 'account.support.subtype.regulations' },
  { value: 'areas-hours', labelKey: 'account.support.subtype.areas-hours' },
  { value: 'parking-meters', labelKey: 'account.support.subtype.parking-meters' },
  { value: 'fines', labelKey: 'account.support.subtype.fines' },
  { value: 'surveillance', labelKey: 'account.support.subtype.surveillance' },
  { value: 'web', labelKey: 'account.support.subtype.web' },
];

@Component({
  selector: 'app-account-support-form',
  imports: [
    ReactiveFormsModule,
    LucideCamera,
    LucideImage,
    LucidePaperclip,
    LucideTrash2,
    DetailPanelHeaderComponent,
    ResultModalComponent,
    TranslatePipe,
  ],
  template: `
    <div class="page account-static-page has-sticky-actions support-form-page">
      <app-detail-panel-header [title]="titleKey() | translate" [backRoute]="backRoute()" />
      @if (replyThread(); as thread) {
        <aside class="reply-context">
          <span>{{ 'account.support.replyingTo' | translate }}</span>
          <strong>{{ 'account.support.type.' + thread.type | translate }}</strong>
          <small>#{{ thread.id.slice(0, 8).toUpperCase() }} · {{ thread.cityName }}</small>
        </aside>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (!isReply()) {
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="support-category">{{ 'account.support.category' | translate }}</label>
              <select id="support-category" class="form-input" formControlName="type">
                <option value="">{{ 'account.support.selectCategory' | translate }}</option>
                @for (option of types; track option.value) {
                  <option [value]="option.value">{{ option.labelKey | translate }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="support-subcategory">{{ 'account.support.subcategory' | translate }}</label>
              <select id="support-subcategory" class="form-input" formControlName="subtype">
                <option value="">{{ 'account.support.selectSubcategory' | translate }}</option>
                @for (option of subtypes; track option.value) {
                  <option [value]="option.value">{{ option.labelKey | translate }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="support-city">{{ 'account.support.municipio' | translate }}</label>
              <select id="support-city" class="form-input" formControlName="cityId">
                <option value="">{{ 'account.support.selectMunicipio' | translate }}</option>
                @for (city of municipios(); track city.id) {
                  <option [value]="city.id">{{ city.nombre }} · {{ city.provincia }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="support-plate">{{ 'account.support.plate' | translate }}</label>
              <input id="support-plate" class="form-input plate-input" formControlName="plate" autocomplete="off" />
              @if (form.controls.plate.invalid && form.controls.plate.touched) {
                <p class="form-error">{{ 'validation.plate' | translate }}</p>
              }
            </div>
          </div>
        }

        <div class="form-group message-field">
          <div class="field-heading">
            <label class="form-label" for="support-message">{{ 'account.support.message' | translate }}</label>
            <span>{{ form.controls.message.value.length }}/500</span>
          </div>
          <textarea
            id="support-message"
            class="form-input"
            rows="7"
            maxlength="500"
            formControlName="message"
            [placeholder]="'account.support.messagePlaceholder' | translate"
          ></textarea>
          @if (form.controls.message.invalid && form.controls.message.touched) {
            <p class="form-error">{{ 'account.support.messageRequired' | translate }}</p>
          }
        </div>

        <section class="attachment-card" aria-labelledby="attachment-title">
          <div class="attachment-heading">
            <span class="attachment-icon"><svg lucidePaperclip size="18"></svg></span>
            <div>
              <strong id="attachment-title">{{ 'account.support.attachment' | translate }}</strong
              ><small>{{ 'account.support.attachmentHint' | translate }}</small>
            </div>
          </div>
          <div class="attachment-actions">
            <label class="attachment-button">
              <svg lucideImage size="19"></svg><span>{{ 'account.support.gallery' | translate }}</span>
              <input type="file" accept="image/*" (change)="selectFile($event)" />
            </label>
            <label class="attachment-button">
              <svg lucideCamera size="19"></svg><span>{{ 'account.support.camera' | translate }}</span>
              <input type="file" accept="image/*" capture="environment" (change)="selectFile($event)" />
            </label>
          </div>
          @if (attachment(); as file) {
            <div class="attachment-preview">
              <img [src]="file.dataUrl" [alt]="file.name" />
              <div>
                <strong>{{ file.name }}</strong
                ><span>{{ 'account.support.imageReady' | translate }}</span>
              </div>
              <button type="button" (click)="attachment.set(null)" [attr.aria-label]="'account.support.removeAttachment' | translate">
                <svg lucideTrash2 size="19"></svg>
              </button>
            </div>
          }
          @if (attachmentError()) {
            <p class="form-error">{{ attachmentError()! | translate }}</p>
          }
        </section>

        <div class="sticky-actions">
          <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting()">
            {{ (isReply() ? 'account.support.sendReply' : 'account.support.send') | translate }}
          </button>
        </div>
      </form>

      @if (showError()) {
        <app-result-modal
          type="error"
          [title]="'account.support.missingTitle' | translate"
          [message]="'account.support.requiredFields' | translate"
          [primaryText]="'account.support.reviewForm' | translate"
          (primaryAction)="showError.set(false)"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .support-form-page {
      max-width: 760px;
      margin: 0 auto;
    }
    .reply-context {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      margin-bottom: 1rem;
      padding: 0.75rem 0.9rem;
      border-left: 4px solid var(--color-primary);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      background: #dbe5de;
    }
    .reply-context span,
    .reply-context small {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 1rem;
    }
    .plate-input {
      text-transform: uppercase;
    }
    .message-field {
      margin-top: 0.25rem;
    }
    .field-heading {
      display: flex;
      justify-content: space-between;
    }
    .field-heading > span {
      color: var(--color-text-muted);
      font-size: var(--text-2xs);
    }
    textarea.form-input {
      min-height: 132px;
      resize: vertical;
      line-height: var(--line-readable);
    }
    .attachment-card {
      padding: 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .attachment-heading {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .attachment-heading > div {
      display: flex;
      flex-direction: column;
    }
    .attachment-heading small {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }
    .attachment-icon {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: #dbe5de;
      color: var(--color-primary-dark);
    }
    .attachment-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem;
      margin-top: 0.8rem;
    }
    .attachment-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.65rem;
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-pill);
      color: var(--color-primary);
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
      cursor: pointer;
    }
    .attachment-button:hover {
      background: var(--color-active);
    }
    .attachment-button input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
    .attachment-preview {
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr) 36px;
      align-items: center;
      gap: 0.65rem;
      margin-top: 0.8rem;
      padding: 0.55rem;
      border-radius: var(--radius-md);
      background: #dbe5de;
    }
    .attachment-preview img {
      width: 58px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }
    .attachment-preview div {
      display: flex;
      min-width: 0;
      flex-direction: column;
    }
    .attachment-preview strong {
      overflow: hidden;
      font-size: var(--text-xs);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .attachment-preview span {
      color: var(--color-text-muted);
      font-size: var(--text-2xs);
    }
    .attachment-preview button {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--color-error);
      cursor: pointer;
    }
    .sticky-actions button:disabled {
      opacity: 0.6;
      cursor: wait;
    }
    @media (max-width: 620px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AccountSupportFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly support = inject(SupportService);
  private readonly cities = inject(CitiesService);
  private readonly threadId = this.route.snapshot.paramMap.get('id');

  readonly types = FEEDBACK_TYPES;
  readonly subtypes = FEEDBACK_SUBTYPES;
  readonly municipios = signal<ParkingMunicipio[]>([]);
  readonly replyThread = computed(() => (this.threadId ? this.support.threads().find((thread) => thread.id === this.threadId) : undefined));
  readonly attachment = signal<SupportAttachment | null>(null);
  readonly attachmentError = signal<string | null>(null);
  readonly showError = signal(false);
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    type: ['' as FeedbackType | '', Validators.required],
    subtype: ['' as FeedbackSubtype | '', Validators.required],
    cityId: ['', Validators.required],
    plate: ['', Validators.pattern(/^[0-9]{4}\s?[A-Z]{3}$|^[A-Z]{1,3}\s?[0-9]{1,4}\s?[A-Z]{1,3}$/i)],
    message: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly isReply = () => Boolean(this.threadId);
  readonly titleKey = () => (this.isReply() ? 'account.support.replyTitle' : 'account.support.newMessage');
  readonly backRoute = () => (this.threadId ? `/app/account/support/${this.threadId}` : '/app/account/support');

  async ngOnInit(): Promise<void> {
    try {
      this.municipios.set((await this.cities.getCities()).data);
    } catch {
      this.municipios.set([]);
    }
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.attachmentError.set(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.attachmentError.set('account.support.attachmentTypeError');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.attachmentError.set('account.support.attachmentSizeError');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.attachment.set({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => this.attachmentError.set('account.support.attachmentReadError');
    reader.readAsDataURL(file);
  }

  async submit(): Promise<void> {
    this.showError.set(false);
    if (this.form.controls.message.invalid || (!this.isReply() && this.form.invalid)) {
      this.form.markAllAsTouched();
      this.showError.set(true);
      return;
    }
    this.submitting.set(true);
    const values = this.form.getRawValue();
    let success = false;
    if (this.threadId) {
      success = await this.support.reply(this.threadId, values.message, this.attachment() ?? undefined);
    } else {
      const city = this.municipios().find((item) => item.id === values.cityId);
      success = Boolean(await this.support.create({
        type: values.type as FeedbackType,
        subtype: values.subtype as FeedbackSubtype,
        cityId: values.cityId,
        cityName: city?.nombre ?? '',
        plate: values.plate,
        message: values.message,
        attachment: this.attachment() ?? undefined,
      }));
    }
    this.submitting.set(false);
    if (success) void this.router.navigate(['/app/account/support-success']);
    else this.showError.set(true);
  }
}
