import { AppIconComponent } from '../../../shared/icons/app-icon.component';
import { ApiErrorPipe } from '../../../shared/pipes/api-error.pipe';
import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCamera, LucideImage, LucidePaperclip } from '@lucide/angular';
import {
  supportImageFileError,
  SupportService,
  type FeedbackSubtype,
  type FeedbackType,
  type SupportAttachment,
} from '../../../core/services/support.service';
import { DetailPanelHeaderComponent } from '../../../layout/detail-panel-header/detail-panel-header.component';
import { ResultModalComponent } from '../../../shared/components/result-modal/result-modal.component';
import { SelectComponent, type SelectOption as SelectChoice } from '../../../shared/components/select/select.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { CitiesService, type ParkingMunicipio } from '../../../core/services/cities.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { TranslationService } from '../../../core/services/translation.service';

interface SelectOption<T extends string> {
  value: T;
  labelKey: string;
}

const FEEDBACK_TYPES: SelectOption<FeedbackType>[] = [
  { value: 'incident', labelKey: 'account.support.type.incident' },
  { value: 'suggestion', labelKey: 'account.support.type.suggestion' },
  { value: 'inquiry', labelKey: 'account.support.type.inquiry' },
  { value: 'compliment', labelKey: 'account.support.type.compliment' },
];

const FEEDBACK_SUBTYPES: SelectOption<FeedbackSubtype>[] = [
  { value: 'app', labelKey: 'account.support.subtype.app' },
  { value: 'parking-meters', labelKey: 'account.support.subtype.parking-meters' },
  { value: 'user-service', labelKey: 'account.support.subtype.user-service' },
  { value: 'surveillance-fines', labelKey: 'account.support.subtype.surveillance-fines' },
  { value: 'regulations', labelKey: 'account.support.subtype.regulations' },
];

