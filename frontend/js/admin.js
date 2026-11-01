document.addEventListener("DOMContentLoaded", () => {
  const locationCount = document.getElementById("admin-location-count");
  const availableCount = document.getElementById("admin-available-count");
  const bookingCount = document.getElementById("admin-booking-count");
  const locationList = document.getElementById("admin-location-list");
  const eventsContainer = document.getElementById("admin-events");
  const message = document.getElementById("admin-message");
  const refreshButton = document.getElementById("refresh-admin");

  if (!locationList) return;

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

  async function loadAdminData() {
    if (message) message.textContent = "Loading administrative data...";

    try {
      const result = await apiRequest("/admin/overview");

      const locations = result.locations || [];
      const totalAvailable = locations.reduce(
        (total, location) => total + Number(location.availableSlots || 0),
        0,
      );

      if (locationCount) locationCount.textContent = locations.length;
      if (availableCount) availableCount.textContent = totalAvailable;
      if (bookingCount) {
        bookingCount.textContent = result.totalBookings ?? "—";
      }

      if (!locations.length) {
        locationList.innerHTML =
          '<p class="muted">No parking locations returned by the API.</p>';
      } else {
        locationList.innerHTML = locations
          .map(
            (location) => `
          <article class="activity-item">
            <div>
              <h3>${escapeHTML(location.name || "Parking location")}</h3>
              <p>${escapeHTML(location.address || "Address unavailable")}</p>
              <p class="muted small">
                Available slots: ${Number(location.availableSlots || 0)}
              </p>
            </div>
            <span class="badge">${escapeHTML(location.status || "Active")}</span>
          </article>
        `,
          )
          .join("");
      }

      const events = result.events || [];

      if (eventsContainer) {
        eventsContainer.innerHTML = events.length
          ? events
              .map(
                (event) => `
              <article class="activity-item">
                <div>
                  <h3>${escapeHTML(event.title || event.type || "System event")}</h3>
                  <p>${escapeHTML(event.message || "")}</p>
                </div>
                <span class="badge">${escapeHTML(event.status || "Recorded")}</span>
              </article>
            `,
              )
              .join("")
          : '<p class="muted">No recent events returned by the API.</p>';
      }

      if (message) {
        message.textContent = "Administrative data loaded successfully.";
      }
    } catch (error) {
      if (message) {
        message.textContent =
          "Admin data is unavailable. The backend must provide GET /admin/overview, and the user must have administrator permission.";
      }

      console.warn("Could not load admin data.", error);
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadAdminData);
  }

  loadAdminData();
});
