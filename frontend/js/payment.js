document.addEventListener("DOMContentLoaded", () => {
  const paymentForm = document.getElementById("payment-form");

  if (!paymentForm) return;

  paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const bookingText = sessionStorage.getItem("smartpark-pending-booking");

    if (!bookingText) {
      showToast("No pending booking was found.");
      return;
    }

    const booking = JSON.parse(bookingText);

    try {
      const result = await apiRequest("/payments/simulate", {
        method: "POST",
        body: JSON.stringify({
          bookingId: booking._id || booking.id,
        }),
      });

      sessionStorage.setItem("smartpark-confirmation", JSON.stringify(result));

      location.href = "confirmation.html";
    } catch (error) {
      showToast("Payment simulation requires the backend.");
      console.error(error);
    }
  });
});
