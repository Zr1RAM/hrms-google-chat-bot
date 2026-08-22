/**
 * Permissions Module - Handles Role-Based Access Control (RBAC) via Google Sheets & CacheService.
 */

var PERMISSIONS_CACHE_KEY = "EMS_PERMISSIONS_MAP_V1";
var PERMISSIONS_CACHE_TTL_SEC = 21600; // Cache for 6 hours (21,600 seconds)

/**
 * Checks if a user's role possesses a specific permission string.
 *
 * @param {string} userRole - The role assigned to the employee (e.g., 'EMS_Admin', 'Employee').
 * @param {string} requiredPermission - The permission key to check (e.g., 'ACCESS_ADMIN_CONSOLE').
 * @return {boolean} True if the role has the permission, false otherwise.
 */
function hasPermission(userRole, requiredPermission) {
  if (!userRole) return false;

  var permissionsMap = getCachedPermissionsMap();
  var rolePermissions = permissionsMap[userRole] || [];

  return rolePermissions.indexOf(requiredPermission) !== -1;
}

/**
 * Fetches the role-to-permissions map from CacheService if available; 
 * otherwise reads from the spreadsheet and populates the cache.
 *
 * @return {Object} Dictionary mapping roles to arrays of permission strings.
 */
function getCachedPermissionsMap() {
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get(PERMISSIONS_CACHE_KEY);

  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      console.warn("Failed to parse cached permissions, falling back to sheet read: " + e.message);
    }
  }

  // Cache miss or error -> read from Google Sheet
  var map = fetchPermissionsFromSheet();

  // Store in cache for 6 hours
  try {
    cache.put(PERMISSIONS_CACHE_KEY, JSON.stringify(map), PERMISSIONS_CACHE_TTL_SEC);
  } catch (e) {
    console.error("Failed to store permissions in CacheService: " + e.message);
  }

  return map;
}

/**
 * Directly reads the 'Role_Permissions' tab (Option A: 1 row per role with comma-separated permissions).
 *
 * @return {Object} Dictionary mapping roles to arrays of permission strings.
 */
function fetchPermissionsFromSheet() {
  var map = {};

  try {
    var ss = getEmsSpreadsheet(); // Uses your existing spreadsheet helper
    var sheet = ss.getSheetByName("Role_Permissions");

    if (!sheet) {
      console.error("Sheet 'Role_Permissions' not found! Returning empty permissions map.");
      return map;
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return map; // Empty sheet or header-only

    // Loop through rows skipping header (i = 1)
    for (var i = 1; i < data.length; i++) {
      var role = String(data[i][0] || "").trim();
      var rawPerms = String(data[i][1] || "").trim();

      if (role) {
        // Split comma-separated string into trimmed array items
        map[role] = rawPerms ? rawPerms.split(",").map(function(p) { return p.trim(); }) : [];
      }
    }
  } catch (err) {
    console.error("Error reading Role_Permissions sheet: " + err.message);
  }

  return map;
}

/**
 * Utility function to manually clear the permission cache.
 * Call this function whenever you edit permissions in the Google Sheet.
 */
function clearPermissionsCache() {
  var cache = CacheService.getScriptCache();
  cache.remove(PERMISSIONS_CACHE_KEY);
  console.log("Permissions cache successfully cleared.");
}