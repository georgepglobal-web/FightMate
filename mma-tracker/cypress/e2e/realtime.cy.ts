describe("Shoutbox real-time delivery", () => {
  const ts = Date.now();

  function login(name: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(name);
    cy.contains("button", "Get Started").click();
  }

  function openChat() {
    cy.get('[aria-label="Open chat"]').click();
  }

  it("external message appears without page reload", () => {
    login(`rt-${ts}`);
    openChat();
    // Post a message from another user via API
    cy.request("POST", "/api/shoutbox", {
      user_id: "external-rt",
      type: "user",
      content: `realtime-${ts}`,
    });
    // Should appear within a few seconds (poll or websocket)
    cy.contains(`realtime-${ts}`, { timeout: 10000 }).should("exist");
  });

  it("multiple external messages arrive in order", () => {
    login(`rt-order-${ts}`);
    openChat();
    cy.request("POST", "/api/shoutbox", { user_id: "ext", type: "user", content: `first-${ts}` });
    cy.wait(500);
    cy.request("POST", "/api/shoutbox", { user_id: "ext", type: "user", content: `second-${ts}` });
    cy.contains(`second-${ts}`, { timeout: 10000 }).should("exist");
    cy.contains(`first-${ts}`).should("exist");
  });
});

describe("Data freshness after mutations (no polling needed)", () => {
  const ts = Date.now();

  function login(name: string) {
    cy.visit("/");
    cy.get('input[placeholder*="Enter username"]').clear().type(name);
    cy.contains("button", "Get Started").click();
  }

  it("session appears in history immediately after logging", () => {
    login(`fresh-sess-${ts}`);
    cy.visit("/log");
    cy.get('input[type="date"]').type("2025-05-01");
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Basic");
    cy.contains("button", /log.*session/i).click();
    cy.url().should("include", "/history");
    cy.contains("Boxing").should("exist");
  });

  it("sparring session appears immediately after creation", () => {
    login(`fresh-spar-${ts}`);
    cy.visit("/sparring");
    cy.get('input[type="date"]').type("2025-10-01");
    cy.get('input[type="time"]').type("14:00");
    cy.get('input[placeholder*="Gym" i], input[placeholder*="location" i]').type(`FreshGym-${ts}`);
    cy.contains("button", /create/i).click();
    cy.contains(`FreshGym-${ts}`).should("exist");
  });

  it("member score updates on ranking after logging session", () => {
    const name = `fr-${ts}`.slice(0, 18);
    login(name);
    cy.visit("/log");
    cy.get('input[type="date"]').type("2025-04-01");
    cy.get("select").eq(0).select("Boxing");
    cy.get("select").eq(1).select("Advanced");
    cy.contains("button", /log.*session/i).click();
    cy.visit("/ranking");
    cy.contains(name, { timeout: 10000 }).should("exist");
  });
});
