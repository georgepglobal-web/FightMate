describe("Members/Ranking — no duplicates", () => {
  const ts = Date.now();

  function login(username: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(username);
    cy.contains("button", "Get Started").click();
  }

  it("user appears exactly once on ranking page", () => {
    const name = `rank1-${ts}`;
    login(name);
    cy.visit("/ranking");
    cy.wait(2000);
    cy.contains(name).should("exist");
    cy.get('[class*="cursor-pointer"]').filter(`:contains("${name}")`).should("have.length", 1);
  });

  it("user still appears once after reload", () => {
    const name = `rank2-${ts}`;
    login(name);
    cy.visit("/ranking");
    cy.wait(2000);
    cy.contains(name).should("exist");
    cy.reload();
    cy.wait(2000);
    cy.get('[class*="cursor-pointer"]').filter(`:contains("${name}")`).should("have.length", 1);
  });
});
