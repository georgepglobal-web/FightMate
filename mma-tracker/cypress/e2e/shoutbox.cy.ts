describe("Shoutbox CRUD — no duplicates, persistence", () => {
  const ts = Date.now();

  function login(username: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(username);
    cy.contains("button", "Get Started").click();
  }

  function openChat() {
    cy.get('[aria-label="Open chat"]').click();
  }

  function sendMessage(text: string) {
    cy.get('input[placeholder="Say something..."]').type(text);
    cy.contains("button", "Send").click();
  }

  function chatMessages() {
    return cy.get('[class*="divide-y"] > div');
  }

  it("sending a message shows exactly one entry", () => {
    const msg = `msg-one-${ts}`;
    login(`chat1-${ts}`);
    openChat();
    sendMessage(msg);
    cy.wait(1000);
    chatMessages().filter(`:contains("${msg}")`).should("have.length", 1);
  });

  it("message persists after closing and reopening chat", () => {
    const msg = `msg-persist-${ts}`;
    login(`chat2-${ts}`);
    openChat();
    sendMessage(msg);
    cy.contains(msg).should("exist");
    cy.get('[aria-label="Close chat"]').click();
    openChat();
    cy.contains(msg).should("exist");
    chatMessages().filter(`:contains("${msg}")`).should("have.length", 1);
  });

  it("message persists after page reload", () => {
    const msg = `msg-reload-${ts}`;
    login(`chat3-${ts}`);
    openChat();
    sendMessage(msg);
    cy.contains(msg).should("exist");
    cy.get('[aria-label="Close chat"]').click();
    cy.reload();
    cy.wait(2000);
    openChat();
    cy.contains(msg).should("exist");
    chatMessages().filter(`:contains("${msg}")`).should("have.length", 1);
  });

  it("no duplicate after rapid send + poll cycle", () => {
    const msg = `msg-rapid-${ts}`;
    login(`chat4-${ts}`);
    openChat();
    sendMessage(msg);
    cy.wait(5000);
    chatMessages().filter(`:contains("${msg}")`).should("have.length", 1);
  });
});
