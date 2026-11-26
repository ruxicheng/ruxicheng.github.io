const appendValue = (value) => ({ append: value });

const db = (() => {
  const subscriptions = new Map();
  const updates = typeof BroadcastChannel === "function"
    ? new BroadcastChannel("ruxi-scrapbook")
    : null;
  let connection;

  function open() {
    connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("ruxi-scrapbook", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("entries", { keyPath: ["collection", "id"] });
        store.createIndex("collection", "collection");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return connection;
  }

  async function transact(mode, action) {
    const database = await open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("entries", mode);
      const request = action(transaction.objectStore("entries"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error || new Error("Storage transaction failed"));
    });
  }

  function notify(name) {
    subscriptions.get(name)?.forEach((refresh) => refresh());
  }

  updates?.addEventListener("message", ({ data }) => notify(data));

  function collection(name, field, direction = "asc", maximum = Infinity) {
    async function get() {
      const entries = await transact("readonly", (store) => store.index("collection").getAll(name));
      if (field) {
        const sign = direction === "desc" ? -1 : 1;
        entries.sort((a, b) => sign * (a.value[field] - b.value[field]));
      }
      const docs = entries.slice(0, maximum).map(({ id, value }) => ({ id, data: () => value }));
      return { docs, empty: docs.length === 0, forEach: (callback) => docs.forEach(callback) };
    }

    function changed() {
      notify(name);
      updates?.postMessage(name);
    }

    return {
      get,
      orderBy: (key, order) => collection(name, key, order, maximum),
      limit: (count) => collection(name, field, direction, count),
      onSnapshot(draw, onError) {
        const refresh = () => get().then(draw).catch(onError);
        if (!subscriptions.has(name)) subscriptions.set(name, new Set());
        subscriptions.get(name).add(refresh);
        refresh();
        return () => subscriptions.get(name)?.delete(refresh);
      },
      async add(value) {
        const id = crypto.randomUUID();
        await transact("readwrite", (store) => store.add({ collection: name, id, value }));
        changed();
        return { id };
      },
      doc(id) {
        return {
          async update(patch) {
            await transact("readwrite", (store) => {
              const request = store.get([name, id]);
              request.onsuccess = () => {
                const entry = request.result;
                if (!entry) {
                  store.transaction.abort();
                  return;
                }
                for (const [key, value] of Object.entries(patch)) {
                  entry.value[key] = value && Object.hasOwn(value, "append")
                    ? [...(entry.value[key] || []), value.append]
                    : value;
                }
                store.put(entry);
              };
              return request;
            });
            changed();
          },
          async delete() {
            await transact("readwrite", (store) => store.delete([name, id]));
            changed();
          }
        };
      }
    };
  }

  return { collection };
})();
