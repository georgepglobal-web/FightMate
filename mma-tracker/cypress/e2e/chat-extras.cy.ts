describe("Chat extras", () => {
  const ts = Date.now();

  function login(name: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(name);
    cy.contains("button", "Get Started").click();
  }

  function openChat() {
    cy.get('[aria-label="Open chat"]').click();
  }

  it("Enter key sends a message", () => {
    const msg = `enter-${ts}`;
    login(`chatkey-${ts}`);
    openChat();
    cy.get('input[placeholder="Say something..."]').type(`${msg}{enter}`);
    cy.contains(msg).should("exist");
  });

  it("rate limit prevents rapid messages", () => {
    login(`ratelimit-${ts}`);
    openChat();
    cy.get('input[placeholder="Say something..."]').type("first msg{enter}");
    cy.get('input[placeholder="Say something..."]').type("second msg{enter}");
    cy.contains(/rate limit/i).should("exist");
  });

  it("rejects empty message (send button does nothing)", () => {
    login(`empty-${ts}`);
    openChat();
    cy.get('input[placeholder="Say something..."]').clear();
    cy.contains("button", "Send").click();
    // Input should still be empty, no error, no crash
    cy.get('input[placeholder="Say something..."]').should("have.value", "");
  });
});
