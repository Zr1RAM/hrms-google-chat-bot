/**
 * Utilities & Dynamic Header Mapping Engine
 */

/**
 * Reads header row (Row 1) of a given sheet dynamically and maps Header Name -> 1-based Column Index
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Object} { "Email": 3, "EMP ID": 1, ... }
 */
function getHeaderMap(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var headerName = String(headers[i]).trim();
    if (headerName.length > 0) {
      map[headerName] = i + 1;
    }
  }
  return map;
}

/**
 * Validates presence of mandatory headers
 */
function validateHeaders(sheetName, headerMap, mandatoryFields) {
  var missing = [];
  for (var i = 0; i < mandatoryFields.length; i++) {
    if (!headerMap[mandatoryFields[i]]) {
      missing.push(mandatoryFields[i]);
    }
  }
  if (missing.length > 0) {
    throw new Error('Fatal: Sheet "' + sheetName + '" missing mandatory columns: ' + missing.join(', '));
  }
}

/**
 * Formats a Date object into ISO Date String YYYY-MM-DD using configured timezone
 */
function formatDateISO(dateObj) {
  var tz = getConfigValue('TIMEZONE') || Session.getScriptTimeZone();
  return Utilities.formatDate(dateObj, tz, 'yyyy-MM-dd');
}

/**
 * Formats date into STATUS REPORT DD/MM/YYYY Day format
 */
function formatDateStatusReport(dateObj) {
  var tz = getConfigValue('TIMEZONE') || Session.getScriptTimeZone();
  var dateStr = Utilities.formatDate(dateObj, tz, 'dd/MM/yyyy');
  var dayStr = Utilities.formatDate(dateObj, tz, 'EEEE');
  return dateStr + ' ' + dayStr;
}

/**
 * Safe integer parser with bounds for configuration cutoff
 */
function parseCutoffDay(value) {
  var parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 31) {
    return DEFAULT_CONFIG.ATTENDANCE_PREVIOUS_MONTH_CUTOFF_DAY;
  }
  return parsed;
}