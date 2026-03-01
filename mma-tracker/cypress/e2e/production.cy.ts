// Read-only integration tests against production (Vercel + Supabase)
// Run: CYPRESS_PROD_EMAIL=<email> CYPRESS_PROD_PASSWORD=<password> npm run e2e:prod

describe("Production integration tests", () => {
  const email = Cypress.env("PROD_EMAIL");
  const password = Cypress.env("PROD_PASSWORD");

  function supabaseLogin() {
    cy.visit("/");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains("button", /sign in/i).click();
  }

  function ensureLoggedIn() {
    supabaseLogin();
    // Wait for either dashboard or username prompt
    cy.get("body", { timeout: 10000 }).should("not.contain.text", "Loading...");
    // If username prompt appears, fill it
    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="username-input"]').length) {
        cy.get('[data-testid="username-input"]').type("testfighter");
        cy.contains("button", "Continue").click();
      }
    });
    cy.contains("FightMate", { timeout: 10000 }).should("be.visible");
  }

  before(() => {
    expect(email, "CYPRESS_PROD_EMAIL must be set").to.be.a("string").and.not.be.empty;
    expect(password, "CYPRESS_PROD_PASSWORD must be set").to.be.a("string").and.not.be.empty;
  });

  it("shows email login form (not username)", () => {
    cy.visit("/");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('input[placeholder*="Enter username"]').should("not.exist");
  });

  it("rejects invalid credentials", () => {
    cy.visit("/");
    cy.get('input[type="email"]').type("wrong@example.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.contains("button", /sign in/i).click();
    cy.contains(/invalid|error/i, { timeout: 5000 }).should("be.visible");
  });

  it("logs in with valid credentials", () => {
    ensureLoggedIn();
  });

  it("sign out works and returns to login screen", () => {
    ensureLoggedIn();
    cy.contains("button", "Sign Out").click();
    cy.get('input[type="email"]', { timeout: 10000 }).should("be.visible");
  });

  it("does not re-prompt for username after sign out and sign back in", () => {
    ensureLoggedIn();
    cy.contains("button", "Sign Out").click();
    cy.get('input[type="email"]', { timeout: 10000 }).should("be.visible");
    // Sign back in
    supabaseLogin();
    // Should go straight to dashboard, no username prompt
    cy.contains("FightMate", { timeout: 10000 }).should("be.visible");
    cy.get('[data-testid="username-input"]').should("not.exist");
  });

  it("can navigate to all pages after login", () => {
    ensureLoggedIn();
    const pages = ["/log", "/history", "/avatar", "/ranking", "/sparring"];
    pages.forEach((page) => {
      cy.visit(page);
      cy.url().should("include", page);
      cy.get("body").should("not.contain.text", "Error");
    });
  });

  it("log session form renders with correct fields", () => {
    ensureLoggedIn();
    cy.visit("/log");
    cy.get('input[type="date"]').should("be.visible");
    cy.get("select").should("have.length.at.least", 2);
    cy.contains("button", /log.*session/i).should("be.visible");
  });

  it("log session form rejects future dates", () => {
    ensureLoggedIn();
    cy.visit("/log");
    const future = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    cy.get('input[type="date"]').type(future);
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Basic");
    cy.contains("button", /log.*session/i).click();
    cy.contains(/future/i).should("be.visible");
    cy.url().should("include", "/log");
  });

  it("shoutbox opens and shows message input", () => {
    ensureLoggedIn();
    cy.visit("/");
    cy.get("body").then(($body) => {
      if ($body.find('[aria-label="Open chat"]').length) {
        cy.get('[aria-label="Open chat"]').click();
      }
    });
    cy.get('input[placeholder*="message" i]').should("be.visible");
  });

  it("ranking page loads without errors", () => {
    ensureLoggedIn();
    cy.visit("/ranking");
    cy.get("body").should("not.contain.text", "Error");
    cy.get("body").should("not.contain.text", "500");
  });
});
