import { Injectable, computed, inject, signal } from '@angular/core';
import { generateUuid } from '../utils/generate-uuid';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';
import { AppApiClient } from '../api/app-api-client.service';

export type FeedbackType = 'incident' | 'suggestion' | 'inquiry' | 'service-complaint' | 'compliment';
export type FeedbackSubtype =
  'app' | 'citizen-services' | 'information' | 'regulations' | 'areas-hours' | 'parking-meters' | 'fines' | 'surveillance' | 'web';
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

const STORAGE_KEY = 'urbanoa.support.threads';

const INITIAL_THREADS: SupportThread[] = [
  {
    id: 'support-1048',
    type: 'incident',
    subtype: 'parking-meters',
    cityId: 'zarautz',
    cityName: 'Zarautz',
    plate: '1234 ABC',
    status: 'in-progress',
    unread: true,
    updatedAt: '2026-08-11T09:35:00.000Z',
    messages: [
      {
        id: 'support-message-1',
        author: 'user',
        body: 'El parquímetro de Nagusia Kalea no reconoce el pago con tarjeta.',
        createdAt: '2026-08-10T16:10:00.000Z',
      },
      {
        id: 'support-message-2',
        author: 'support',
        body: 'Gracias por avisarnos. El equipo municipal está revisando el dispositivo.',
        createdAt: '2026-08-11T09:35:00.000Z',
      },
    ],
  },
  {
    id: 'support-1031',
    type: 'inquiry',
    subtype: 'areas-hours',
    cityId: 'tolosa',
    cityName: 'Tolosa',
    plate: '',
    status: 'closed',
    unread: false,
    updatedAt: '2026-08-02T12:20:00.000Z',
    messages: [
      {
        id: 'support-message-3',
        author: 'user',
        body: '¿Cuál es el horario de la zona azul los sábados?',
        createdAt: '2026-08-02T10:05:00.000Z',
      },
      {
        id: 'support-message-4',
        author: 'support',
        body: 'Los sábados el servicio funciona de 09:00 a 14:00. Gracias por contactar con ArinPark.',
        createdAt: '2026-08-02T12:20:00.000Z',
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly state = signal<SupportThread[]>(this.readThreads());

  readonly threads = this.state.asReadonly();
  readonly openThreads = computed(() => this.state().filter((thread) => thread.status !== 'closed'));
  readonly closedThreads = computed(() => this.state().filter((thread) => thread.status === 'closed'));
  readonly unreadCount = computed(() => this.state().filter((thread) => thread.unread).length);
  readonly source = signal<'remote' | 'mock'>('mock');

  private readonly session = inject(OpsSessionService);
  private readonly cities = inject(CitiesService);
  private readonly restApi = inject(AppApiClient);

  async load(): Promise<void> {
    const token = this.session?.token();
    if (!token) return;
    try {
      const response = await this.restApi.get<RemoteFeedbackDto[]>('/support/tickets');
      this.state.set(this.mapRemoteThreads(response));
      this.source.set('remote');
      this.persist();
    } catch (error) {
      console.warn('[OPS API] Soporte utiliza fallback mock', error);
      this.source.set('mock');
    }
  }

  getById(id: string): SupportThread | undefined {
    return this.state().find((thread) => thread.id === id);
  }

  create(input: NewSupportThread): SupportThread {
    const now = new Date().toISOString();
    const thread: SupportThread = {
      id: generateUuid(),
      type: input.type,
      subtype: input.subtype,
      cityId: input.cityId,
      cityName: input.cityName,
      plate: input.plate.trim().toUpperCase(),
      status: 'submitted',
      unread: false,
      updatedAt: now,
      messages: [
        {
          id: generateUuid(),
          author: 'user',
          body: input.message.trim(),
          createdAt: now,
          attachment: input.attachment,
        },
      ],
    };
    this.state.update((threads) => [thread, ...threads]);
    this.persist();
    void this.syncMessage(thread, input.message, input.attachment);
    return thread;
  }

  reply(id: string, message: string, attachment?: SupportAttachment): boolean {
    const now = new Date().toISOString();
    let updated = false;
    this.state.update((threads) =>
      threads.map((thread) => {
        if (thread.id !== id) return thread;
        updated = true;
        return {
          ...thread,
          status: thread.status === 'closed' ? 'submitted' : thread.status,
          unread: false,
          updatedAt: now,
          messages: [...thread.messages, { id: generateUuid(), author: 'user', body: message.trim(), createdAt: now, attachment }],
        };
      }),
    );
    if (updated) this.persist();
    const thread = this.getById(id);
    if (thread) void this.syncMessage(thread, message, attachment, Number(id));
    return updated;
  }

  markAsRead(id: string): void {
    if (!this.getById(id)?.unread) return;
    this.state.update((threads) => threads.map((thread) => (thread.id === id ? { ...thread, unread: false } : thread)));
    this.persist();
  }

  private readThreads(): SupportThread[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SupportThread[] | null;
      return Array.isArray(parsed) ? parsed : INITIAL_THREADS.map((thread) => structuredClone(thread));
    } catch {
      return INITIAL_THREADS.map((thread) => structuredClone(thread));
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // The mock remains usable in memory when browser storage is restricted.
    }
  }

  private async syncMessage(thread: SupportThread, message: string, attachment?: SupportAttachment, baseId?: number): Promise<void> {
    const token = this.session?.token();
    if (!token) {
      this.source.set('mock');
      return;
    }
    try {
      const files = attachment
        ? [{ filename: attachment.name, title: attachment.name, payload: attachment.dataUrl.split(',').pop() ?? '' }]
        : [];
      const payload = {
        type: this.feedbackType(thread.type),
        subtype: this.feedbackSubtype(thread.subtype),
        message: message.trim(),
        plate: thread.plate,
        cityId: this.cities?.contractIdFor(thread.cityId) ?? (Number(thread.cityId) || 0),
        files,
      };
      await this.restApi.post<string>(baseId ? `/support/tickets/${baseId}` : '/support/tickets', payload);
      this.source.set('remote');
    } catch (error) {
      console.warn('[OPS API] Envío de soporte utiliza fallback mock', error);
      this.source.set('mock');
    }
  }

  private mapRemoteThreads(feedback: RemoteFeedbackDto[]): SupportThread[] {
    return feedback.map((item) => ({
      id: String(item.id),
      type: this.localType(item.type),
      subtype: this.localSubtype(item.subtype),
      cityId: String(item.contractId),
      cityName: `Contrato ${item.contractId}`,
      plate: item.plate ?? '',
      status: item.status >= 3 ? 'closed' : item.status === 2 ? 'in-progress' : 'submitted',
      unread: item.read === 0,
      updatedAt: item.dateSent ?? item.date,
      messages: [
        { id: `${item.id}-user`, author: 'user', body: item.message, createdAt: item.date },
        ...(item.response
          ? [{ id: `${item.id}-support`, author: 'support' as const, body: item.response, createdAt: item.dateSent ?? item.date }]
          : []),
      ],
    }));
  }

  private feedbackType(type: FeedbackType): number {
    return ['incident', 'suggestion', 'inquiry', 'service-complaint', 'compliment'].indexOf(type) + 1;
  }

  private feedbackSubtype(subtype: FeedbackSubtype): number {
    return (
      ['app', 'citizen-services', 'information', 'regulations', 'areas-hours', 'parking-meters', 'fines', 'surveillance', 'web'].indexOf(
        subtype,
      ) + 1
    );
  }

  private localType(type: number): FeedbackType {
    return (['incident', 'suggestion', 'inquiry', 'service-complaint', 'compliment'][type - 1] ?? 'inquiry') as FeedbackType;
  }

  private localSubtype(subtype: number): FeedbackSubtype {
    return (['app', 'citizen-services', 'information', 'regulations', 'areas-hours', 'parking-meters', 'fines', 'surveillance', 'web'][
      subtype - 1
    ] ?? 'information') as FeedbackSubtype;
  }
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
