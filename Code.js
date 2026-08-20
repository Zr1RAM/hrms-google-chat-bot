/**
 * Google Chat Webhook Handler & Card User Interface Presentation Layer
 */

/**
 * Safe handler for /checkin
 */
function handleCheckIn(event) {
  var userEmail = getAuthenticatedUserEmail(event);
  
  // 1. READ SHEET FIRST
  var empCtx = getEmployeeContext(userEmail);

  // 2. CHECK REGISTRATION & ACCESS
  if (!empCtx.isRegistered) {
    return renderSimpleTextCard(
      "Access Denied", 
      "Your email (" + userEmail + ") was not found in the EMS spreadsheet. Please contact HR."
    );
  }
  if (!empCtx.isActive) {
    return renderSimpleTextCard(
      "Account Inactive", 
      "Your EMS account is currently marked as inactive."
    );
  }

  // 3. ONLY THEN RENDER THE FORM
  return renderAttendanceFormCard(empCtx.record);
}

/**
 * Safe handler for /leave
 */
function handleLeaveRequest(event) {
  var userEmail = getAuthenticatedUserEmail(event);

  // 1. READ SHEET FIRST
  var empCtx = getEmployeeContext(userEmail);

  // 2. CHECK REGISTRATION & ACCESS
  if (!empCtx.isRegistered) {
    return renderSimpleTextCard(
      "Access Denied", 
      "Your email (" + userEmail + ") was not found in the EMS spreadsheet. Please contact HR."
    );
  }
  if (!empCtx.isActive) {
    return renderSimpleTextCard(
      "Account Inactive", 
      "Your EMS account is currently marked as inactive."
    );
  }

  // 3. ONLY THEN RENDER THE FORM
  return renderLeaveFormCard(empCtx.record);
}

/**
 * Triggers automatically whenever a user sends a message to the bot.
 * 
 * @param {Object} event - The Google Chat event object.
 * @return {Object} - The message or card payload returned to the user.
 */
function onMessage(event) {
  // Extract user text safely and normalize it
  var userMessage = event.message && event.message.text ? event.message.text.trim().toLowerCase() : "";
  var userName = event.user ? event.user.displayName : "there";

  // Handle specific user input commands
  if (userMessage === "hi" || userMessage === "hello") {
    return {
      "text": "Hi! " + userName + "👋 I’m your HR Assistant - Chennai.\nPlease select an option to continue: \n1. Leave Balance \n2. Timesheet Due Date"
    };
  }

  if (userMessage === "2") {
    return handleCheckIn(event);
  }

  if (userMessage === "1") {
    return handleLeaveRequest(event);
  }

  // // NEW: Testing Feature
  // if (userMessage === "3") {
  //   return renderTestMainMenuCard(getAuthenticatedUserEmail(event));
  // }

  // Fallback response for unhandled text
  return {
    "text": "I received: \"" + event.message.text + "\", but I'm not sure what to do with that. Type `hi` for available commands."
  };
}

function onCardClick(event) {
  return handleChatInteraction(event);
}

function onAddToSpace(event) {
  return renderHomeScreen(getAuthenticatedUserEmail(event), "Welcome to EMS Bot!");
}

