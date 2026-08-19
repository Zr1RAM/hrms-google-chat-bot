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
      "text": "Hello " + userName + "! How can I assist you with EMS today?\nType \n`/checkin` \nor \n`/leave` \nto get started."
    };
  }

  if (userMessage === "/checkin") {
    return handleCheckIn(event);
  }

  if (userMessage === "/leave") {
    return handleLeaveRequest(event);
  }

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
            { decoratedText: { topLabel: "Leave Balances", text: "CL: " + empRecord['CL'] + " | SL: " + empRecord['SL'] + " | PL: " + empRecord['PL'] } }
          ]
        }]
      }
    }]
  };
}

function renderAttendanceFormCard(empRecord) {
  var win = getAttendanceEditingWindow();
  var dateHelp = "Editable: Current month (" + win.currentMonthStart + " to Today)";
  if (win.prevMonthEditable) {
    dateHelp += "\nPrev Month (" + win.prevMonthName + ") open until " + win.cutoffDateStr;
  } else {
    dateHelp += "\nPrev Month (" + win.prevMonthName + ") is LOCKED";
  }

  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{
      cardId: "attCard",
      card: {
        header: { title: "Attendance Submission", subtitle: dateHelp },
        sections: [{
          widgets: [
            { textInput: { name: "att_date", label: "Date (YYYY-MM-DD)", value: win.today } },
            { textInput: { name: "in_time", label: "In Time", value: empRecord['In Time'] || "09:00 AM" } },
            { textInput: { name: "out_time", label: "Out Time", value: empRecord['Out Time'] || "06:30 PM" } },
            { textInput: { name: "activities", label: "Activities Completed", type: "MULTILINE" } },
            { textInput: { name: "incomplete_tasks", label: "Incomplete Tasks", value: "N/A" } },
            { textInput: { name: "blockages", label: "Blockages / Challenges", value: "N/A" } },
            { buttonList: { buttons: [{ text: "Submit Report", onClick: { action: { actionMethodName: "SUBMIT_ATTENDANCE" } } }] } }
          ]
        }]
      }
    }]
  };
}

function renderLeaveFormCard(empRecord) {
  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{
      cardId: "leaveCard",
      card: {
        header: { title: "Apply for Leave", subtitle: "Available Balances -> CL: " + empRecord['CL'] + " | SL: " + empRecord['SL'] + " | PL: " + empRecord['PL'] },
        sections: [{
          widgets: [
            { textInput: { name: "leave_type", label: "Leave Type (CL / SL / PL)", value: "CL" } },
            { textInput: { name: "leave_days", label: "Number of Days", value: "1" } },
            { textInput: { name: "start_date", label: "Start Date (YYYY-MM-DD)", value: formatDateISO(new Date()) } },
            { textInput: { name: "end_date", label: "End Date (YYYY-MM-DD)", value: formatDateISO(new Date()) } },
            { textInput: { name: "reason", label: "Reason for Leave" } },
            { buttonList: { buttons: [{ text: "Confirm Leave Application", onClick: { action: { actionMethodName: "SUBMIT_LEAVE" } } }] } }
          ]
        }]
      }
    }]
  };
}