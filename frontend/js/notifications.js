document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("notification-list");
  const message = document.getElementById("notification-message");
  const markAllButton = document.getElementById("mark-all-read");

  if (!list) return;

  let notifications = [];

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

  function renderNotifications() {
    if (!notifications.length) {
      list.innerHTML = `
        <article class="activity-item">
          <div>
            <h3>No notifications</h3>
            <p class="muted">You're all caught up.</p>
          </div>
        </article>`;
      return;
    }

    list.innerHTML = notifications
      .map(
        (item, index) => `
      <article class="activity-item">
        <div>
          <h3>${escapeHTML(item.title || "SmartPark update")}</h3>
          <p>${escapeHTML(item.message || item.body || "")}</p>
          <p class="muted small">
            ${escapeHTML(
              item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Date unavailable",
            )}
          </p>
          <span class="badge">
            ${item.read ? "Read" : "Unread"}
          </span>
        </div>
        ${
          item.read
            ? ""
            : `
          <button class="btn btn-secondary"
            type="button" data-mark-read="${index}">
            Mark read
          </button>`
        }
      </article>
    `,
      )
      .join("");
  }

  async function loadNotifications() {
    try {
      const result = await apiRequest("/notifications");
      notifications = Array.isArray(result)
        ? result
        : result.notifications || [];

      renderNotifications();

      if (message) {
        message.textContent = "Notifications loaded from the backend.";
      }
    } catch (error) {
      if (message) {
        message.textContent =
          "Notifications API is not connected. Showing the page's initial preview.";
      }

      console.warn("Could not load notifications.", error);
    }
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-mark-read]");
    if (!button) return;

    const index = Number(button.dataset.markRead);
    const notification = notifications[index];

    if (!notification) return;

    const id = notification._id || notification.id;

    if (!id) {
      if (message) {
        message.textContent =
          "This notification has no backend ID, so it cannot be updated on the server.";
      }
      return;
    }

    try {
      await apiRequest(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
      });

      notification.read = true;
      renderNotifications();

      if (message) message.textContent = "Notification marked as read.";
    } catch (error) {
      if (message) {
        message.textContent =
          "Could not update the notification. Check the backend endpoint.";
      }
      console.error(error);
    }
  });

  if (markAllButton) {
    markAllButton.addEventListener("click", async () => {
      try {
        await apiRequest("/notifications/read-all", {
          method: "PATCH",
        });

        notifications = notifications.map((item) => ({
          ...item,
          read: true,
        }));

        renderNotifications();

        if (message) message.textContent = "All notifications marked as read.";
      } catch (error) {
        if (message) {
          message.textContent =
            "Bulk update requires the PATCH /notifications/read-all endpoint.";
        }
        console.error(error);
      }
    });
  }

  loadNotifications();
});
