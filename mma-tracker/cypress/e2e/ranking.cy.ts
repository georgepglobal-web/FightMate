describe("Ranking + profile click", () => {
  const ts = Date.now();

  function login(name: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(name);
    cy.contains("button", "Get Started").click();
  }

  it("clicking a user on ranking navigates to their profile", () => {
    const name = `profile-${ts}`;
    login(name);
    cy.visit("/ranking");
    cy.wait(3000);
    cy.get('[class*="cursor-pointer"]').first().click();
    cy.url().should("include", "/profile");
  });

  it("score updates on ranking after logging a session", () => {
    const name = `scorer-${ts}`;
    login(name);
    cy.visit("/log");
    cy.get('input[type="date"]').type("2025-04-01");
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Advanced");
    cy.contains("button", /log.*session/i).click();
    cy.visit("/ranking");
    cy.wait(3000);
    cy.contains(name).should("exist");
  });
});
