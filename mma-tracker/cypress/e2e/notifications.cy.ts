describe("Shoutbox notifications", () => {
  function login(username: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(username);
    cy.contains("button", "Get Started").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  }

  function fab() {
    return cy.get('[aria-label="Open chat"]');
  }

  function openChat() {
    fab().click();
  }

  function closeChat() {
    cy.get('[aria-label="Close chat"]').click();
  }

  function sendMessage(text: string) {
    cy.get('input[placeholder="Say something..."]').type(text);
    cy.contains("button", "Send").click();
  }

  function unreadBadge() {
    return fab().find("span.bg-rose-500");
  }

  it("shows no unread badge on fresh load", () => {
    login("e2e-notif-1");
    fab().should("exist");
    unreadBadge().should("not.exist");
  });

  it("does not count own messages as unread", () => {
    login("e2e-notif-2");
    openChat();
    sendMessage("my own message");
    cy.contains("my own message").should("be.visible");
    closeChat();
    cy.wait(3000);
    unreadBadge().should("not.exist");
  });

  it("shows unread badge when another user sends a message", () => {
    login("e2e-notif-3");
    // Note current state
    fab().then(($fab) => {
      const before = $fab.find("span.bg-rose-500").length ? parseInt($fab.find("span.bg-rose-500").text()) : 0;
      // Inject message from different user via API
      cy.request("POST", "/api/shoutbox", {
        user_id: "external-user",
        type: "user",
        content: "cross-user message",
      });
      cy.wait(3000);
      unreadBadge().should("exist").then(($badge) => {
        expect(parseInt($badge.text())).to.be.greaterThan(before);
      });
    });
  });

  it("clears unread badge when chat is opened", () => {
    login("e2e-notif-4");
    cy.request("POST", "/api/shoutbox", {
      user_id: "external-user-2",
      type: "user",
      content: "another cross-user msg",
    });
    cy.wait(3000);
    unreadBadge().should("exist");
    openChat();
    cy.contains("another cross-user msg").should("be.visible");
    closeChat();
    // After opening and closing chat, badge should be gone
    fab().find("span.bg-rose-500").should("not.exist");
  });

  it("does not show all messages as unread on page reload", () => {
    login("e2e-notif-5");
    openChat();
    sendMessage("pre-existing msg");
    cy.contains("pre-existing msg").should("be.visible");
    closeChat();
    cy.reload();
    cy.wait(3000);
    unreadBadge().should("not.exist");
  });
});
