const DB_NAME = 'ChastityTrackerDB';
const DB_VERSION = 1;
const STORE_KEYVALUE = 'keyvalue'; // For settings, timer state, current game state
const STORE_HISTORY = 'history';   // For past sessions (large array)

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_KEYVALUE)) {
                db.createObjectStore(STORE_KEYVALUE);
            }
            if (!db.objectStoreNames.contains(STORE_HISTORY)) {
                db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
    return dbPromise;
}

export const db = {
    async get(key) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_KEYVALUE, 'readonly');
            const store = transaction.objectStore(STORE_KEYVALUE);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async set(key, value) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_KEYVALUE, 'readwrite');
            const store = transaction.objectStore(STORE_KEYVALUE);
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async remove(key) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_KEYVALUE, 'readwrite');
            const store = transaction.objectStore(STORE_KEYVALUE);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getAllHistory() {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_HISTORY, 'readonly');
            const store = transaction.objectStore(STORE_HISTORY);
            // Get all records, sorted by ID (chronological)
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result.reverse()); // Newest first
            request.onerror = () => reject(request.error);
        });
    },

    async addHistory(item) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_HISTORY, 'readwrite');
            const store = transaction.objectStore(STORE_HISTORY);
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updateHistory(id, updates) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_HISTORY, 'readwrite');
            const store = transaction.objectStore(STORE_HISTORY);
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const data = getRequest.result;
                if (!data) {
                    reject('History item not found');
                    return;
                }
                const updatedData = { ...data, ...updates };
                const putRequest = store.put(updatedData);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    },

    async deleteHistory(id) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_HISTORY, 'readwrite');
            const store = transaction.objectStore(STORE_HISTORY);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clearAll() {
        const database = await openDB();
        const t1 = database.transaction(STORE_KEYVALUE, 'readwrite').objectStore(STORE_KEYVALUE).clear();
        const t2 = database.transaction(STORE_HISTORY, 'readwrite').objectStore(STORE_HISTORY).clear();
        return Promise.all([
            new Promise(r => t1.onsuccess = r),
            new Promise(r => t2.onsuccess = r)
        ]);
    },

    // Export entire DB to JSON
    async exportData() {
        const kvKeys = await new Promise(async (resolve) => {
            const database = await openDB();
            const req = database.transaction(STORE_KEYVALUE).objectStore(STORE_KEYVALUE).getAllKeys();
            req.onsuccess = () => resolve(req.result);
        });

        const kvData = {};
        for (const key of kvKeys) {
            kvData[key] = await this.get(key);
        }

        const historyData = await this.getAllHistory();

        return JSON.stringify({
            keyValue: kvData,
            history: historyData,
            timestamp: Date.now()
        });
    },

    // Import JSON to DB
    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            await this.clearAll();

            if (data.keyValue) {
                for (const [key, value] of Object.entries(data.keyValue)) {
                    await this.set(key, value);
                }
            }

            if (data.history && Array.isArray(data.history)) {
                // We add them back one by one to regenerate IDs or keep original?
                // Ideally keep original content but let IDB handle keys.
                // We'll reverse it back to chronological order for insertion
                const chronoHistory = data.history.reverse();
                for (const item of chronoHistory) {
                   // Remove old ID if present to avoid key collision errors if keys changed
                   const { id, ...itemData } = item; 
                   await this.addHistory(itemData);
                }
            }
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
};
