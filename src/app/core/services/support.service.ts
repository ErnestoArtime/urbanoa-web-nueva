import { computed, inject, Injectable, signal } from '@angular/core';
import { OpsApiClient } from '../api/ops-api-client.service';
import { OpsApiError } from '../api/ops-api.types';
import { OPS_ENDPOINTS } from '../api/ops-endpoints';
import { OpsSessionService } from '../api/ops-session.service';
import { CitiesService } from './cities.service';
import { UserService } from './user.service';
import { parseOpsDate, formatOpsDate } from '../utils/ops-date';

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
  attachments?: SupportAttachment[];
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
  path?: string;
  url?: string;
  direction?: number;
}

interface RemoteFeedbackDto {
  id: number;
  baseId?: number | null;
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
  numFiles?: number | null;
  files?: RemoteFileDto[] | null;
}

interface RemoteFileDto {
  filename?: string | null;
  title?: string | null;
  payload?: string | null;
  path?: string | null;
  url?: string | null;
  id?: number | null;
  direction?: number | null;
}

interface QueryFeedbackResponseDto {
  feedback?: RemoteFeedbackDto[] | null;
  feedbackList?: RemoteFeedbackDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly aliases = new Map<string, string>();
  private readonly unreadMembers = new Map<string, number[]>();
  private readonly state = signal<SupportThread[]>([]);
  private readonly api = inject(OpsApiClient);
  private readonly session = inject(OpsSessionService);
  private readonly cities = inject(CitiesService);
  private readonly userService = inject(UserService);

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
        { contractId: 0, startDate: '000000010100', endDate: this.backendDate(new Date()) },
        { token },
      );
      const items = Array.isArray(response) ? response : (response.feedback ?? response.feedbackList ?? []);
      this.state.set(this.groupRemoteThreads(items));
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
    return this.state().find((thread) => thread.id === (this.aliases.get(id) ?? id));
  }

  async create(input: NewSupportThread): Promise<SupportThread | null> {
    const result = await this.send(input);
    if (!result?.trim()) {
      this.fail(
        new OpsApiError(
          'invalid-response',
          OPS_ENDPOINTS.support.add,
          'AddUserFeedbackAPI no devolvió el identificador de la conversación',
        ),
      );
      return null;
    }
    const created = this.toConfirmedThread(result, input);
    this.state.update((threads) => [created, ...threads.filter((thread) => thread.id !== created.id)]);
    return created;
  }

  async reply(id: string, message: string, attachment?: SupportAttachment): Promise<boolean> {
    const thread = this.getById(id);
    if (!thread) return false;
    id = thread.id;
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
              messages: [...item.messages, { id: `${id}-${now}`, author: 'user', body: message.trim(), createdAt: now, attachment }],
            }
          : item,
      ),
    );
    return true;
  }

  async markAsRead(id: string): Promise<boolean> {
    const thread = this.getById(id);
    if (!thread?.unread) return true;
    id = thread.id;
    const token = this.session.token();
    const remoteId = Number(id);
    if (!token || !Number.isInteger(remoteId)) return false;
    try {
      for (const memberId of this.unreadMembers.get(id) ?? [remoteId]) {
        await this.api.post<string>(
        OPS_ENDPOINTS.support.update,
        { id: memberId, contractId: Number(thread.cityId) || 0, read: 1 },
        { token },
        );
      }
      this.unreadMembers.delete(id);
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
    let userEmail = this.userService.user().email.trim();
    if (!userEmail) {
      try {
        userEmail = (await this.userService.load()).email.trim();
      } catch {
        userEmail = '';
      }
    }
    const contractId = this.cities.contractIdFor(input.cityId);
    const plate = input.plate.trim().toUpperCase();
    if (contractId <= 0) {
      this.fail(new OpsApiError('invalid-response', OPS_ENDPOINTS.support.add, 'El municipio es obligatorio'));
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
          userEmail: userEmail || null,
          channel: 0,
          contractId,
          date: this.backendDate(new Date()),
          type: this.feedbackType(input.type),
          subtype: this.feedbackSubtype(input.subtype),
          message: input.message.trim(),
          plate,
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
    const remoteAttachments = (item.files ?? [])
      .map((file) => ({ direction: file.direction, attachment: this.mapRemoteFile(file) }))
      .filter((item): item is { direction: number | null | undefined; attachment: SupportAttachment } => item.attachment !== null);
    const userFiles = remoteAttachments.filter((file) => file.direction !== 1).map((file) => file.attachment);
    const supportFiles = remoteAttachments.filter((file) => file.direction === 1).map((file) => file.attachment);
    const date = this.normalizedDate(item.date);
    const responseDate = this.normalizedDate(item.dateSent || item.date);
    const userMessage = this.messageWithAttachments(`${item.id}-user`, 'user', item.message ?? '', date, userFiles);
    const supportMessage = item.response || supportFiles.length
      ? this.messageWithAttachments(`${item.id}-support`, 'support', item.response ?? '', responseDate, supportFiles)
      : null;
    return {
      id: String(item.id),
      type: this.localType(item.type),
      subtype: this.localSubtype(item.subtype),
      cityId: String(item.contractId),
      cityName: this.cities.nameFor?.({ contractId: item.contractId }) || `Contrato ${item.contractId}`,
      plate: item.plate ?? '',
      status: item.status >= 3 ? 'closed' : item.status === 2 ? 'in-progress' : item.status === 1 ? 'assigned' : 'submitted',
      unread: item.read === 0,
      updatedAt: responseDate || date,
      messages: [userMessage, ...(supportMessage ? [supportMessage] : [])],
    };
  }

  private normalizedDate(value: string): string {
    if (!value) return '';
    const date = parseOpsDate(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : '';
  }

  private groupRemoteThreads(items: RemoteFeedbackDto[]): SupportThread[] {
    this.aliases.clear();
    this.unreadMembers.clear();
    const byId = new Map(items.map(item => [item.id, item]));
    const groups = new Map<number, RemoteFeedbackDto[]>();
    for (const item of items) {
      let root = item;
      const visited = new Set<number>([item.id]);
      while (root.baseId && byId.has(root.baseId) && !visited.has(root.baseId)) {
        const parent = byId.get(root.baseId)!;
        if (parent.contractId !== item.contractId) break;
        visited.add(parent.id);
        root = parent;
      }
      // Deterministic grouping also prevents malformed cycles from duplicating threads.
      const rootId = root.baseId && visited.has(root.baseId) ? Math.min(...visited) : root.id;
      groups.set(rootId, [...(groups.get(rootId) ?? []), item]);
    }
    return [...groups.entries()].map(([id, records]) => {
      for (const record of records) this.aliases.set(String(record.id), String(id));
      this.unreadMembers.set(String(id), records.filter(record => record.read === 0).map(record => record.id));
      const mapped = records.map(record => this.mapRemoteThread(record));
      mapped.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      const root = mapped.find(thread => thread.id === String(id)) ?? mapped[0];
      const latest = mapped[mapped.length - 1];
      return {
        ...root,
        id: String(id),
        status: latest.status,
        updatedAt: latest.updatedAt,
        unread: mapped.some(thread => thread.unread),
        messages: mapped.flatMap(thread => thread.messages).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private messageWithAttachments(
    id: string,
    author: SupportMessage['author'],
    body: string,
    createdAt: string,
    attachments: SupportAttachment[],
  ): SupportMessage {
    return {
      id,
      author,
      body,
      createdAt,
      ...(attachments.length ? { attachment: attachments[0], attachments } : {}),
    };
  }

  private mapRemoteFile(file: RemoteFileDto): SupportAttachment | null {
    const name = file.filename?.trim() || file.title?.trim() || `adjunto-${file.id ?? 'soporte'}`;
    const externalUrl = [file.url?.trim(), file.path?.trim()].find(url => url && /^https?:\/\//i.test(url));
    const payload = file.payload?.trim();
    const type = this.fileMimeType(name);
    const rawPayload = payload?.startsWith('data:') ? payload.slice(payload.indexOf(',') + 1) : payload;
    const dataUrl = rawPayload && /^[A-Za-z0-9+/\s]*={0,2}$/.test(rawPayload)
      ? `data:${type};base64,${rawPayload}` : externalUrl || '';
    if (!dataUrl) return null;
    return { name, type: this.fileMimeType(name), dataUrl };
  }

  private fileMimeType(name: string): string {
    const extension = name.toLowerCase().split('.').pop();
    return (
      {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
      } as Record<string, string>
    )[extension ?? ''] ?? 'application/octet-stream';
  }

  private feedbackType(type: FeedbackType): number {
    return ['incident', 'suggestion', 'inquiry', 'service-complaint', 'compliment'].indexOf(type) + 1;
  }

  private backendDate(value: Date): string {
    return formatOpsDate(value);
  }

  private feedbackSubtype(subtype: FeedbackSubtype): number {
    if (subtype === 'web') return 1;
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