function handleChatInteraction(event) {
  try {
    var userEmail = getAuthenticatedUserEmail(event);
    var empCtx = getEmployeeContext(userEmail);

    if (!empCtx.isRegistered) {
      return renderSimpleTextCard("Access Denied", "Your email (" + userEmail + ") is not registered in the EMS. Please contact an Administrator.");
    }
    if (!empCtx.isActive) {
      return renderSimpleTextCard("Account Inactive", "Your EMS account is deactivated. Contact HR.");
    }

    var action = event.action ? event.action.actionMethodName : 'HOME';
    var inputs = event.common ? event.common.formInputs : {};

    switch (action) {
      case 'HOME':
        return renderHomeScreen(userEmail, "Main Menu");

      // --- TEST MENU ADDON ACTIONS ---
      case 'SHOW_TEST_MAIN_MENU':
        return renderTestMainMenuCard(userEmail);

      case 'SHOW_TEST_SUBMENU_1':
        return renderTestSubmenu1Card();

      case 'SHOW_TEST_SUBMENU_2':
        return renderTestSubmenu2Card();

      case 'TEST_ACTION_SOFTWARE':
        return renderSimpleTextCard("IT Support", "Your Software Request ticket has been submitted.");

      case 'TEST_ACTION_PASSWORD':
        return renderSimpleTextCard("IT Support", "Password reset instructions sent to " + userEmail);

      case 'TEST_ACTION_POLICY':
        return renderSimpleTextCard("HR Services", "You can find company policies on the internal wiki.");

      case 'TEST_ACTION_CONTACT':
        return renderSimpleTextCard("HR Services", "Your HR Representative is online and notified.");
      // -------------------------------

      case 'VIEW_PROFILE':
        return renderProfileCard(empCtx.record);

      case 'SHOW_ATTENDANCE_FORM':
        return renderAttendanceFormCard(empCtx.record);

      case 'SUBMIT_ATTENDANCE':
        var attPayload = {
          dateStr: getInputValue(inputs, 'att_date') || formatDateISO(new Date()),
          inTime: getInputValue(inputs, 'in_time') || '09:00 AM',
          outTime: getInputValue(inputs, 'out_time') || '06:30 PM',
          activities: getInputValue(inputs, 'activities'),
          incompleteTasks: getInputValue(inputs, 'incomplete_tasks'),
          blockages: getInputValue(inputs, 'blockages')
        };
        submitAttendanceRecord(userEmail, attPayload, false);
        return renderSimpleTextCard("Attendance Recorded", "Your attendance for " + attPayload.dateStr + " was submitted successfully.");

      case 'SHOW_LEAVE_FORM':
        return renderLeaveFormCard(empCtx.record);

      case 'SUBMIT_LEAVE':
        var lCode = getInputValue(inputs, 'leave_type');
        var lDays = parseFloat(getInputValue(inputs, 'leave_days'));
        var sDate = getInputValue(inputs, 'start_date');
        var eDate = getInputValue(inputs, 'end_date') || sDate;
        var lReason = getInputValue(inputs, 'reason');

        var res = processLeaveApplication(userEmail, lCode, lDays, sDate, eDate, lReason);
        return renderSimpleTextCard("Leave Applied", "Request ID: " + res.requestId + "\nNew Balance: " + res.balanceAfter + " days.");

      default:
        return renderHomeScreen(userEmail, "Main Menu");
    }

  } catch (err) {
    return renderSimpleTextCard("Error Encountered", err.message);
  }
}

function getInputValue(inputs, key) {
  if (inputs && inputs[key] && inputs[key][""] && inputs[key][""].stringInputs) {
    return inputs[key][""].stringInputs.value[0];
  }
  return null;
}

// Card Render Helpers
function renderHomeScreen(email, title) {
  var empCtx = getEmployeeContext(email);
  var isAdmin = empCtx.record['Role'] === 'EMS_Admin';

  var widgets = [
    { textParagraph: { text: "Hello <b>" + empCtx.record['Name'] + "</b> 👋" } },
    { buttonList: { buttons: [
      { text: "Attendance", onClick: { action: { actionMethodName: "SHOW_ATTENDANCE_FORM" } } },
      { text: "Apply Leave", onClick: { action: { actionMethodName: "SHOW_LEAVE_FORM" } } },
      { text: "My Profile", onClick: { action: { actionMethodName: "VIEW_PROFILE" } } }
    ] } }
  ];

  if (isAdmin) {
    widgets.push({ divider: {} });
    widgets.push({ textParagraph: { text: "<b>Admin Console</b>" } });
    widgets.push({ buttonList: { buttons: [
      { text: "Admin Operations", onClick: { action: { actionMethodName: "ADMIN_CONSOLE" } } }
    ] } });
  }

  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{ cardId: "homeCard", card: { header: { title: "EMS Dashboard", subtitle: title }, sections: [{ widgets: widgets }] } }]
  };
}

