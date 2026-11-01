document.addEventListener("DOMContentLoaded", () => {
  const countdown = document.getElementById("parking-countdown");
  const status = document.getElementById("timer-status");
  const description = document.getElementById("timer-description");
  const demoButton = document.getElementById("start-demo-timer");

  if (!countdown) return;

  let intervalId = null;
  let endTime = null;

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function renderTime() {
    if (!endTime) return;

    const remaining = endTime - Date.now();

    if (remaining <= 0) {
      countdown.textContent = "00:00:00";
      status.textContent = "Parking session ended";
      description.textContent =
        "The timer has reached its end time. Check your booking status.";
      stopTimer();
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdown.textContent = [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }

  function startTimer(timestamp, label) {
    const parsedTime = new Date(timestamp).getTime();

    if (!Number.isFinite(parsedTime)) {
      status.textContent = "Invalid end time";
      description.textContent = "Please check the booking's end timestamp.";
      return;
    }

    endTime = parsedTime;
    status.textContent = label;
    stopTimer();
    renderTime();
    intervalId = setInterval(renderTime, 1000);
  }

  if (demoButton) {
    demoButton.addEventListener("click", () => {
      startTimer(Date.now() + 5 * 60 * 1000, "Demo timer running");
      description.textContent =
        "This five-minute countdown is a demonstration, not a real parking session.";
    });
  }

  // Try to read an end time from a booking saved by the application.
  try {
    const booking = JSON.parse(
      sessionStorage.getItem("smartpark-pending-booking") || "null",
    );

    if (booking && (booking.endTime || booking.endDateTime)) {
      startTimer(booking.endTime || booking.endDateTime, "Booking countdown");
      description.textContent =
        "Countdown is based on the saved booking end time.";
    }
  } catch (error) {
    console.warn("Could not read saved booking time.", error);
  }

  if (!endTime) {
    status.textContent = "No active session loaded";
    countdown.textContent = "--:--:--";
    description.textContent =
      "Load a confirmed booking end time or start the demo timer.";
  }
});
