/**
 * Automated Dynamic Email Generation Engine
 */

function sendAttendanceStatusEmail(empRecord, attendancePayload) {
  try {
    var rec1 = empRecord['Attendance Email Recipient 1'] || getConfigValue('DEFAULT_ATTENDANCE_RECIPIENT_1');
    var rec2 = empRecord['Attendance Email Recipient 2'] || getConfigValue('DEFAULT_ATTENDANCE_RECIPIENT_2');
    
    var recipients = [rec1, rec2].filter(function(e) { return e && String(e).trim().length > 0; }).join(',');
    if (!recipients) return false;

    var dateObj = new Date(attendancePayload.dateStr + 'T00:00:00');
    var dateFormatted = formatDateStatusReport(dateObj);
    var subject = 'STATUS REPORT ' + dateFormatted;

    var body = 
      'NAME: ' + (empRecord['Name'] || 'N/A') + '\n' +
      'DESIGNATION: ' + (empRecord['Designation'] || 'N/A') + '\n' +
      'EMP CODE: ' + (empRecord['EMP ID'] || 'N/A') + '\n' +
      'PROJECT NAME: ' + (empRecord['Project'] || 'N/A') + '\n' +
      'CRM/PM/RM NAME: ' + (empRecord['Reporting Manager'] || 'N/A') + '\n' +
      'PARALLEL REPORTING TO: ' + (empRecord['Parallel Reporting Manager'] || 'N/A') + '\n' +
      'START TIME: ' + attendancePayload.inTime + '\n' +
      'LEAVING TIME: ' + attendancePayload.outTime + '\n' +
      'ACTIVITIES: ' + attendancePayload.activities + '\n' +
      'INCOMPLETE TASKS AT THE END OF DAY: ' + (attendancePayload.incompleteTasks || 'N/A') + '\n' +
      'BLOCKAGE/HURDLES/CHALLENGES BEING FACED IF ANY: ' + (attendancePayload.blockages || 'N/A');

    MailApp.sendEmail(recipients, subject, body);
    return true;
  } catch (err) {
    Logger.log('Attendance Email Error: ' + err.message);
    return false;
  }
}

function sendLeaveNotificationEmail(empRecord, leavePayload) {
  try {
    var recipient = empRecord['Leave Email Recipient'] || getConfigValue('HR_LEAVE_EMAIL');
    
    var typeDisplayMap = { 'CL': 'casual', 'SL': 'sick', 'PL': 'privilege' };
    var typeName = typeDisplayMap[leavePayload.leaveCode] || leavePayload.leaveCode;
    
    var subject = 'Leave application ::: ' + typeName + ' ::: ' + leavePayload.requestedDays + ' days';

    var body = 
      'Name: ' + (empRecord['Name'] || 'N/A') + '\n' +
      'Designation: ' + (empRecord['Designation'] || 'N/A') + '\n' +
      'Emp Code: ' + (empRecord['EMP ID'] || 'N/A') + '\n' +
      'Reporting To: ' + (empRecord['Reporting Manager'] || 'N/A') + '\n' +
      'Project Name: ' + (empRecord['Project'] || 'N/A') + '\n' +
      'Department: ' + (empRecord['Department'] || 'N/A') + '\n' +
      'Location: ' + (empRecord['Location'] || 'N/A') + '\n' +
      'Leave Request for: ' + leavePayload.startDateStr + ' (' + leavePayload.requestedDays + ' day leave)\n' +
      'Leave type: ' + leavePayload.leaveDisplay + '\n' +
      'Total Number of Leaves Requested: ' + leavePayload.requestedDays + '\n' +
      'Reason for leave: ' + leavePayload.reason + '\n\n' +
      'Thanks and Regards,\n' +
      (empRecord['Name'] || 'Employee');

    MailApp.sendEmail(recipient, subject, body);
    return true;
  } catch (err) {
    Logger.log('Leave Email Error: ' + err.message);
    return false;
  }
}