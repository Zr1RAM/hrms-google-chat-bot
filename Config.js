/**
 * Configuration Module
 * Manages runtime properties, fallback defaults, and dynamic Configuration sheet lookup.
 */


var CONFIG_KEYS = {
  SPREADSHEET_ID: 'EMS_SPREADSHEET_ID', // Store in Script Properties if separate
  ATTENDANCE_CUTOFF: 'ATTENDANCE_PREVIOUS_MONTH_CUTOFF_DAY',
  TIMEZONE: 'TIMEZONE',
  HR_EMAIL: 'HR_LEAVE_EMAIL',
  DEFAULT_ATT_1: 'DEFAULT_ATTENDANCE_RECIPIENT_1',
  DEFAULT_ATT_2: 'DEFAULT_ATTENDANCE_RECIPIENT_2'
};


var DEFAULT_CONFIG = {
  ATTENDANCE_PREVIOUS_MONTH_CUTOFF_DAY: 15,
  TIMEZONE: 'Asia/Kolkata',
  HR_LEAVE_EMAIL: 'hr@programming.com',
  DEFAULT_ATTENDANCE_RECIPIENT_1: 'manager@company.com',
  DEFAULT_ATTENDANCE_RECIPIENT_2: 'pm@company.com'
};

function getConfigValue(key) {
  try {
    var ss = getEmsSpreadsheet();
    var sheet = ss.getSheetByName('Configuration');
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          return data[i][1];
        }
      }
    }
  } catch (e) {
    Logger.log('Warning: Could not read Configuration sheet: ' + e.message);
  }
  
  // Fallback to Script Properties or System Default
  var sysProp = PropertiesService.getScriptProperties().getProperty(key);
  if (sysProp !== null) return sysProp;
  
  return DEFAULT_CONFIG[key] !== undefined ? DEFAULT_CONFIG[key] : null;
}

function getEmsSpreadsheet() {
  var propId = PropertiesService.getScriptProperties().getProperty(CONFIG_KEYS.SPREADSHEET_ID);
  if (propId) {
    return SpreadsheetApp.openById(propId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}