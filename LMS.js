function renderLeaveFormCard(empRecord) {
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