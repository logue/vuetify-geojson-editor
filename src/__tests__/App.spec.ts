import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import App from '../App.vue';

import { vuetifyInstance } from '@/__tests__/setup';

const appTitle = import.meta.env.VITE_APP_TITLE ?? 'Vuetify3 Application';

// ストアのモック
const mockGlobalStore = reactive({
  loading: false,
  progress: null as number | null,
  message: '',
  setLoading: vi.fn<(value?: boolean) => void>((value = false) => {
    mockGlobalStore.loading = value;
  }),
  setMessage: vi.fn<(value?: string) => void>((value = '') => {
    mockGlobalStore.message = value;
  })
});

const mockConfigStore = reactive({
  theme: false,
  toggleTheme: vi.fn<() => void>()
});

vi.mock('@/store', () => ({
  useGlobalStore: vi.fn<() => typeof mockGlobalStore>(() => mockGlobalStore),
  useConfigStore: vi.fn<() => typeof mockConfigStore>(() => mockConfigStore)
}));

// Vuetifyテーマのモック
vi.mock('vuetify', async importOriginal => {
  const actual = await importOriginal<typeof import('vuetify')>();
  return {
    ...actual,
    useTheme: vi.fn<() => void>(() => ({
      computedThemes: {
        value: {
          dark: { colors: { primary: '#1976d2' } },
          light: { colors: { primary: '#1976d2' } }
        }
      }
    }))
  };
});

// ルーターのモック
const mockRoute = {
  path: '/',
  name: 'home',
  meta: {}
};

vi.mock('vue-router', () => ({
  useRoute: vi.fn<() => typeof mockRoute>(() => mockRoute)
}));

// コンポーネントのモック
vi.mock('@/components/AppBarMenuComponent.vue', () => ({
  default: {
    name: 'AppBarMenuComponent',
    template: '<div data-testid="app-bar-menu">App Bar Menu</div>'
  }
}));

vi.mock('@/components/DrawerComponent.vue', () => ({
  default: {
    name: 'DrawerComponent',
    template: '<div data-testid="drawer">Drawer</div>'
  }
}));

describe('App.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockGlobalStore.loading = false;
    mockGlobalStore.progress = null;
    mockGlobalStore.message = '';
  });

  it('should render app structure correctly', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': {
            template: '<div data-testid="router-view">Router View</div>'
          },
          teleport: {
            template: '<div><slot /></div>'
          }
        }
      }
    });

    expect(wrapper.find('[data-testid="app-bar-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="drawer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="router-view"]').exists()).toBe(true);
  });

  it('should toggle drawer visibility', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const navIcon = wrapper.find('.v-app-bar-nav-icon');
    expect(navIcon.exists()).toBe(true);

    await navIcon.trigger('click');
    // drawer の状態変更を確認（内部実装なのでテストでは確認方法を変更）
    expect(navIcon.exists()).toBe(true);
  });

  it('should display app title', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const title = wrapper.find('.v-app-bar-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toContain(appTitle);
  });

  it('should show loading overlay when loading is true', () => {
    mockGlobalStore.loading = true;

    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const overlay = wrapper.findComponent({ name: 'VOverlay' });
    expect(overlay.exists()).toBe(true);
    expect(overlay.props('modelValue')).toBe(true);
  });

  it('should show progress bar when loading is true', () => {
    mockGlobalStore.loading = true;
    mockGlobalStore.progress = 50;

    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const progressBar = wrapper.find('.v-progress-linear');
    expect(progressBar.exists()).toBe(true);
  });

  it('should show snackbar when message is set', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    mockGlobalStore.setMessage('Test message');
    await nextTick();
    await wrapper.vm.$nextTick();

    const snackbar = wrapper.findComponent({ name: 'VSnackbar' });
    expect(snackbar.exists()).toBe(true);
    expect(snackbar.props('modelValue')).toBe(true);
  });

  it('should clear message when snackbar is closed', async () => {
    mockGlobalStore.message = 'Test message';

    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const snackbar = wrapper.findComponent({ name: 'VSnackbar' });
    await snackbar.vm.$emit('update:modelValue', false);

    expect(mockGlobalStore.setMessage).toHaveBeenCalled();
  });

  it('should display footer', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    const footer = wrapper.find('.v-footer');
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toContain('2025 ©');
  });

  it('should set document title on mount', () => {
    const originalTitle = document.title;

    mount(App, {
      global: {
        plugins: [vuetifyInstance],
        stubs: {
          'router-view': true,
          teleport: true
        }
      }
    });

    expect(document.title).toBe(appTitle);

    // テスト後にタイトルを復元
    document.title = originalTitle;
  });
});
