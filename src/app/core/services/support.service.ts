import { computed, inject, Injectable, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';

export type FeedbackType = 'incident' | 'suggestion' | 'inquiry' | 'service-complaint' | 'compliment';
export type FeedbackSubtype =
  | 'app'
  | 'citizen-services'
  | 'information'
  | 'regulations'
  | 'areas-hours'
  | 'parking-meters'
  | 'fines'
  | 'surveillance'
  | 'web';
export type FeedbackStatus = 'submitted' | 'assigned' | 'in-progress' | 'closed';

export interface SupportAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface SupportMessage {
  id: string;
  author: 'user' | 'support';
  body: string;
  createdAt: string;
  attachment?: SupportAttachment;
}

export interface SupportThread {
  id: string;
  type: FeedbackType;
  subtype: FeedbackSubtype;
  cityId: string;
  cityName: string;
  plate: string;
  status: FeedbackStatus;
  unread: boolean;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface NewSupportThread {
  type: FeedbackType;
  subtype: FeedbackSubtype;
  cityId: string;
  cityName: string;
  plate: string;
  message: string;
  attachment?: SupportAttachment;
}

interface FeedbackFileRequestDto {
  filename: string;
  title: string;
  payload: string;
}

interface RemoteFeedbackDto {
  id: number;
  contractId: number;
  date: string;
  type: number;
  subtype: number;
  message: string;
  plate?: string | null;
  status: number;
  response?: string | null;
  dateSent?: string | null;
  read: number;
}

interface QueryFeedbackResponseDto {
  feedback?: RemoteFeedbackDto[] | null;
  feedbackList?: RemoteFeedbackDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly state = signal<SupportThread[]>([]);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly cities = inject(CitiesService);

  readonly threads = this.state.asReadonly();
  readonly openThreads = computed(() => this.state().filter((thread) => thread.status !== 'closed'));
  readonly closedThreads = computed(() => this.state().filter((thread) => thread.status === 'closed'));
  readonly unreadCount = computed(() => this.state().filter((thread) => thread.unread).length);
  readonly source = signal<'idle' | 'remote' | 'error'>('idle');
  readonly loading = signal(false);
  readonly lastError = signal<OpsApiError | null>(null);

  async load(): Promise<boolean> {
    const token = this.session.token();
    if (!token) return this.fail(new OpsApiError('transport', OPS_ENDPOINTS.support.query, 'Se requiere una sesión válida'));
    this.loading.set(true);
    try {
      const response = await this.api.post<QueryFeedbackResponseDto | RemoteFeedbackDto[]>(
        OPS_ENDPOINTS.support.query,
        { contractId: 0, dateStart: '2000-01-01', dateEnd: '2100-12-31' },
        { token },
      );
      const items = Array.isArray(response) ? response : (response.feedback ?? response.feedbackList ?? []);
      this.state.set(items.map((item) => this.mapRemoteThread(item)));
      this.source.set('remote');
      this.lastError.set(null);
      return true;
    } catch (error) {
      this.state.set([]);
      return this.fail(this.toError(error, OPS_ENDPOINTS.support.query));
    } finally {
      this.loading.set(false);
    }
  }

  getById(id: string): SupportThread | undefined {
    return this.state().find((thread) => thread.id === id);
  }

  async create(input: NewSupportThread): Promise<SupportThread | null> {
    const result = await this.send(input);
    if (!result?.trim()) {
      this.fail(new OpsApiError('invalid-response', OPS_ENDPOINTS.support.add, 'AddUserFeedbackAPI no devolvió el identificador de la conversación'));
      return null;
    }
    const created = this.toConfirmedThread(result, input);
    this.state.update((threads) => [created, ...threads.filter((thread) => thread.id !== created.id)]);
    return created;
  }

  async reply(id: string, message: string, attachment?: SupportAttachment): Promise<boolean> {
    const thread = this.getById(id);
    if (!thread) return false;
    const result = await this.send(
      {
        type: thread.type,
        subtype: thread.subtype,
        cityId: thread.cityId,
        cityName: thread.cityName,
        plate: thread.plate,
        message,
        attachment,
      },
      Number(id),
    );
    if (!result) return false;
    const now = new Date().toISOString();
    this.state.update((threads) =>
      threads.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'closed' ? 'submitted' : item.status,
              unread: false,
              updatedAt: now,
              messages: [
                ...item.messages,
                { id: `${id}-${now}`, author: 'user', body: message.trim(), createdAt: now, attachment },
              ],
            }
          : item,
      ),
    );
    return true;
  }

  async markAsRead(id: string): Promise<boolean> {
    const thread = this.getById(id);
    if (!thread?.unread) return true;
    const token = this.session.token();
    const remoteId = Number(id);
    if (!token || !Number.isInteger(remoteId)) return false;
    try {
      await this.api.post<string>(OPS_ENDPOINTS.support.update, { id: remoteId, contractId: Number(thread.cityId) || 0, read: 1 }, { token });
      this.state.update((threads) => threads.map((item) => (item.id === id ? { ...item, unread: false } : item)));
      this.source.set('remote');
      this.lastError.set(null);
      return true;
    } catch (error) {
      return this.fail(this.toError(error, OPS_ENDPOINTS.support.update));
    }
  }

  private async send(input: NewSupportThread, baseId?: number): Promise<string | null> {
    const token = this.session.token();
    if (!token) {
      this.fail(new OpsApiError('transport', OPS_ENDPOINTS.support.add, 'Se requiere una sesión válida'));
      return null;
    }
    const files: FeedbackFileRequestDto[] = input.attachment
      ? [{ filename: input.attachment.name, title: input.attachment.name, payload: input.attachment.dataUrl.split(',').pop() ?? '' }]
      : [];
    try {
      const result = await this.api.post<string>(
        OPS_ENDPOINTS.support.add,
        {
          baseId: Number.isInteger(baseId) ? baseId : null,
          userId: null,
          userEmail: '',
          channel: 0,
          contractId: this.cities.contractIdFor(input.cityId),
          date: new Date().toISOString(),
          type: this.feedbackType(input.type),
          subtype: this.feedbackSubtype(input.subtype),
          message: input.message.trim(),
          plate: input.plate.trim().toUpperCase(),
          numFiles: files.length,
          files,
        },
        { token },
      );
      this.source.set('remote');
      this.lastError.set(null);
      return result;
    } catch (error) {
      this.fail(this.toError(error, OPS_ENDPOINTS.support.add));
      return null;
    }
  }

  private toConfirmedThread(id: string, input: NewSupportThread): SupportThread {
    const now = new Date().toISOString();
    return {
      id,
      type: input.type,
      subtype: input.subtype,
      cityId: input.cityId,
      cityName: input.cityName,
      plate: input.plate.trim().toUpperCase(),
      status: 'submitted',
      unread: false,
      updatedAt: now,
      messages: [{ id: `${id}-user`, author: 'user', body: input.message.trim(), createdAt: now, attachment: input.attachment }],
    };
  }

  private mapRemoteThread(item: RemoteFeedbackDto): SupportThread {
    return {
      id: String(item.id),
      type: this.localType(item.type),
      subtype: this.localSubtype(item.subtype),
      cityId: String(item.contractId),
      cityName: `Contrato ${item.contractId}`,
      plate: item.plate ?? '',
      status: item.status >= 3 ? 'closed' : item.status === 2 ? 'in-progress' : item.status === 1 ? 'assigned' : 'submitted',
      unread: item.read === 0,
      updatedAt: item.dateSent ?? item.date,
      messages: [
        { id: `${item.id}-user`, author: 'user', body: item.message, createdAt: item.date },
        ...(item.response
          ? [{ id: `${item.id}-support`, author: 'support' as const, body: item.response, createdAt: item.dateSent ?? item.date }]
          : []),
      ],
    };
  }

  private feedbackType(type: FeedbackType): number {
    return ['incident', 'suggestion', 'inquiry', 'service-complaint', 'compliment'].indexOf(type) + 1;
  }

  private feedbackSubtype(subtype: FeedbackSubtype): number {
    return ['app', 'citizen-services', 'information', 'regulations', 'areas-hours', 'parking-meters', 'fines', 'surveillance', 'web'].indexOf(subtype) + 1;
  }

  private localType(type: number): FeedbackType {
    return (['incident', 'suggestion', 'inquiry', 'service-complaint', 'compliment'][type - 1] ?? 'inquiry') as FeedbackType;
  }

  private localSubtype(subtype: number): FeedbackSubtype {
    return (['app', 'citizen-services', 'information', 'regulations', 'areas-hours', 'parking-meters', 'fines', 'surveillance', 'web'][subtype - 1] ??
      'information') as FeedbackSubtype;
  }

  private fail(error: OpsApiError): false {
    this.source.set('error');
    this.lastError.set(error);
    return false;
  }

  private toError(error: unknown, endpoint: string): OpsApiError {
    return error instanceof OpsApiError
      ? error
      : new OpsApiError('invalid-response', endpoint, error instanceof Error ? error.message : 'Error desconocido');
  }
}
