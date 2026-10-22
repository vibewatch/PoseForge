/**
 * Shaped, dressed templates kept between visits.
 *
 * Shaping a scanned body - parsing it, raising its relief, cutting its clothes,
 * fitting its hair and face - is two or three seconds a body, and it comes out
 * the same every time for the same build of the studio. A template is already
 * structured-cloneable (a helper hands one across to the body worker), and
 * reading ten megabytes of it back out of IndexedDB is a few tens of
 * milliseconds. So a returning visitor's first pose skips the shaping.
 *
 * Kept per build: the store is named after `__POSEFORGE_BUILD__`, which the
 * production build defines afresh each time, so a template shaped by older
 * code is never drawn by newer code. Where it is not defined - the dev server,
 * Node, the tests - or where IndexedDB is unavailable, there is no store and
 * every template is shaped as before. Any failure in here costs the cache and
 * nothing else.
 */

/* global __POSEFORGE_BUILD__ */
const BUILD = typeof __POSEFORGE_BUILD__ === "string" ? __POSEFORGE_BUILD__ : null;
const PREFIX = "poseforge.templates.";
const STORE = "templates";
const USED = "used";
// About ten megabytes each; a pair of figures in two outfits is four.
const CAPACITY = 8;

const request = (operation) =>
  new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });

/** The persistent store, or null where templates cannot be kept. */
export function createTemplateStore({ build = BUILD, indexedDB = globalThis.indexedDB, capacity = CAPACITY } = {}) {
  if (!build || !indexedDB) return null;
  let opened = null;
  const open = () =>
    (opened ??= (async () => {
      // Templates from earlier builds are dead weight: drop their databases.
      try {
        const names = (await indexedDB.databases?.()) ?? [];
        for (const { name } of names)
          if (name?.startsWith(PREFIX) && name !== PREFIX + build) indexedDB.deleteDatabase(name);
      } catch {}
      const opening = indexedDB.open(PREFIX + build, 1);
      opening.onupgradeneeded = () => {
        opening.result.createObjectStore(STORE);
        opening.result.createObjectStore(USED);
      };
      return request(opening);
    })().catch(() => null));

  const transaction = async (mode, work) => {
    const db = await open();
    if (!db) return null;
    const tx = db.transaction([STORE, USED], mode);
    const done =
      mode === "readwrite"
        ? new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = tx.onabort = () => reject(tx.error);
          })
        : null;
    const result = await work(tx.objectStore(STORE), tx.objectStore(USED));
    await done;
    return result;
  };

  return {
    async get(key) {
      try {
        const template = await transaction("readonly", (store) => request(store.get(key)));
        if (!template) return null;
        // Touched, so the least recently drawn is the one evicted.
        transaction("readwrite", (_, used) => request(used.put(Date.now(), key))).catch(() => {});
        return template;
      } catch {
        return null;
      }
    },
    async set(key, template) {
      try {
        await transaction("readwrite", async (store, used) => {
          const keys = await request(used.getAllKeys());
          if (keys.length >= capacity && !keys.includes(key)) {
            const times = await request(used.getAll());
            const order = keys.map((k, i) => [k, times[i]]).sort((a, b) => a[1] - b[1]);
            for (const [k] of order.slice(0, keys.length - capacity + 1)) {
              store.delete(k);
              used.delete(k);
            }
          }
          await Promise.all([request(store.put(template, key)), request(used.put(Date.now(), key))]);
        });
      } catch {}
    },
  };
}
