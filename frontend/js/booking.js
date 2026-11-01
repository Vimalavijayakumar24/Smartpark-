document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("booking-form");

  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const slot = sessionStorage.getItem("smartpark-selected-slot");

    if (!slot) {
      showToast("Please select an available parking slot first.");
      return;
    }

    const formData = new FormData(bookingForm);

    const booking = {
      parkingId: new URLSearchParams(location.search).get("id"),
      slot,
      startTime: formData.get("startTime"),
      durationHours: Number(formData.get("durationHours")),
    };

    if (!booking.durationHours || booking.durationHours < 1) {
      showToast("Choose a valid parking duration.");
      return;
    }

    try {
      const result = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify(booking),
      });

      sessionStorage.setItem(
        "smartpark-pending-booking",
        JSON.stringify(result),
      );

      location.href = "payment.html";
    } catch (error) {
      showToast("Booking requires a working backend.");
      console.error(error);
    }
  });
});