function renderSimpleTextCard(title, text) {
  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{ cardId: "msgCard", card: { header: { title: title }, sections: [{ widgets: [{ textParagraph: { text: text } }] }] } }]
  };
}

function renderProfileCard(empRecord) {
  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{
      cardId: "profileCard",
      card: {
        header: { title: empRecord['Name'], subtitle: empRecord['Designation'] || 'Employee' },
        sections: [{
          widgets: [
            { decoratedText: { topLabel: "EMP ID", text: empRecord['EMP ID'] } },
            { decoratedText: { topLabel: "Role", text: empRecord['Role'] } },
            { decoratedText: { topLabel: "Project", text: empRecord['Project'] || 'Unassigned' } },
            { decoratedText: { topLabel: "Leave Balances", text: "CL: " + empRecord['CL'] + " | SL: " + empRecord['SL'] + " | PL: " + empRecord['EL'] + " | LL: " + empRecord['LL'] } }
          ]
        }]
      }
    }]
  };
}

/**
 * Renders the Timesheet Due Date Card with dynamic status checking
 */
function renderAttendanceFormCard(empRecord) {
  var win = getAttendanceEditingWindow();
  var dateHelp = "Editable: Current month (" + win.currentMonthStart + " to Today)";
  if (win.prevMonthEditable) {
    dateHelp += "\nPrev Month (" + win.prevMonthName + ") open until " + win.cutoffDateStr;
  } else {
    dateHelp += "\nPrev Month (" + win.prevMonthName + ") is LOCKED";
  }

  // Helper function for date evaluation
function getDueDateStatus(rawDueDate) {
  if (!rawDueDate) return "Cannot find timesheet due date";

  // Force both dates into standard "YYYY-MM-DD" text format
  var tz = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  
  // If it's a Sheet Date object, format it. If text "DD-MM-YYYY", flip it to "YYYY-MM-DD".
  var dueDate = (rawDueDate instanceof Date)
    ? Utilities.formatDate(rawDueDate, tz, "yyyy-MM-dd")
    : String(rawDueDate).trim().split("-").reverse().join("-");

  // Format clean display text
  var displayText = (rawDueDate instanceof Date)
    ? Utilities.formatDate(rawDueDate, tz, "dd-MM-yyyy")
    : String(rawDueDate);

  if (today === dueDate) {
    displayText += "\n⏰ <b>Due today! Please submit immediately to avoid delay.</b>";
  } else if (today > dueDate) {
    displayText += "\n⚠️ <b>Due date has passed, avoid the delay</b>";
  }

  return displayText;
}
var dueDateStatus = getDueDateStatus(empRecord['Timesheet Due Date']);
console.log(dueDateStatus);


  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{
      cardId: "attCard",
      card: {
        // header: { title: "Attendance Submission", subtitle: dateHelp },
        header: { title: "Your Timesheet Due date" },
        sections: [{
          widgets: [
            {
              decoratedText: { topLabel: "Due Date Status" }
            },
            {
              textParagraph: {
                text: "<b>Due Date:</b> " + dueDateStatus
              }
            }
            // { textInput: { name: "att_date", label: "Date (YYYY-MM-DD)", value: win.today } },
            // { textInput: { name: "in_time", label: "In Time", value: empRecord['In Time'] || "09:00 AM" } },
            // { textInput: { name: "out_time", label: "Out Time", value: empRecord['Out Time'] || "06:30 PM" } },
            // { textInput: { name: "activities", label: "Activities Completed", type: "MULTILINE" } },
            // { textInput: { name: "incomplete_tasks", label: "Incomplete Tasks", value: "N/A" } },
            // { textInput: { name: "blockages", label: "Blockages / Challenges", value: "N/A" } },
            // { buttonList: { buttons: [{ text: "Submit Report", onClick: { action: { actionMethodName: "SUBMIT_ATTENDANCE" } } }] } }
          ]
        }]
      }
    }]
  };
}

