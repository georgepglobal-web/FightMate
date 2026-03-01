describe("Log session + history redirect", () => {
  const ts = Date.now();

  it("logging a session redirects to history and shows it", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(`log-${ts}`);
    cy.contains("button", "Get Started").click();
    cy.visit("/log");
    cy.get('input[type="date"]').type("2025-05-15");
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Basic");
    cy.contains("button", /log.*session/i).click();
    cy.url().should("include", "/history");
    cy.contains("Boxing").should("exist");
  });
});
