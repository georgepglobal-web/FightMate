describe("Avatar page", () => {
  const ts = Date.now();

  it("shows all 4 evolution stages", () => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(`avatar-${ts}`);
    cy.contains("button", "Get Started").click();
    cy.visit("/avatar");
    cy.contains("Novice").should("exist");
    cy.contains("Intermediate").should("exist");
    cy.contains("Seasoned").should("exist");
    cy.contains("Elite").should("exist");
  });
});