@Component({
  selector: 'app-account-support-form',
  imports: [
    SelectComponent,
    AppIconComponent,
    ApiErrorPipe,
    ReactiveFormsModule,
    LucideCamera,
    LucideImage,
    LucidePaperclip,
    DetailPanelHeaderComponent,
    ResultModalComponent,
    LoaderComponent,
    TranslatePipe,
  ],
  template: `
    <app-loader [visible]="submitting() || loading()" [message]="'common.loading' | translate" />
    @if (loadFailed()) {
      <div class="data-notice" role="alert">
        <span>{{ supportError() | apiError: (isReply() ? 'account.support.loadError' : 'parking.cities.loadError') }}</span>
        <button type="button" class="btn btn-secondary" (click)="retryLoad()">{{ 'common.retry' | translate }}</button>
      </div>
    }
    <div class="page account-static-page account-form-page has-sticky-actions support-form-page">
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
              <app-select
                inputId="support-category"
                formControlName="type"
                [options]="typeOptions()"
                [placeholder]="'account.support.selectCategory' | translate"
                [invalid]="form.controls.type.invalid && form.controls.type.touched"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="support-subcategory">{{ 'account.support.subcategory' | translate }}</label>
              <app-select
                inputId="support-subcategory"
                formControlName="subtype"
                [options]="subtypeOptions()"
                [placeholder]="'account.support.selectSubcategory' | translate"
                [invalid]="form.controls.subtype.invalid && form.controls.subtype.touched"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="support-city">{{ 'account.support.municipio' | translate }}</label>
              <app-select
                inputId="support-city"
                formControlName="cityId"
                [options]="cityOptions()"
                [placeholder]="'account.support.selectMunicipio' | translate"
                [invalid]="form.controls.cityId.invalid && form.controls.cityId.touched"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="support-plate">{{ 'account.support.plate' | translate }}</label>
              <app-select
                inputId="support-plate"
                formControlName="plate"
                [options]="plateOptions()"
                [placeholder]="'account.support.noPlate' | translate"
                [invalid]="form.controls.plate.invalid && form.controls.plate.touched"
              />
            </div>
          </div>
        }

        <div class="form-group message-field">
          <div class="field-heading">
            <label class="form-label" for="support-message">{{ 'account.support.message' | translate }}</label>
            <span id="support-message-counter">{{ form.controls.message.value.length }}/500</span>
          </div>
          <textarea
            id="support-message"
            class="form-input"
            rows="7"
            maxlength="500"
            formControlName="message"
            required
            aria-describedby="support-message-counter support-message-error"
            [attr.aria-invalid]="form.controls.message.invalid && form.controls.message.touched"
            [placeholder]="'account.support.messagePlaceholder' | translate"
          ></textarea>
          @if (form.controls.message.invalid && form.controls.message.touched) {
            <p id="support-message-error" class="form-error" role="alert">{{ 'account.support.messageRequired' | translate }}</p>
          }
        </div>

        <section class="attachment-card" aria-labelledby="attachment-title">
          <div class="attachment-heading">
            <span class="attachment-icon"><svg lucidePaperclip size="18" aria-hidden="true"></svg></span>
            <div>
              <strong id="attachment-title">{{ 'account.support.attachment' | translate }}</strong
              ><small>{{ 'account.support.attachmentHint' | translate }}</small>
            </div>
          </div>
          <div class="attachment-actions">
            <label class="attachment-button">
              <svg lucideImage size="19" aria-hidden="true"></svg><span>{{ 'account.support.gallery' | translate }}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                aria-describedby="attachment-title attachment-error"
                (change)="selectFile($event)"
              />
            </label>
            <label class="attachment-button">
              <svg lucideCamera size="19" aria-hidden="true"></svg><span>{{ 'account.support.camera' | translate }}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                capture="environment"
                aria-describedby="attachment-title attachment-error"
                (change)="selectFile($event)"
              />
            </label>
          </div>
          @if (attachment(); as file) {
            <div class="attachment-preview" role="status" aria-live="polite">
              <img [src]="file.dataUrl" [alt]="file.name" />
              <div>
                <strong>{{ file.name }}</strong
                ><span>{{ 'account.support.imageReady' | translate }}</span>
              </div>
              <button
                type="button"
                [disabled]="submitting()"
                (click)="clearAttachment()"
                [attr.aria-label]="'account.support.removeAttachment' | translate"
              >
                <app-icon name="delete" [size]="19" [stroke]="false" />
              </button>
            </div>
          }
          @if (attachmentError()) {
            <p id="attachment-error" class="form-error" role="alert">{{ attachmentError()! | translate }}</p>
          }
        </section>

        <div class="sticky-actions">
          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="submitting() || loading() || loadFailed() || attachmentReading()"
            [attr.aria-busy]="submitting()"
          >
            {{ (isReply() ? 'account.support.sendReply' : 'account.support.send') | translate }}
          </button>
        </div>
      </form>

      @if (showError()) {
        <app-result-modal
          type="error"
          [title]="'account.support.missingTitle' | translate"
          [message]="
            sendFailed() ? (supportError() | apiError: 'account.support.sendError') : ('account.support.requiredFields' | translate)
          "
          [primaryText]="'account.support.reviewForm' | translate"
          (primaryAction)="showError.set(false)"
        />
      }
    </div>
  `,
  styleUrl: './support-form.component.css',
})
export class AccountSupportFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly support = inject(SupportService);
  private readonly cities = inject(CitiesService);
  private readonly vehicleService = inject(VehicleService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private get threadId(): string | null {
    return this.params().get('id');
  }
  private loadRevision = 0;
  private attachmentRevision = 0;
  private attachmentReader?: FileReader;

  readonly types = FEEDBACK_TYPES;
  readonly subtypes = FEEDBACK_SUBTYPES;
  readonly municipios = signal<ParkingMunicipio[]>([]);
  private readonly labelled = (options: SelectOption<string>[]): SelectChoice[] => {
    this.translation.currentLang$();
    return options.map((option) => ({ value: option.value, label: this.translation.translate(option.labelKey) }));
  };
  readonly typeOptions = computed<SelectChoice[]>(() => this.labelled(this.types));
  readonly subtypeOptions = computed<SelectChoice[]>(() => this.labelled(this.subtypes));
  readonly cityOptions = computed<SelectChoice[]>(() => [
    ...this.municipios().map((city) => ({ value: String(city.id), label: city.nombre })),
    { value: '0', label: this.translation.translate('account.support.generic') },
  ]);
  readonly plateOptions = computed<SelectChoice[]>(() => [
    { value: '', label: this.translation.translate('account.support.noPlate') },
    ...this.vehicles().map((vehicle) => ({ value: vehicle.plate, label: vehicle.plate })),
  ]);
  readonly vehicles = this.vehicleService.vehicles;
  readonly replyThread = computed(() => (this.threadId ? this.support.getById(this.threadId) : undefined));
  readonly attachment = signal<SupportAttachment | null>(null);
  readonly attachmentError = signal<string | null>(null);
  readonly showError = signal(false);
  readonly submitting = signal(false);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly requestError = signal<unknown>(null);
  supportError(): unknown {
    return this.requestError() ?? this.support.lastError?.();
  }
  readonly sendFailed = signal(false);
  readonly attachmentReading = signal(false);
  readonly form = this.fb.nonNullable.group({
    type: ['' as FeedbackType | '', Validators.required],
    subtype: ['' as FeedbackSubtype | '', Validators.required],
    cityId: ['', Validators.required],
    plate: [''],
    message: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
  });

  readonly isReply = () => Boolean(this.threadId);
  readonly titleKey = () => (this.isReply() ? 'account.support.replyTitle' : 'account.support.newMessage');
  readonly backRoute = () => (this.threadId ? `/app/account/support/${this.threadId}` : '/app/account/support');

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.loadRevision++;
      this.clearAttachment();
    });
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.initialize();
      });
  }

  private async initialize(resetDraft = true): Promise<void> {
    const revision = ++this.loadRevision;
    const id = this.threadId;
    this.loading.set(true);
    this.loadFailed.set(false);
    this.requestError.set(null);
    this.showError.set(false);
    this.sendFailed.set(false);
    if (resetDraft) {
      this.form.reset();
      this.clearAttachment();
    }
    this.form.disable({ emitEvent: false });
    try {
      if (id && !this.support.getById(id)) await this.support.load();
      if (revision !== this.loadRevision) return;
      const replyThread = id ? this.support.getById(id) : undefined;
      if (id && !replyThread) {
        await this.router.navigate(['/app/account/support']);
        return;
      }
      if (replyThread?.status === 'closed') {
        await this.router.navigate(['/app/account/support', replyThread.id]);
        return;
      }
      if (!replyThread) {
        const [cities] = await Promise.all([
          this.cities.getCities(),
          this.vehicleService.vehicles().length ? Promise.resolve() : this.vehicleService.load(),
        ]);
        if (revision !== this.loadRevision) return;
        this.municipios.set(cities.data);
      }
      const mainVehicle = this.vehicleService.mainVehicle();
      if (mainVehicle && !this.form.controls.plate.value) this.form.controls.plate.setValue(mainVehicle.plate);
    } catch (error) {
      if (revision === this.loadRevision) {
        this.requestError.set(error);
        this.municipios.set([]);
        this.loadFailed.set(true);
      }
    } finally {
      if (revision === this.loadRevision) {
        this.loading.set(false);
        if (!this.submitting() && !this.loadFailed()) this.form.enable({ emitEvent: false });
      }
    }
  }

  selectFile(event: Event): void {
    if (this.submitting()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.attachmentError.set(null);
    if (!file) return;
    this.clearAttachment();
    const validationError = supportImageFileError(file);
    if (validationError) {
      this.attachmentError.set(validationError === 'size' ? 'account.support.attachmentSizeError' : 'account.support.attachmentTypeError');
      return;
    }
    const reader = new FileReader();
    this.attachmentReader = reader;
    const revision = this.attachmentRevision;
    this.attachmentReading.set(true);
    reader.onload = () => {
      if (revision !== this.attachmentRevision) return;
      this.attachment.set({ name: file.name, type: file.type, dataUrl: String(reader.result), size: file.size });
      this.attachmentReading.set(false);
    };
    reader.onerror = () => {
      if (revision !== this.attachmentRevision) return;
      this.attachmentError.set('account.support.attachmentReadError');
      this.attachmentReading.set(false);
    };
    reader.readAsDataURL(file);
  }

  clearAttachment(): void {
    this.attachmentRevision++;
    if (this.attachmentReader?.readyState === FileReader.LOADING) this.attachmentReader.abort();
    this.attachmentReader = undefined;
    this.attachment.set(null);
    this.attachmentReading.set(false);
    this.attachmentError.set(null);
  }

  async retryLoad(): Promise<void> {
    if (!this.loading() && !this.submitting()) await this.initialize(false);
  }

  async submit(): Promise<void> {
    if (this.submitting() || this.loading() || this.loadFailed() || this.attachmentReading()) return;
    const revision = this.loadRevision;
    const id = this.threadId;
    this.showError.set(false);
    this.sendFailed.set(false);
    if (this.form.controls.message.invalid || (!this.isReply() && this.form.invalid)) {
      this.form.markAllAsTouched();
      this.showError.set(true);
      return;
    }
    this.requestError.set(null);
    this.submitting.set(true);
    this.form.disable({ emitEvent: false });
    try {
      const values = this.form.getRawValue();
      let success = false;
      if (id) {
        success = await this.support.reply(id, values.message, this.attachment() ?? undefined);
      } else {
        const city = this.municipios().find((item) => item.id === values.cityId);
        success = Boolean(
          await this.support.create({
            type: values.type as FeedbackType,
            subtype: values.subtype as FeedbackSubtype,
            cityId: values.cityId,
            cityName: city?.nombre ?? '',
            plate: values.plate,
            message: values.message,
            attachment: this.attachment() ?? undefined,
          }),
        );
      }
      if (revision !== this.loadRevision) return;
      if (success) void this.router.navigate(['/app/account/support-success']);
      else {
        this.sendFailed.set(true);
        this.showError.set(true);
      }
    } catch (error) {
      if (revision === this.loadRevision) {
        this.requestError.set(error);
        this.sendFailed.set(true);
        this.showError.set(true);
      }
    } finally {
      this.submitting.set(false);
      if (!this.loading()) this.form.enable({ emitEvent: false });
    }
  }
}
