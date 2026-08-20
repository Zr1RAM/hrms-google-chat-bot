/**
 * Atomic Leave Engine & Transaction Processor
 */

function processLeaveApplication(actorEmail, leaveCode, requestedDays, startDateStr, endDateStr, reason) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock for up to 10 seconds to guarantee atomic deduction
    var acquired = lock.waitLock(10000);
    if (!acquired) {
      throw new Error('System busy processing simultaneous requests. Please try again.');
    }

    var empCtx = getEmployeeContext(actorEmail);
    if (!empCtx.isRegistered || !empCtx.isActive) throw new Error('Unauthorized or inactive user.');
    if (!checkPermission(empCtx, 'ReadWrite')) throw new Error('Role permissions restrict submitting leave.');

    var leaveCodeClean = String(leaveCode).toUpperCase().trim(); // CL, SL, PL
    var validCodes = ['CL', 'SL', 'EL', 'LL'];
    if (validCodes.indexOf(leaveCodeClean) === -1) throw new Error('Invalid Leave Type specified.');

    var currentBalance = parseFloat(empCtx.record[leaveCodeClean]);
    if (isNaN(currentBalance)) throw new Error('Leave balance missing for type: ' + leaveCodeClean);

    if (requestedDays <= 0) throw new Error('Requested leave days must be greater than zero.');
    if (requestedDays > currentBalance) {
      throw new Error('Insufficient ' + leaveCodeClean + ' balance. Available: ' + currentBalance + ', Requested: ' + requestedDays);
    }

    var newBalance = currentBalance - requestedDays;

    // 1. Update Employee Master Sheet Balance
    var ss = getEmsSpreadsheet();
    var empSheet = ss.getSheetByName('Employees');
    var empMap = getHeaderMap(empSheet);
    empSheet.getRange(empCtx.record._rowIndex, empMap[leaveCodeClean]).setValue(newBalance);

    // 2. Write Transaction to Leave History Sheet
    var historySheet = ss.getSheetByName('Leave History');
    var histMap = getHeaderMap(historySheet);
    validateHeaders('Leave History', histMap, ['Request ID', 'Timestamp', 'EMP ID', 'Leave Type', 'Number of Days']);

    var requestId = 'LV-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    var nowStr = Utilities.formatDate(new Date(), getConfigValue('TIMEZONE'), 'yyyy-MM-dd HH:mm:ss');
    
    var leaveDisplayNames = { 'CL': 'Casual Leave', 'SL': 'Sick Leave', 'EL': 'Earned Leave', 'LL': "Loyalty Leave" };

    var histRow = [];
    for (var c = 1; c <= historySheet.getLastColumn(); c++) histRow.push('');

    histRow[histMap['Request ID'] - 1] = requestId;
    histRow[histMap['Timestamp'] - 1] = nowStr;
    histRow[histMap['EMP ID'] - 1] = empCtx.record['EMP ID'];
    histRow[histMap['Email'] - 1] = empCtx.record['Email'];
    if (histMap['Name']) histRow[histMap['Name'] - 1] = empCtx.record['Name'];
    histRow[histMap['Leave Type'] - 1] = leaveCodeClean;
    if (histMap['Leave Type Display Name']) histRow[histMap['Leave Type Display Name'] - 1] = leaveDisplayNames[leaveCodeClean];
    histRow[histMap['Start Date'] - 1] = startDateStr;
    histRow[histMap['End Date'] - 1] = endDateStr;
    histRow[histMap['Number of Days'] - 1] = requestedDays;
    histRow[histMap['Reason'] - 1] = reason;
    if (histMap['Balance Before']) histRow[histMap['Balance Before'] - 1] = currentBalance;
    if (histMap['Balance After']) histRow[histMap['Balance After'] - 1] = newBalance;
    if (histMap['Status']) histRow[histMap['Status'] - 1] = 'APPROVED';
    if (histMap['Processed By']) histRow[histMap['Processed By'] - 1] = 'SYSTEM';

    historySheet.appendRow(histRow);
    var insertedRow = historySheet.getLastRow();

    // Release lock immediately after spreadsheet write completes
    lock.releaseLock();

    // 3. Dispatch Email downstream outside lock
    var leaveDetails = {
      leaveCode: leaveCodeClean,
      leaveDisplay: leaveDisplayNames[leaveCodeClean],
      requestedDays: requestedDays,
      startDateStr: startDateStr,
      endDateStr: endDateStr,
      reason: reason
    };

    var emailSuccess = sendLeaveNotificationEmail(empCtx.record, leaveDetails);
    if (histMap['Email Status']) {
      historySheet.getRange(insertedRow, histMap['Email Status']).setValue(emailSuccess ? 'SENT' : 'FAILED');
    }

    writeAuditEntry(actorEmail, empCtx.record['EMP ID'], 'LEAVE_DEDUCTED', requestId, JSON.stringify(leaveDetails));
    
    return {
      success: true,
      requestId: requestId,
      leaveType: leaveDisplayNames[leaveCodeClean],
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    };

  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    writeAuditEntry(actorEmail, 'N/A', 'LEAVE_FAILED', 'ERROR', err.message);
    throw err;
  }
}