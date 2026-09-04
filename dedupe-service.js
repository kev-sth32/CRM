/**
 * Fuzzy Deduplication & Interactive Record Merge Service
 * Implements Salesforce / Zoho Duplicate Rules and 3-Column Atomic Record Merging
 */

/**
 * Computes Levenshtein Distance between two strings.
 */
function levenshteinDistance(s1, s2) {
  const str1 = String(s1 || '').trim().toLowerCase();
  const str2 = String(s2 || '').trim().toLowerCase();

  const m = str1.length;
  const n = str2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Computes similarity ratio between 0.0 and 1.0.
 */
function stringSimilarity(s1, s2) {
  const str1 = String(s1 || '').trim();
  const str2 = String(s2 || '').trim();
  if (!str1 && !str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1.toLowerCase() === str2.toLowerCase()) return 1.0;

  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  return Math.round((1 - distance / maxLen) * 100) / 100;
}

/**
 * Normalizes phone numbers for matching (digits only)
 */
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10); // match last 10 digits
}

/**
 * Scans a list of tenant records (leads or contacts) for potential duplicate pairs.
 */
function findDuplicates(records = []) {
  const duplicatePairs = [];
  const n = records.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = records[i];
      const b = records[j];

      // Skip already deleted or merged records
      if (a.is_deleted || b.is_deleted || a.merged_into_id || b.merged_into_id) continue;

      let matchReason = null;
      let matchConfidence = 0;

      // 1. Exact Email Match
      if (a.email && b.email && a.email.trim().toLowerCase() === b.email.trim().toLowerCase()) {
        matchReason = 'Exact Email Match';
        matchConfidence = 0.99;
      }
      // 2. Exact Phone Match
      else if (a.phone && b.phone && normalizePhone(a.phone) === normalizePhone(b.phone) && normalizePhone(a.phone).length >= 7) {
        matchReason = 'Exact Phone Match';
        matchConfidence = 0.95;
      }
      // 3. Fuzzy Name & Company Match
      else {
        const nameSim = stringSimilarity(a.name, b.name);
        const compSim = stringSimilarity(a.company, b.company);
        if (nameSim >= 0.82 && (compSim >= 0.75 || !a.company || !b.company)) {
          matchReason = `Fuzzy Name (${Math.round(nameSim * 100)}%) & Company Match`;
          matchConfidence = Math.round(((nameSim + compSim) / 2) * 100) / 100;
        }
      }

      if (matchReason) {
        duplicatePairs.push({
          record_a: a,
          record_b: b,
          reason: matchReason,
          confidence: matchConfidence
        });
      }
    }
  }

  return duplicatePairs;
}

/**
 * Merges two records (master & duplicate) based on user's field choices.
 * Re-parents child activities/tasks and soft-deletes duplicate.
 */
function mergeRecords(masterRecord, duplicateRecord, fieldSelections = {}, childCollections = {}) {
  const merged = { ...masterRecord };

  // Apply field choices: choice can be 'master' or 'duplicate'
  for (const [field, choice] of Object.entries(fieldSelections)) {
    if (choice === 'duplicate') {
      merged[field] = duplicateRecord[field];
    }
  }

  merged.updated_at = new Date().toISOString();
  merged.notes = `${merged.notes || ''}\n[System]: Merged with duplicate ID ${duplicateRecord.id} on ${new Date().toISOString()}`.trim();

  // Mark duplicate record as merged and soft-deleted
  const updatedDuplicate = {
    ...duplicateRecord,
    is_deleted: true,
    merged_into_id: masterRecord.id,
    updated_at: new Date().toISOString()
  };

  // Re-parent activities, tasks, opportunities
  const reparented = [];
  const foreignKey = masterRecord.company !== undefined ? 'lead_id' : 'contact_id';

  for (const [collName, items] of Object.entries(childCollections)) {
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item[foreignKey] === duplicateRecord.id) {
          item[foreignKey] = masterRecord.id;
          reparented.push({ collection: collName, id: item.id });
        }
      });
    }
  }

  return {
    master: merged,
    duplicate: updatedDuplicate,
    reparented_count: reparented.length,
    reparented_items: reparented
  };
}

module.exports = {
  levenshteinDistance,
  stringSimilarity,
  normalizePhone,
  findDuplicates,
  mergeRecords
};
