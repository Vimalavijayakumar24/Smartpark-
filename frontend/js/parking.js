document.addEventListener("DOMContentLoaded", () => {
  const slotGrid = document.getElementById("slot-grid");

  if (slotGrid) {
    slotGrid.querySelectorAll("[data-slot]").forEach((slot) => {
      if (
        slot.classList.contains("occupied") ||
        slot.classList.contains("reserved") ||
        slot.disabled
      ) {
        return;
      }

      slot.addEventListener("click", () => {
        slotGrid.querySelectorAll("[data-slot]").forEach((item) => {
          item.classList.remove("selected");
          item.setAttribute("aria-pressed", "false");
        });

        slot.classList.add("selected");
        slot.setAttribute("aria-pressed", "true");

        sessionStorage.setItem("smartpark-selected-slot", slot.dataset.slot);
        showToast(`Slot ${slot.dataset.slot} selected.`);
      });
    });
  }

  const searchForm = document.getElementById("parking-search-form");

  if (searchForm) {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(searchForm);
      const query = String(formData.get("search") || "").trim();
      const results = document.getElementById("parking-results");

      if (!results) return;

      try {
        const data = await apiRequest(
          `/parking?search=${encodeURIComponent(query)}`,
        );

        const locations = Array.isArray(data) ? data : data.locations || [];

        results.innerHTML =
          locations
            .map(
              (location) => `
          <article class="card">
            <h3>${escapeParkingHTML(location.name || "Parking location")}</h3>
            <p>${escapeParkingHTML(location.address || "")}</p>
            <a class="btn btn-primary"
               href="parking-details.html?id=${encodeURIComponent(location._id || location.id || "")}">
               View details
            </a>
          </article>
        `,
            )
            .join("") || "<p>No matching locations found.</p>";
      } catch (error) {
        showToast("Search requires a working parking API.");
        console.error(error);
      }
    });
  }
});

function escapeParkingHTML(value) {
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
