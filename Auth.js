/**
 * Authentication & Authorization Engine
 */

function getAuthenticatedUserEmail(event) {
  if (event && event.user && event.user.email) {
    return String(event.user.email).toLowerCase().trim();
  }
  // Alternate execution contexts
  var sessionEmail = Session.getActiveUser().getEmail();
  if (sessionEmail) return String(sessionEmail).toLowerCase().trim();
  
  throw new Error('Unauthenticated execution: Unable to resolve user identity.');
}

// function getEmployeeContext(email) {
//   var ss = getEmsSpreadsheet();
//   var sheet = ss.getSheetByName('Employees');
//   if (!sheet) throw new Error('Employees sheet not found.');

//   var map = getHeaderMap(sheet);
//   validateHeaders('Employees', map, ['EMP ID', 'Email', 'Role', 'Name']);

//   var data = sheet.getDataRange().getValues();
//   var emailColIdx = map['Email'] - 1;

//   for (var i = 1; i < data.length; i++) {
//     var rowEmail = String(data[i][emailColIdx]).toLowerCase().trim();
//     if (rowEmail === email.toLowerCase().trim()) {
//       var record = {};
//       for (var key in map) {
//         record[key] = data[i][map[key] - 1];
//       }
//       record._rowIndex = i + 1; // Store 1-based row index for updates
      
//       // Verification of active status if column exists
//       if (map['Active'] && record['Active'] === false) {
//         return { isRegistered: true, isActive: false, record: record };
//       }
//       return { isRegistered: true, isActive: true, record: record };
//     }
//   }
//   return { isRegistered: false, isActive: false, record: null };
// }

function getEmployeeContext(email) {
  var ss = getEmsSpreadsheet();
  
  // 1. Case-insensitive and trimmed search for the 'Employees' tab
  var targetName = 'employees';
  var sheets = ss.getSheets();
  var sheet = null;

  for (var s = 0; s < sheets.length; s++) {
    if (sheets[s].getName().trim().toLowerCase() === targetName) {
      sheet = sheets[s];
      break;
    }
  }

  if (!sheet) {
    throw new Error('Employees sheet not found. Available tabs are: ' + 
      sheets.map(function(s) { return '"' + s.getName() + '"'; }).join(', '));
  }

  var map = getHeaderMap(sheet);
  validateHeaders('Employees', map, ['EMP ID', 'Email', 'Role', 'Name']);

  var data = sheet.getDataRange().getValues();
  var emailColIdx = map['Email'] - 1;

  for (var i = 1; i < data.length; i++) {
    var rowEmail = String(data[i][emailColIdx]).toLowerCase().trim();
    if (rowEmail === email.toLowerCase().trim()) {
      var record = {};
      for (var key in map) {
        record[key] = data[i][map[key] - 1];
      }
      record._rowIndex = i + 1; // Store 1-based row index for updates
      
      // Verification of active status if column exists
      if (map['Active'] !== undefined && record['Active'] === false) {
        return { isRegistered: true, isActive: false, record: record };
      }
      return { isRegistered: true, isActive: true, record: record };
    }
  }
  return { isRegistered: false, isActive: false, record: null };
}

function checkPermission(employeeCtx, requiredRole) {
  if (!employeeCtx.isRegistered || !employeeCtx.isActive) return false;
  var userRole = employeeCtx.record['Role'];
  
  if (userRole === 'EMS_Admin') return true;
  if (requiredRole === 'ReadWrite' && (userRole === 'ReadWrite' || userRole === 'EMS_Admin')) return true;
  if (requiredRole === 'ReadOnly') return true;
  
  return false;
}