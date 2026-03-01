// Integration tests against production (Vercel + Supabase)
// Run: CYPRESS_BASE_URL=https://mma-liart.vercel.app CYPRESS_PROD_EMAIL=<email> CYPRESS_PROD_PASSWORD=<password> npx cypress run --spec cypress/e2e/production.cy.ts

describe("Production integration tests", () => {
  const email = Cypress.env("PROD_EMAIL");
  const password = Cypress.env("PROD_PASSWORD");

  function supabaseLogin() {
    cy.visit("/");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains("button", /sign in/i).click();
    // After login, either username prompt or dashboard appears
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  }

  function ensureLoggedIn() {
    supabaseLogin();
    // If username prompt appears, fill it
    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="username-input"]').length) {
        cy.get('[data-testid="username-input"]').type("testfighter");
        cy.contains("button", "Continue").click();
      }
    });
    // Should see dashboard
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
    // Should return to login screen with email input
    cy.get('input[type="email"]', { timeout: 10000 }).should("be.visible");
  });

  it("can navigate to all pages after login", () => {
    ensureLoggedIn();
    const pages = ["/log", "/history", "/avatar", "/ranking", "/sparring"];
    pages.forEach((page) => {
      cy.visit(page);
      cy.url().should("include", page);
    });
  });

  it("can log a session and see it in history", () => {
    ensureLoggedIn();
    cy.visit("/log");
    const today = new Date().toISOString().split("T")[0];
    cy.get('input[type="date"]').type(today);
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Basic");
    cy.contains("button", /log.*session/i).click();
    cy.url().should("include", "/history");
    cy.contains("Boxing").should("be.visible");
  });

  it("rejects future date sessions", () => {
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

  it("can send a shoutbox message", () => {
    ensureLoggedIn();
    cy.visit("/");
    // Open shoutbox
    cy.get("body").then(($body) => {
      if ($body.find('[aria-label="Open chat"]').length) {
        cy.get('[aria-label="Open chat"]').click();
      }
    });
    const msg = `prod-test-${Date.now()}`;
    cy.get('input[placeholder*="message" i]').type(msg);
    cy.contains("button", /send/i).click();
    cy.contains(msg, { timeout: 5000 }).should("be.visible");
  });

  it("ranking page loads without errors", () => {
    ensureLoggedIn();
    cy.visit("/ranking");
    // Should show at least the current user or "no members" state
    cy.get("body").should("not.contain.text", "Error");
    cy.get("body").should("not.contain.text", "500");
  });

  it("sparring page loads and allows creating a session", () => {
    ensureLoggedIn();
    cy.visit("/sparring");
    cy.get("body").should("not.contain.text", "Error");
  });
});
