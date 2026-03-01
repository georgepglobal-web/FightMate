describe("Sparring flow", () => {
  const ts = Date.now();

  function login(name: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(name);
    cy.contains("button", "Get Started").click();
  }

  it("create a sparring session and see it listed", () => {
    login(`spar-${ts}`);
    cy.visit("/sparring");
    cy.get('input[type="date"]').type("2025-10-01");
    cy.get('input[type="time"]').type("14:00");
    cy.get('input[placeholder*="Gym" i], input[placeholder*="location" i]').type("Downtown Gym");
    cy.contains("button", /create/i).click();
    cy.contains("Downtown Gym").should("exist");
  });

  it("cancel removes session from open list", () => {
    const gym = `CancelGym-${ts}`;
    login(`spar-cancel-${ts}`);
    cy.visit("/sparring");
    cy.get('input[type="date"]').type("2025-11-01");
    cy.get('input[type="time"]').type("10:00");
    cy.get('input[placeholder*="Gym" i], input[placeholder*="location" i]').type(gym);
    cy.contains("button", /create/i).click();
    cy.contains(gym).should("exist");
    // Find the cancel button near our gym entry
    cy.contains(gym).parents('[class*="border"]').find('button').filter(':contains("Cancel")').click();
    cy.contains("button", /confirm/i).click();
    cy.wait(1000);
    cy.contains(gym).should("not.exist");
  });
});
