describe("Auth flow", () => {
  const ts = Date.now();

  it("login lands on home page", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(`auth-${ts}`);
    cy.contains("button", "Get Started").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.contains("FightMate").should("exist");
  });

  it("sign out returns to login screen", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(`signout-${ts}`);
    cy.contains("button", "Get Started").click();
    cy.contains("button", "Sign Out").click();
    cy.get('input[placeholder*="Enter username"]').should("exist");
  });

  it("rejects empty username", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear();
    cy.contains("button", "Get Started").should("be.disabled");
  });
});
