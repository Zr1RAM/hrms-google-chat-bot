/**
 * System Audit Logging Subsystem
 */

function writeAuditEntry(actorEmail, targetEmpId, action, resultStatus, details) {
  try {
    var ss = getEmsSpreadsheet();
    var sheet = ss.getSheetByName('Audit Log');
    if (!sheet) return;

    var map = getHeaderMap(sheet);
    var nowStr = Utilities.formatDate(new Date(), getConfigValue('TIMEZONE'), 'yyyy-MM-dd HH:mm:ss');

    var row = [];
    for (var c = 1; c <= sheet.getLastColumn(); c++) row.push('');

    if (map['Timestamp']) row[map['Timestamp'] - 1] = nowStr;
    if (map['Actor Email']) row[map['Actor Email'] - 1] = actorEmail;
    if (map['Target EMP ID']) row[map['Target EMP ID'] - 1] = targetEmpId;
    if (map['Action']) row[map['Action'] - 1] = action;
    if (map['Status']) row[map['Status'] - 1] = resultStatus;
    if (map['Details']) row[map['Details'] - 1] = String(details).substring(0, 500);

    sheet.appendRow(row);
  } catch (e) {
    Logger.log('Audit Logging Failure: ' + e.message);
  }
}