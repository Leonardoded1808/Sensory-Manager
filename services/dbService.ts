import { User } from '../types.ts';

const DB_NAME = 'SensoryManagerDB';
const DB_VERSION = 1;

// Define all object store names
const STORE_NAMES = [
    'clients', 'services', 'invoices', 'specialists', 'managers', 
    'managerPayouts', 'expenses', 'medicalRecords', 'appointments', 
    'ticketConfig', 'user', 'adminPassword'
];

let db: IDBDatabase;

// Function to open the database
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        // If db is already open, resolve it
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(new Error('Error opening IndexedDB.'));
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            STORE_NAMES.forEach(name => {
                if (!dbInstance.objectStoreNames.contains(name)) {
                    // Stores for single key-value pairs
                    if (['user', 'adminPassword', 'ticketConfig'].includes(name)) {
                        dbInstance.createObjectStore(name);
                    } else { // Stores for lists of objects with an 'id'
                        dbInstance.createObjectStore(name, { keyPath: 'id' });
                    }
                }
            });
        };
    });
};

// Generic function to get all items from a store
export const getStoreData = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Generic function to get a single item using a key
export const getSingleItem = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Generic function to add or update an item in a store
export const putItem = async <T>(storeName: string, item: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Generic function to put a single key-value pair
export const putSingleItem = async <T>(storeName: string, key: IDBValidKey, value: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


// Generic function to delete an item by its ID/key
export const deleteItem = async (storeName: string, id: IDBValidKey): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Used for one-time migration from localStorage
export const saveAllData = async <T>(storeName: string, data: T[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear existing data before bulk-adding
    store.clear(); 
    
    data.forEach(item => {
        store.put(item);
    });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export { openDB };
