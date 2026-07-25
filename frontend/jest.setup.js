jest.setTimeout(15000);

process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'test-google-web-client-id';

// Global timer tracker to clean up leaks from tests using real timers
const activeTimeouts = new Set();
const activeIntervals = new Set();
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

global.setTimeout = (cb, delay, ...args) => {
  const id = originalSetTimeout(() => {
    activeTimeouts.delete(id);
    cb();
  }, delay, ...args);
  activeTimeouts.add(id);
  return id;
};

global.clearTimeout = (id) => {
  activeTimeouts.delete(id);
  originalClearTimeout(id);
};

global.setInterval = (cb, delay, ...args) => {
  const id = originalSetInterval(cb, delay, ...args);
  activeIntervals.add(id);
  return id;
};

global.clearInterval = (id) => {
  activeIntervals.delete(id);
  originalClearInterval(id);
};

afterEach(() => {
  activeTimeouts.forEach(id => {
    try {
      originalClearTimeout(id);
    } catch (_) {}
  });
  activeTimeouts.clear();

  activeIntervals.forEach(id => {
    try {
      originalClearInterval(id);
    } catch (_) {}
  });
  activeIntervals.clear();
});


// Mock Pressable as a host string element so react-test-renderer findByType("Pressable" as any)
// and node.type?.displayName === "Pressable" both work in test environments.
// The real Pressable is a JS component whose type is never the string "Pressable".
const React = require('react');
const RN = require('react-native');

// Save the original
const _OriginalPressable = RN.Pressable;

// Create a wrapper that renders as a host "Pressable" string element.
// This satisfies findByType("Pressable") and node.type?.displayName checks.
const MockPressable = React.forwardRef(function Pressable(props, ref) {
  const { onPress, style, children, testID, disabled, ...rest } = props;
  return React.createElement(
    'Pressable',  // host string element – findByType("Pressable") will find this
    { onPress, style, testID, disabled, ref, ...rest },
    children
  );
});
MockPressable.displayName = 'Pressable';

// Replace in react-native module
Object.defineProperty(RN, 'Pressable', {
  get: () => MockPressable,
  configurable: true,
});

// Mock expo-secure-store
const mockStore = new Map();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => mockStore.get(key) || null),
  setItemAsync: jest.fn(async (key, value) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockStore.delete(key);
  }),
  getItem: jest.fn((key) => mockStore.get(key) || null),
  setItem: jest.fn((key, value) => mockStore.set(key, value)),
  deleteItem: jest.fn((key) => mockStore.delete(key)),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'capturedata://auth-callback'),
  parse: jest.fn((url) => {
    const parsed = new URL(url);
    const queryParams = {};
    for (const [key, value] of parsed.searchParams.entries()) {
      queryParams[key] = value;
    }
    return {
      hostname: parsed.hostname,
      path: parsed.pathname.replace(/^\//, ''),
      queryParams,
      scheme: parsed.protocol.replace(':', ''),
    };
  }),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (size) => new Uint8Array(size)),
  digestStringAsync: jest.fn(async () => 'mock_digest'),
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn(async () => ({
          uri: 'file:///mock/captured_photo.jpg',
          width: 1080,
          height: 1920,
        })),
      }));
      return React.createElement(View, props, props.children);
    }),
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn(async () => ({ granted: true }))]),
    Camera: {
      requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
      getCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    },
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///mock/picker_photo.jpg', width: 1080, height: 1920 }],
  })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///mock/picker_gallery.jpg', width: 1080, height: 1920 }],
  })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 10.7769,
      longitude: 106.7009,
      accuracy: 5.0,
      altitude: 10.0,
      heading: 0,
      speed: 0,
    },
    timestamp: 1770000000000,
  })),
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
}));

// Reset in-memory store before each test
beforeEach(() => {
  mockStore.clear();
});

// Mock expo-router globally
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: (cb) => {
    const React = require('react');
    React.useEffect(() => {
      cb();
    }, []);
  },
  usePathname: () => '/management',
  useSearchParams: () => new URLSearchParams(),
}));
