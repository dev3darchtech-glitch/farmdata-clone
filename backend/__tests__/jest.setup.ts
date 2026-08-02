jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
  getApps: jest.fn(() => []),
}));

const store: Record<string, Record<string, any>> = {};

const mockDoc = (collectionName: string, id: string) => {
  return {
    id,
    get: jest.fn(() => {
      const data = store[id] || null;
      return Promise.resolve({
        exists: data !== null,
        data: () => data,
      });
    }),
    set: jest.fn((data) => {
      store[id] = { ...data, id, _id: id, _collectionName: collectionName };
      return Promise.resolve();
    }),
    update: jest.fn((data) => {
      store[id] = { ...(store[id] || {}), ...data };
      return Promise.resolve();
    }),
    delete: jest.fn(() => {
      delete store[id];
      return Promise.resolve();
    }),
  };
};

class MockQueryChain {
  constructor(
    private collectionName: string,
    private filters: Array<{ field: string; op: string; value: any }> = []
  ) {}

  where(field: string, op: string, value: any) {
    if (value === undefined) {
      return new MockQueryChain(this.collectionName, [
        ...this.filters,
        { field, op: "==", value: op },
      ]);
    }
    return new MockQueryChain(this.collectionName, [
      ...this.filters,
      { field, op, value },
    ]);
  }

  limit(num: number) {
    return this;
  }

  async get() {
    let docs = Object.values(store).filter(
      (doc) => doc._collectionName === this.collectionName
    );

    for (const filter of this.filters) {
      const { field, op, value } = filter;
      docs = docs.filter((doc) => {
        const docVal = doc[field];
        if (op === "==") return docVal === value;
        if (op === "!=") return docVal !== value;
        if (op === "in") return Array.isArray(value) && value.includes(docVal);
        return true;
      });
    }

    return {
      docs: docs.map((data) => ({
        data: () => data,
        exists: true,
        id: data.id || data._id,
      })),
    };
  }
}

const mockFirestore = {
  collection: jest.fn((collectionName) => {
    const chain = new MockQueryChain(collectionName);
    return {
      doc: jest.fn((id) => {
        const docId = id || "mock-doc-id-" + Math.random().toString(36).substring(2, 9);
        return mockDoc(collectionName, docId);
      }),
      where: (field: string, op: string, value: any) => chain.where(field, op, value),
      limit: (num: number) => chain.limit(num),
      get: () => chain.get(),
    };
  }),
};

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => mockFirestore),
}));

jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn((token) => {
      return Promise.resolve({
        uid: token, // Simply return the token string as UID, which matches the localId token
        email: "test@farmdata.com",
      });
    }),
    createUser: jest.fn((input) => {
      const uid = input?.uid || "new-test-uid-" + Math.random().toString(36).substring(2, 9);
      return Promise.resolve({ uid });
    }),
    updateUser: jest.fn(() => Promise.resolve()),
    setCustomUserClaims: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock("firebase-admin/storage", () => ({
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      name: "test-bucket",
      file: jest.fn(() => ({
        save: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

// Mock global fetch for Firebase Auth REST endpoints
global.fetch = jest.fn((input: any, init: any) => {
  const urlStr = typeof input === "string" ? input : input.url;

  if (urlStr.includes("accounts:signInWithPassword")) {
    const body = JSON.parse(init.body);
    if (body.password === "wrongpassword") {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            message: "INVALID_PASSWORD"
          }
        }),
      } as any);
    }
    const email = body.email;
    const token = `mock-token-for-${email}`;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        idToken: token,
        refreshToken: `refresh-token-for-${email}`,
        expiresIn: "3600",
        localId: token,
      }),
    } as any);
  }

  if (urlStr.includes("securetoken.googleapis.com")) {
    const params = new URLSearchParams(init.body);
    const refreshToken = params.get("refresh_token") || "test-uid";
    const email = refreshToken.replace("refresh-token-for-", "");

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id_token: `mock-token-for-${email}`,
        refresh_token: refreshToken,
        expires_in: "3600",
        user_id: `mock-token-for-${email}`,
      }),
    } as any);
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as any);
}) as any;
