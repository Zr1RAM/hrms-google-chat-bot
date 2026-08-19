/**
 * Administrative Operations Subsystem
 */

function assertAdmin(actorEmail) {
  var empCtx = getEmployeeContext(actorEmail);
  if (!empCtx.isRegistered || !empCtx.isActive || empCtx.record['Role'] !== 'EMS_Admin') {
    throw new Error('Access Denied: Action requires EMS_Admin permissions.');
  }
  return empCtx;
}

function adminAdjustLeaveBalance(actorEmail, targetEmpEmail, leaveCode, newBalance, reason) {
  assertAdmin(actorEmail);
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  
  try {
    var targetCtx = getEmployeeContext(targetEmpEmail);
    if (!targetCtx.isRegistered) throw new Error('Target employee not found.');

    var ss = getEmsSpreadsheet();
    var sheet = ss.getSheetByName('Employees');
    var map = getHeaderMap(sheet);
    
    var oldVal = targetCtx.record[leaveCode];
    sheet.getRange(targetCtx.record._rowIndex, map[leaveCode]).setValue(newBalance);
    
    lock.releaseLock();
    
    writeAuditEntry(actorEmail, targetCtx.record['EMP ID'], 'ADMIN_BALANCE_ADJUST', 'SUCCESS', 
      'Updated ' + leaveCode + ' from ' + oldVal + ' to ' + newBalance + '. Reason: ' + reason);
    return true;
  } catch (e) {
    if (lock.hasLock()) lock.releaseLock();
    throw e;
  }
}