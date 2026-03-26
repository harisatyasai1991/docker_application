/**
 * IndexedDB setup for offline capability using Dexie.js
 */
import Dexie from 'dexie';

// Create database
export const offlineDB = new Dexie('dms_offline');

// Define schema
offlineDB.version(1).stores({
  assets: 'asset_id',
  tests: 'test_id',
  sessions: 'session_id',
  test_executions: '++id, execution_id, session_id, sync_status',
  photos: '++id, execution_id, step_index, sync_status',
  sync_queue: '++id, type, status',
});

// Helper functions
export const offlineStorage = {
  // Save offline session
  async saveSession(sessionData) {
    await offlineDB.sessions.put(sessionData);
    console.log('✓ Session saved to IndexedDB:', sessionData.session_id);
  },

  // Get offline session
  async getSession(sessionId) {
    return await offlineDB.sessions.get(sessionId);
  },

  // Get all sessions
  async getAllSessions() {
    return await offlineDB.sessions.toArray();
  },

  // Save asset data
  async saveAsset(assetData) {
    await offlineDB.assets.put(assetData);
    console.log('✓ Asset saved to IndexedDB:', assetData.asset_id);
  },

  // Get asset
  async getAsset(assetId) {
    return await offlineDB.assets.get(assetId);
  },

  // Save tests
  async saveTests(tests) {
    await offlineDB.tests.bulkPut(tests);
    console.log(`✓ ${tests.length} tests saved to IndexedDB`);
  },

  // Get test
  async getTest(testId) {
    return await offlineDB.tests.get(testId);
  },

  // Save test execution (offline)
  async saveTestExecution(executionData) {
    executionData.sync_status = executionData.sync_status || 'pending';
    
    // Check if execution already exists (update scenario)
    const existing = await offlineDB.test_executions
      .where('execution_id').equals(executionData.execution_id)
      .first();
    
    if (existing) {
      await offlineDB.test_executions.update(existing.id, executionData);
      console.log('✓ Test execution updated offline:', executionData.execution_id);
      return existing.id;
    } else {
      const id = await offlineDB.test_executions.add(executionData);
      console.log('✓ Test execution saved offline:', executionData.execution_id);
      return id;
    }
  },

  // Get test execution by execution_id
  async getTestExecution(executionId) {
    return await offlineDB.test_executions
      .where('execution_id').equals(executionId)
      .first();
  },

  // Get all pending test executions (for sync)
  async getAllPendingTestExecutions() {
    return await offlineDB.test_executions
      .where('sync_status').equals('pending')
      .toArray();
  },

  // Get pending test executions by session
  async getPendingTestExecutions(sessionId) {
    return await offlineDB.test_executions
      .where('session_id').equals(sessionId)
      .and(item => item.sync_status === 'pending')
      .toArray();
  },

  // Save photo
  async savePhoto(photoData) {
    photoData.sync_status = 'pending';
    const id = await offlineDB.photos.add(photoData);
    console.log('✓ Photo saved offline');
    return id;
  },

  // Get pending photos
  async getPendingPhotos(executionId) {
    return await offlineDB.photos
      .where('execution_id').equals(executionId)
      .and(item => item.sync_status === 'pending')
      .toArray();
  },

  // Add to sync queue
  async addToSyncQueue(item) {
    item.status = 'pending';
    item.created_at = new Date().toISOString();
    const id = await offlineDB.sync_queue.add(item);
    console.log('✓ Added to sync queue:', item.type);
    return id;
  },

  // Get sync queue
  async getSyncQueue() {
    return await offlineDB.sync_queue.where('status').equals('pending').toArray();
  },

  // Mark as synced
  async markAsSynced(table, id) {
    await offlineDB[table].update(id, { sync_status: 'synced' });
  },

  // Clear synced data
  async clearSyncedData() {
    const syncedExecutions = await offlineDB.test_executions
      .where('sync_status').equals('synced')
      .toArray();
    
    for (const exec of syncedExecutions) {
      await offlineDB.test_executions.delete(exec.id);
    }

    const syncedPhotos = await offlineDB.photos
      .where('sync_status').equals('synced')
      .toArray();
    
    for (const photo of syncedPhotos) {
      await offlineDB.photos.delete(photo.id);
    }

    console.log('✓ Cleared synced data from IndexedDB');
  },

  // Get storage usage estimate
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
        quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      };
    }
    return null;
  },

  // Clear all offline data
  async clearAll() {
    await offlineDB.delete();
    console.log('✓ All offline data cleared');
    // Recreate database
    await offlineDB.open();
  },
};

export default offlineDB;
