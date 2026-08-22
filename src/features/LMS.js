
function renderLeaveFormCard(empRecord) {

    function getLeaveBalanceNote() {
  var today = new Date();
  var day = today.getDate();
  
  // 1. Determine base month/year for "updated as of" (use previous month if before the 25th)
  var baseDate = new Date(today.getFullYear(), today.getMonth() - (day < 25 ? 1 : 0), 25);
  
  // 2. Determine next month for "reflected from"
  var nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 25);

  // Helper for ordinal suffixes (25th, 1st, 2nd, etc.)
  function formatOrdinalDate(date) {
    var d = date.getDate();
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var suffix = (d > 3 && d < 21) ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
    return d + suffix + " " + months[date.getMonth()] + " " + date.getFullYear();
  }

  var updatedAsOf = formatOrdinalDate(baseDate);
  var reflectedFrom = formatOrdinalDate(nextDate);

  return "<b>Note:</b> Your leave balance is updated as of <b>" + updatedAsOf + "</b>. " +
         "If you have taken any leave after this date, they will be reflected from <b>" + reflectedFrom + "</b> onwards.";
}

  return {
    actionResponse: { type: "NEW_MESSAGE" },
    cardsV2: [{
      cardId: "leaveCard",
      card: {
        header: { 
        //   title: "Apply for Leave", 
          title: `${empRecord['Name']} Leave balance:`,
        //   subtitle: "Available Balances -> CL: " + empRecord['CL'] + " | SL: " + empRecord['SL'] + " | EL: " + empRecord['EL'] + " | LL: " + empRecord['LL'] 
        },
        sections: [{
          widgets: [
            {
              "decoratedText": {
                "topLabel": "Casual Leave (CL)",
                "text": `<h1>${empRecord['CL'] || "Cannot find leaves"}</h1>`
              }
            },
            {
              "decoratedText": {
                "topLabel": "Sick Leave (SL)",
                "text": `<h1>${empRecord['SL'] || "Cannot find leaves"}</h1>`
              }
            },
            {
              "decoratedText": {
                "topLabel": "Earned Leave (EL)",
                "text": `<h1>${empRecord['EL'] || "Cannot find leaves"}</h1>`
              }
            },
            {
              "decoratedText": {
                "topLabel": "Loyalty Leave (LL)",
                "text": `<h1>${empRecord['LL'] || "Cannot find leaves"}</h1>`
              }
            },
            {
                textParagraph: {
                    text: getLeaveBalanceNote(),
                }
            }
            // TO DO: above is demo below is your work
            // {
            //   selectionInput: {
            //     name: "leave_type",
            //     label: "Leave Type",
            //     type: "DROPDOWN",
            //     items: [
            //       { text: "Casual Leave (CL)", value: "CL", selected: true },
            //       { text: "Sick Leave (SL)", value: "SL", selected: false },
            //       { text: "Earned Leave (EL)", value: "EL", selected: false },
            //       { text: "Loyalty Leave (LL)", value: "LL", selected: false }
            //     ]
            //   }
            // },
            // { textInput: { name: "leave_days", label: "Number of Days", value: "1" } },
            // { textInput: { name: "start_date", label: "Start Date (YYYY-MM-DD)", value: formatDateISO(new Date()) } },
            // { textInput: { name: "end_date", label: "End Date (YYYY-MM-DD)", value: formatDateISO(new Date()) } },
            // { textInput: { name: "reason", label: "Reason for Leave" } },
            // { buttonList: { buttons: [{ text: "Confirm Leave Application", onClick: { action: { actionMethodName: "SUBMIT_LEAVE" } } }] } }
          ]
        }]
      }
    }]
  };
}