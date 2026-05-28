// Центральный стор приложения Zero.ID (Zustand)
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge } from 'reactflow';
import type { ZeroProfile, BlockConfig, LogEntry, ToastMessage, AppView } from '../types/zero.types';

interface ZeroState {
  // Авторизация
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (login: string, password: string) => boolean;
  logout: () => void;

  // Вид приложения
  activeView: AppView;
  setActiveView: (view: AppView) => void;

  // Профили
  profiles: ZeroProfile[];
  activeProfileId: string | null;
  setActiveProfile: (id: string | null) => void;
  createProfile: (name: string, description?: string) => void;
  deleteProfile: (id: string) => void;
  toggleProfileActive: (id: string) => void;
  updateProfile: (id: string, data: Partial<ZeroProfile>) => void;

  // React Flow узлы/рёбра активного профиля
  getActiveProfile: () => ZeroProfile | null;
  setNodes: (profileId: string, nodes: Node[]) => void;
  setEdges: (profileId: string, edges: Edge[]) => void;

  // Конфигурация блоков — открытый/закрытый
  selectedBlockId: string | null;
  setSelectedBlock: (id: string | null) => void;
  updateBlockConfig: (profileId: string, nodeId: string, config: Partial<BlockConfig>) => void;

  // Логи (хранятся по [profileId][nodeId])
  logs: Record<string, Record<string, LogEntry[]>>;
  addLog: (profileId: string, nodeId: string, entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: (profileId: string, nodeId: string) => void;

  // Toast уведомления
  toasts: ToastMessage[];
  addToast: (msg: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useZeroStore = create<ZeroState>((set, get) => ({
  // --- Авторизация ---
  isAuthenticated: false,
  currentUser: null,

  login: (login, password) => {
    // Простая тестовая проверка, без БД
    if (login === 'admin' && password === 'admin') {
      set({ isAuthenticated: true, currentUser: login });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false, currentUser: null, activeView: 'profiles' }),

  // --- Вид ---
  activeView: 'profiles',
  setActiveView: (view) => set({ activeView: view }),

  // --- Профили ---
  profiles: [],
  activeProfileId: null,

  setActiveProfile: (id) => set({ activeProfileId: id }),

  createProfile: (name, description = '') => {
    const newProfile: ZeroProfile = {
      id: uuidv4(),
      name,
      description,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    set((s) => ({ profiles: [...s.profiles, newProfile] }));
    get().addToast({ type: 'success', message: `Профиль "${name}" создан` });
  },

  deleteProfile: (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      // Если удаляемый был активным — сбрасываем выбор
      activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
    }));
    if (profile) get().addToast({ type: 'warning', message: `Профиль "${profile.name}" удалён` });
  },

  toggleProfileActive: (id) => {
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  updateProfile: (id, data) => {
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },

  setNodes: (profileId, nodes) => {
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId ? { ...p, nodes, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  setEdges: (profileId, edges) => {
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId ? { ...p, edges, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  // --- Выбранный блок ---
  selectedBlockId: null,
  setSelectedBlock: (id) => set({ selectedBlockId: id }),

  updateBlockConfig: (profileId, nodeId, config) => {
    set((s) => ({
      profiles: s.profiles.map((p) => {
        if (p.id !== profileId) return p;
        return {
          ...p,
          nodes: p.nodes.map((n: import('reactflow').Node) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, config: { ...((n.data as Record<string, unknown>).config as Record<string, unknown> ?? {}), ...config } } }
              : n
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  // --- Логи ---
  logs: {},

  addLog: (profileId, nodeId, entry) => {
    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    set((s) => {
      const pLogs = s.logs[profileId] ?? {};
      const nLogs = pLogs[nodeId] ?? [];
      return {
        logs: {
          ...s.logs,
          [profileId]: {
            ...pLogs,
            [nodeId]: [...nLogs, logEntry],
          },
        },
      };
    });
  },

  clearLogs: (profileId, nodeId) => {
    set((s) => {
      const pLogs = s.logs[profileId] ?? {};
      return {
        logs: {
          ...s.logs,
          [profileId]: { ...pLogs, [nodeId]: [] },
        },
      };
    });
  },

  // --- Toast ---
  toasts: [],

  addToast: (msg) => {
    const toast: ToastMessage = { id: uuidv4(), ...msg };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    // Автоудаление через 4 секунды
    setTimeout(() => get().removeToast(toast.id), 4000);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
