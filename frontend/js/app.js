// Display a small notification message.

function showToast(message) {
  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  clearTimeout(window.__smartparkToastTimer);

  window.__smartparkToastTimer = setTimeout(() => {
    toast.remove();
  }, 3600);
}

// Shared interactions.

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const menu = document.querySelector("[data-menu-toggle]");

  if (menu && sidebar) {
    menu.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Buttons that ask for confirmation.

  document.querySelectorAll("[data-confirm]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = button.dataset.confirm || "Continue?";

      if (confirm(message)) {
        location.href = button.dataset.href || "#";
      }
    });
  });
});

// Shared form handling for the profile and extension pages.

document.addEventListener("DOMContentLoaded", () => {
  ["extend-form", "profile-form", "vehicle-form"].forEach((id) => {
    const form = document.getElementById(id);

    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const endpoint =
        id === "extend-form"
          ? "/bookings/demo-booking/extend"
          : id === "profile-form"
            ? "/auth/me"
            : "/auth/me/vehicle";

      const method = id === "extend-form" ? "POST" : "PATCH";

      try {
        await apiRequest(endpoint, {
          method,
          body: JSON.stringify(
            Object.fromEntries(new FormData(form).entries()),
          ),
        });

        showToast("Update completed.");
      } catch (err) {
        showToast(
          "Preview form validated. Backend connection is not ready: " +
            err.message,
        );
      }
    });
  });
});
