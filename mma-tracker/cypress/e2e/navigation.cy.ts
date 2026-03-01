describe("Navigation", () => {
  const ts = Date.now();

  beforeEach(() => {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(`nav-${ts}`);
    cy.contains("button", "Get Started").click();
  });

  const pages = [
    { label: /log.*session/i, path: "/log" },
    { label: /history/i, path: "/history" },
    { label: /avatar/i, path: "/avatar" },
    { label: /ranking/i, path: "/ranking" },
    { label: /sparring/i, path: "/sparring" },
  ];

  pages.forEach(({ label, path }) => {
    it(`navigates to ${path}`, () => {
      cy.visit("/");
      cy.contains("a", label).click();
      cy.url().should("include", path);
    });
  });

  it("FightMate logo navigates home", () => {
    cy.visit("/log");
    cy.contains("a", "FightMate").click();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });
});
