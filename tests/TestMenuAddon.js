/**
 * Test Feature: Interactive Nested Dynamic Menus
 * Plugged directly into the existing EMS Chat Bot System
 */

/**
 * Renders the Root Test Menu (Main level)
 */
function renderTestMainMenuCard(userEmail) {
  return {
    "actionResponse": { "type": "UPDATE_MESSAGE" },
    "cardsV2": [{
      "cardId": "testMainMenuCard",
      "card": {
        "header": { 
          "title": "🧪 Dynamic Test Feature", 
          "subtitle": "Interactive Navigation Demo" 
        },
        "sections": [{
          "widgets": [
            { "textParagraph": { "text": "Select a menu category below:" } },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "📁 Submenu 1: IT Support",
                    "onClick": {
                      "action": {
                        "actionMethodName": "SHOW_TEST_SUBMENU_1"
                      }
                    }
                  },
                  {
                    "text": "📁 Submenu 2: HR Services",
                    "onClick": {
                      "action": {
                        "actionMethodName": "SHOW_TEST_SUBMENU_2"
                      }
                    }
                  }
                ]
              }
            },
            { "divider": {} },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "🏠 Return to Main Menu",
                    "onClick": {
                      "action": {
                        "actionMethodName": "HOME"
                      }
                    }
                  }
                ]
              }
            }
          ]
        }]
      }
    }]
  };
}

/**
 * Renders Submenu 1 (IT Support)
 */
function renderTestSubmenu1Card() {
  return {
    "actionResponse": { "type": "UPDATE_MESSAGE" },
    "cardsV2": [{
      "cardId": "testSubmenu1Card",
      "card": {
        "header": { 
          "title": "IT Support Services", 
          "subtitle": "Submenu 1 Options" 
        },
        "sections": [{
          "widgets": [
            { "textParagraph": { "text": "Select an IT action to trigger:" } },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "💻 Software Request",
                    "onClick": {
                      "action": {
                        "actionMethodName": "TEST_ACTION_SOFTWARE"
                      }
                    }
                  },
                  {
                    "text": "🔐 Password Reset",
                    "onClick": {
                      "action": {
                        "actionMethodName": "TEST_ACTION_PASSWORD"
                      }
                    }
                  }
                ]
              }
            },
            { "divider": {} },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "← Back to Test Menu",
                    "onClick": {
                      "action": {
                        "actionMethodName": "SHOW_TEST_MAIN_MENU"
                      }
                    }
                  }
                ]
              }
            }
          ]
        }]
      }
    }]
  };
}

/**
 * Renders Submenu 2 (HR Services)
 */
function renderTestSubmenu2Card() {
  return {
    "actionResponse": { "type": "UPDATE_MESSAGE" },
    "cardsV2": [{
      "cardId": "testSubmenu2Card",
      "card": {
        "header": { 
          "title": "HR Services & Help", 
          "subtitle": "Submenu 2 Options" 
        },
        "sections": [{
          "widgets": [
            { "textParagraph": { "text": "Select an HR inquiry below:" } },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "📜 Policy Documents",
                    "onClick": {
                      "action": {
                        "actionMethodName": "TEST_ACTION_POLICY"
                      }
                    }
                  },
                  {
                    "text": "📞 Contact HR Rep",
                    "onClick": {
                      "action": {
                        "actionMethodName": "TEST_ACTION_CONTACT"
                      }
                    }
                  }
                ]
              }
            },
            { "divider": {} },
            {
              "buttonList": {
                "buttons": [
                  {
                    "text": "← Back to Test Menu",
                    "onClick": {
                      "action": {
                        "actionMethodName": "SHOW_TEST_MAIN_MENU"
                      }
                    }
                  }
                ]
              }
            }
          ]
        }]
      }
    }]
  };
}