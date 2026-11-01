document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("gate-form");
  const result = document.getElementById("gate-result");
  const eventsContainer = document.getElementById("gate-events");

  if (!form || !result || !eventsContainer) return;

  const events = [];

  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function renderEvents() {
    if (!events.length) {
      eventsContainer.innerHTML =
        '<p class="muted">No simulation events yet.</p>';
      return;
    }

    eventsContainer.innerHTML = events
      .map(
        (event) => `
      <article class="activity-item">
        <div>
          <h3>${escapeHTML(event.action)} event</h3>
          <p>Vehicle: ${escapeHTML(event.vehicleNumber)}</p>
          <p class="muted small">${escapeHTML(event.time)}</p>
        </div>
        <span class="badge">${escapeHTML(event.status)}</span>
      </article>
    `,
      )
      .join("");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const vehicleNumber = String(formData.get("vehicleNumber") || "")
      .trim()
      .toUpperCase();

    const action = String(formData.get("action") || "entry");

    if (!vehicleNumber) {
      showToast("Enter a demo vehicle registration.");
      return;
    }

    // This is an interface simulation, not actual access authorization.
    const simulationEvent = {
      vehicleNumber,
      action,
      time: new Date().toLocaleString(),
      status: "Simulated",
    };

    events.unshift(simulationEvent);

    result.innerHTML = `
      <span class="badge">Simulation complete</span>
      <h3>${escapeHTML(action === "entry" ? "Entry event" : "Exit event")}</h3>
      <p>Demo vehicle: ${escapeHTML(vehicleNumber)}</p>
      <p class="muted">No physical gate was operated and no real access decision was made.</p>
    `;

    renderEvents();
    showToast("Gate simulation event created.");

    // Later, this can be replaced with a backend event endpoint.
  });

  renderEvents();
});
