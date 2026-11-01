document.addEventListener("DOMContentLoaded", async () => {
  const parkingContainer = document.getElementById("parking-list");

  if (!parkingContainer) return;

  try {
    const data = await apiRequest("/parking");
    const locations = Array.isArray(data) ? data : data.locations || [];

    if (locations.length === 0) {
      parkingContainer.innerHTML =
        '<p class="muted">No parking locations are currently available.</p>';
      return;
    }

    parkingContainer.innerHTML = locations
      .map(
        (location) => `
      <article class="card">
        <h3>${escapeHTML(location.name || "Parking location")}</h3>
        <p>${escapeHTML(location.address || "Address unavailable")}</p>
        <p>Available slots: ${Number(location.availableSlots || 0)}</p>
        <a class="btn btn-primary"
           href="parking-details.html?id=${encodeURIComponent(location._id || location.id || "")}">
           View parking
        </a>
      </article>
    `,
      )
      .join("");
  } catch (error) {
    console.warn("Parking API is not connected yet.", error);
    parkingContainer.innerHTML =
      '<p class="muted">Parking data will appear when the backend is connected.</p>';
  }
});

function escapeHTML(value) {
  return String(value).replace(
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
