/**
 * ==========================================
 * SMARTPARK AI — PAYMENT CONTROLLER
 * Gateway Simulation & Server-Side Verification
 * ==========================================
 */

document.addEventListener('DOMContentLoaded', () => {
  let pendingBooking = null;

  try {
    const raw = sessionStorage.getItem('smartpark-pending-booking') || sessionStorage.getItem('smartpark-confirmation');
    if (raw) {
      pendingBooking = JSON.parse(raw);
    }
  } catch (e) {}

  const facilityEl = document.getElementById('pay-facility-name');
  const slotEl = document.getElementById('pay-slot-number');
  const durationEl = document.getElementById('pay-duration');
  const totalEl = document.getElementById('pay-total-amount');
  const btnAmountEl = document.getElementById('btn-pay-amount');

  const amount = Number(pendingBooking?.totalFee || pendingBooking?.totalAmount || 12.0).toFixed(2);
  const slot = pendingBooking?.slotNumber || pendingBooking?.slot || 'A-05';
  const facility = pendingBooking?.locationName || pendingBooking?.parkingLocation?.name || 'VS Mall Parking Complex';
  const duration = pendingBooking?.durationHours || 2;

  if (facilityEl) facilityEl.textContent = facility;
  if (slotEl) slotEl.textContent = slot;
  if (durationEl) durationEl.textContent = `${duration} Hours`;
  if (totalEl) totalEl.textContent = `$${amount}`;
  if (btnAmountEl) btnAmountEl.textContent = `$${amount}`;

  const form = document.getElementById('payment-checkout-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-payment');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Connecting to Payment Gateway...';
      }

      try {
        const bookingId = pendingBooking?.bookingId || pendingBooking?._id || pendingBooking?.id || 'demo_booking';
        const method = document.getElementById('pay-method-select')?.value || 'card';

        // 1. Process simulated gateway checkout
        const receipt = await apiRequest('/payments/simulate', {
          method: 'POST',
          body: JSON.stringify({
            bookingId,
            amount: Number(amount),
            purpose: 'booking',
            paymentMethod: method,
          }),
        });

        // 2. Perform server-side token verification
        await apiRequest('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            transactionId: receipt.transactionId,
            expectedAmount: Number(amount),
          }),
        });

        const confData = {
          ...pendingBooking,
          accessCode: receipt.accessCode,
          transactionId: receipt.transactionId,
          totalFee: amount,
          paymentStatus: 'paid',
          locationName: facility,
          slotNumber: slot,
        };

        sessionStorage.setItem('smartpark-confirmation', JSON.stringify(confData));
        showToast('Payment verified successfully! Generating access pass...');

        setTimeout(() => {
          location.href = 'confirmation.html';
        }, 600);
      } catch (err) {
        console.error('[Payment Error]', err);
        showToast(err.message || 'Payment processing failed. Please retry.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Authorize Payment of $${amount} →`;
        }
      }
    });
  }
});
