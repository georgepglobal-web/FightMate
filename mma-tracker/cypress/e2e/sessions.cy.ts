describe("Session CRUD — no duplicates, persistence, future date", () => {
  function login(username: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(username);
    cy.contains("button", "Get Started").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  }

  function logSession(date: string, type: string, level: string) {
    cy.visit("/log");
    cy.get('input[type="date"]').type(date);
    cy.get("select").eq(0).select(type);
    cy.get("select").eq(1).select(level);
    cy.contains("button", /log.*session/i).click();
  }

  function visitHistory() {
    cy.visit("/history");
    cy.wait(1000); // let poll sync
  }

  function sessionRows() {
    return cy.get('[class*="divide-y"] > div');
  }

  it("adding a session shows exactly one entry (no duplicate)", () => {
    login("e2e-crud-1");
    logSession("2025-06-01", "Boxing", "Basic");
    visitHistory();
    cy.contains("Boxing").should("exist");
    // Count rows containing "Jun 1, 2025" or "Boxing" — should be exactly 1
    sessionRows().filter(':contains("Boxing")').should("have.length", 1);
  });

  it("session persists after reload", () => {
    login("e2e-crud-2");
    logSession("2025-07-01", "Muay Thai", "Intermediate");
    visitHistory();
    cy.contains("Muay Thai").should("exist");
    cy.reload();
    cy.wait(2000);
    cy.contains("Muay Thai").should("exist");
    sessionRows().filter(':contains("Muay Thai")').should("have.length", 1);
  });

  it("delete then re-add does not create duplicates", () => {
    login("e2e-crud-3");
    logSession("2025-08-01", "Wrestling", "Advanced");
    visitHistory();
    cy.contains("Wrestling").should("exist");
    // Delete it
    cy.get('button[aria-label="Delete session"]').first().click();
    cy.contains("button", /confirm/i).click();
    cy.wait(1000);
    cy.contains("Wrestling").should("not.exist");
    // Re-add same session
    logSession("2025-08-01", "Wrestling", "Advanced");
    visitHistory();
    sessionRows().filter(':contains("Wrestling")').should("have.length", 1);
  });

  it("rejects a session with a future date", () => {
    login("e2e-crud-4");
    cy.visit("/log");
    cy.get('input[type="date"]').type("2099-01-01");
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Basic");
    cy.contains("button", /log.*session/i).click();
    // Should show error, not navigate away
    cy.contains("future").should("exist");
    cy.url().should("include", "/log");
  });

  it("no duplicate after rapid add + poll cycle", () => {
    login("e2e-crud-5");
    logSession("2025-09-01", "BJJ", "Basic");
    // Wait for multiple poll cycles
    cy.wait(5000);
    visitHistory();
    sessionRows().filter(':contains("BJJ")').should("have.length", 1);
  });
});
