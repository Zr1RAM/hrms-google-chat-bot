/**
 * Attendance Operations & Date Rules Engine
 */

function getAttendanceEditingWindow() {
  var tz = getConfigValue('TIMEZONE') || Session.getScriptTimeZone();
  var now = new Date();
  
  var currentYear = parseInt(Utilities.formatDate(now, tz, 'yyyy'), 10);
  var currentMonth = parseInt(Utilities.formatDate(now, tz, 'M'), 10); // 1-12
  var currentDay = parseInt(Utilities.formatDate(now, tz, 'd'), 10);   // 1-31
  
  var cutoffConfig = parseCutoffDay(getConfigValue('ATTENDANCE_PREVIOUS_MONTH_CUTOFF_DAY'));
  
  // Current month editable: 1st of month to Today
  var currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Previous month logic calculation
  var prevMonthYear = currentYear;
  var prevMonth = currentMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevMonthYear = currentYear - 1;
  }

  var isPrevMonthEditable = (currentDay <= cutoffConfig);
  var prevMonthStart = new Date(prevMonthYear, prevMonth - 1, 1);
  var prevMonthEnd = new Date(prevMonthYear, prevMonth, 0); // Last day of prev month

  return {
    currentMonthName: Utilities.formatDate(now, tz, 'MMMM yyyy'),
    prevMonthName: Utilities.formatDate(prevMonthStart, tz, 'MMMM yyyy'),
    currentMonthStart: formatDateISO(currentMonthStart),
    today: formatDateISO(today),
    prevMonthEditable: isPrevMonthEditable,
    prevMonthStart: formatDateISO(prevMonthStart),
    prevMonthEnd: formatDateISO(prevMonthEnd),
    cutoffDay: cutoffConfig,
    cutoffDateStr: cutoffConfig + ' ' + Utilities.formatDate(now, tz, 'MMM yyyy')
  };
}

function validateAttendanceDate(dateStr, isAdminOverride) {
  if (isAdminOverride) return { valid: true };

  var windowInfo = getAttendanceEditingWindow();
  var targetDate = new Date(dateStr + 'T00:00:00');
  var today = new Date(windowInfo.today + 'T00:00:00');

  if (targetDate > today) {
    return { valid: false, reason: 'Attendance for future dates is not allowed.' };
  }

  var targetDateISO = formatDateISO(targetDate);

  // Check current month range
  if (targetDateISO >= windowInfo.currentMonthStart && targetDateISO <= windowInfo.today) {
    return { valid: true };
  }

  // Check previous month range
  if (windowInfo.prevMonthEditable) {
    if (targetDateISO >= windowInfo.prevMonthStart && targetDateISO <= windowInfo.prevMonthEnd) {
      return { valid: true };
    }
  } else if (targetDateISO >= windowInfo.prevMonthStart && targetDateISO <= windowInfo.prevMonthEnd) {
    return { 
      valid: false, 
      reason: 'Previous month (' + windowInfo.prevMonthName + ') attendance editing locked on day ' + windowInfo.cutoffDay + '.' 
    };
  }

  return { valid: false, reason: 'Requested date falls outside the permitted attendance editing window.' };
}

function submitAttendanceRecord(actorEmail, payload, isAdminOverride) {
  var dateValidation = validateAttendanceDate(payload.dateStr, isAdminOverride);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.reason);
  }

  var empCtx = getEmployeeContext(payload.targetEmail || actorEmail);
  if (!empCtx.isRegistered) throw new Error('Target employee record not found.');

  var ss = getEmsSpreadsheet();
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) throw new Error('Attendance sheet missing.');

  var map = getHeaderMap(sheet);
  validateHeaders('Attendance', map, ['Attendance Record ID', 'Attendance Date', 'EMP ID', 'Email', 'In Time', 'Out Time']);

  var recordId = empCtx.record['EMP ID'] + '_' + payload.dateStr;
  var data = sheet.getDataRange().getValues();
  var existingRowIndex = -1;
  var recIdColIdx = map['Attendance Record ID'] - 1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][recIdColIdx]) === recordId) {
      existingRowIndex = i + 1;
      break;
    }
  }

  var nowStr = Utilities.formatDate(new Date(), getConfigValue('TIMEZONE'), 'yyyy-MM-dd HH:mm:ss');
  var rowValues = [];

  // Build dynamic row array matching column sequence exactly
  var lastCol = sheet.getLastColumn();
  for (var c = 1; c <= lastCol; c++) {
    rowValues.push('');
  }

  rowValues[map['Attendance Record ID'] - 1] = recordId;
  rowValues[map['Attendance Date'] - 1] = payload.dateStr;
  rowValues[map['EMP ID'] - 1] = empCtx.record['EMP ID'];
  rowValues[map['Email'] - 1] = empCtx.record['Email'];
  if (map['Name']) rowValues[map['Name'] - 1] = empCtx.record['Name'];
  rowValues[map['In Time'] - 1] = payload.inTime;
  rowValues[map['Out Time'] - 1] = payload.outTime;
  if (map['Activities']) rowValues[map['Activities'] - 1] = payload.activities;
  if (map['Comments']) rowValues[map['Comments'] - 1] = payload.comments || '';
  if (map['Incomplete Tasks']) rowValues[map['Incomplete Tasks'] - 1] = payload.incompleteTasks || 'N/A';
  if (map['Blockages / Challenges']) rowValues[map['Blockages / Challenges'] - 1] = payload.blockages || 'N/A';
  if (map['Updated At']) rowValues[map['Updated At'] - 1] = nowStr;
  if (map['Updated By']) rowValues[map['Updated By'] - 1] = actorEmail;

  if (existingRowIndex > 0) {
    // Preserve Created At / Created By
    if (map['Created At']) rowValues[map['Created At'] - 1] = data[existingRowIndex - 1][map['Created At'] - 1];
    if (map['Created By']) rowValues[map['Created By'] - 1] = data[existingRowIndex - 1][map['Created By'] - 1];
    
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    if (map['Created At']) rowValues[map['Created At'] - 1] = nowStr;
    if (map['Created By']) rowValues[map['Created By'] - 1] = actorEmail;
    sheet.appendRow(rowValues);
  }

  // Trigger Email Dispatch
  var emailSent = sendAttendanceStatusEmail(empCtx.record, payload);
  
  // Update Email Status column
  if (map['Email Status']) {
    var targetRow = existingRowIndex > 0 ? existingRowIndex : sheet.getLastRow();
    sheet.getRange(targetRow, map['Email Status']).setValue(emailSent ? 'SENT' : 'FAILED');
  }

  writeAuditEntry(actorEmail, empCtx.record['EMP ID'], 'ATTENDANCE_SUBMITTED', recordId, JSON.stringify(payload));
  return { success: true, updated: existingRowIndex > 0 };
}