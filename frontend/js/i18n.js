/**
 * ==========================================
 * SMARTPARK AI — CENTRALIZED I18N DICTIONARY
 * Comprehensive English & Tamil Translations
 * ==========================================
 */

const I18N_DICTIONARY = {
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_bookslot: "Book Slot",
    nav_extendtimer: "Extend Timer",
    nav_nearbylocations: "Nearby Locations",
    nav_mybookings: "My Bookings",
    nav_parkingtimer: "Parking Timer",
    nav_notifications: "Notifications",
    nav_profile: "My Profile",
    nav_gatesimulation: "Gate Simulation",
    nav_admin: "Administration",
    nav_signout: "Sign Out",

    // Toolbar
    tb_profile: "Profile",
    tb_language: "Language",
    tb_appearance: "Appearance",
    tb_notifications: "Notifications",
    tb_light: "Light",
    tb_dark: "Dark",
    tb_system: "System",
    tb_mark_read: "Mark all read",
    tb_no_notifications: "No unread notifications",

    // Dashboard
    dash_eyebrow: "SMARTPARK OVERVIEW",
    dash_welcome: "Welcome back",
    dash_subtitle: "Real-time AI parking telemetry, barrier synchronization, and active countdowns.",
    dash_active_session: "Active Parking Session",
    dash_no_active: "No active parking session currently running.",
    dash_reserve_now: "Reserve a Slot Now →",
    dash_location: "Parking Location",
    dash_slot: "Slot Number",
    dash_status: "Booking Status",
    dash_payment: "Payment Status",
    dash_timer: "Parking Timer",
    dash_end_time: "Expected End Time",
    dash_fee: "Current Fee",
    dash_recent_history: "Recent Booking History",
    dash_view_all_history: "View All Bookings →",
    dash_nearby_quick: "Nearby Facilities",
    dash_code: "Pass Code",

    // Status Badges
    status_confirmed: "Confirmed",
    status_active: "Active Parked",
    status_completed: "Completed",
    status_cancelled: "Cancelled",
    status_paid: "Paid",
    status_pending: "Pending",
    status_refunded: "Refunded",

    // Slot Legend
    slot_free: "Free (Available)",
    slot_reserved: "Reserved",
    slot_occupied: "Booked / Occupied",
    slot_selected: "Selected",

    // Book Slot Page
    book_title: "Reserve a Parking Space",
    book_subtitle: "Select a facility like VS Mall, choose your preferred slot, and finalize payment.",
    book_select_facility: "Select Parking Facility",
    book_start_time: "Start Time",
    book_duration: "Duration (Hours)",
    book_summary: "Booking Summary",
    book_hourly_rate: "Hourly Rate",
    book_total_amount: "Total Amount",
    book_proceed_payment: "Proceed to Payment →",
    book_slot_prompt: "Please select an available green slot on the layout.",

    // Nearby Page
    nearby_title: "Nearby Parking Facilities",
    nearby_subtitle: "GPS discovery based on your real browser location with accurate distance calculation.",
    nearby_detect_btn: "Find Spaces Near Me",
    nearby_requesting_gps: "Acquiring GPS coordinates...",
    nearby_permission_denied: "Location access was denied. Please allow location access or browse facilities below.",
    nearby_retry_btn: "Retry Geolocation",
    nearby_distance: "Distance",
    nearby_rate: "Hourly Fee",
    nearby_total_slots: "Total Slots",
    nearby_free_slots: "Free Slots",
    nearby_reserved_slots: "Reserved",
    nearby_occupied_slots: "Occupied",
    nearby_book_action: "Book Slot",

    // Extend Timer Page
    extend_title: "Extend Parking Session",
    extend_subtitle: "Add additional hours to your active reservation before it expires.",
    extend_active_card: "Current Active Session",
    extend_choose_hours: "Choose Additional Duration",
    extend_add_1: "+1 Hour",
    extend_add_2: "+2 Hours",
    extend_add_3: "+3 Hours",
    extend_calc_fee: "Additional Fee",
    extend_btn: "Pay & Extend Timer →",
    extend_no_session: "You have no active session to extend.",

    // Profile Page
    prof_title: "Driver Profile & Security",
    prof_subtitle: "Manage your contact info, registered RFID tag, and change password.",
    prof_personal: "Personal Details",
    prof_fullname: "Full Name",
    prof_email: "Email Address",
    prof_phone: "Phone Number",
    prof_vehicle_rfid: "Vehicle & RFID Credentials",
    prof_vehicle_num: "Vehicle Registration Plate",
    prof_rfid_num: "RFID Card / Tag Identifier",
    prof_save_btn: "Save Profile",
    prof_password_manage: "Password Management",
    prof_curr_password: "Current Password",
    prof_new_password: "New Password",
    prof_confirm_new_password: "Confirm New Password",
    prof_update_password_btn: "Update Password",

    // Gate Simulation
    gate_title: "Smart Barrier Gate & IoT Sensor Hub",
    gate_subtitle: "Hardware simulator for ESP32, RFID scans, ANPR license plate recognition, and ultrasonic sensors.",
    gate_simulate_btn: "Authorize Gate Access",
    gate_barrier_closed: "BARRIER CLOSED",
    gate_barrier_open: "BARRIER OPEN",
    gate_entry_action: "Vehicle Entry (Arrival & Park)",
    gate_exit_action: "Vehicle Exit (Checkout & Space Clear)",

    // General
    btn_cancel: "Cancel",
    btn_save: "Save",
    btn_close: "Close",
    loading: "Loading...",
  },
  ta: {
    // Navigation
    nav_dashboard: "முகப்பு பலகை",
    nav_bookslot: "இடம் முன்பதிவு",
    nav_extendtimer: "நேர நீட்டிப்பு",
    nav_nearbylocations: "அருகிலுள்ள பார்க்கிங்",
    nav_mybookings: "எனது முன்பதிவுகள்",
    nav_parkingtimer: "பார்க்கிங் டைமர்",
    nav_notifications: "அறிவிப்புகள்",
    nav_profile: "சுயவிவரம்",
    nav_gatesimulation: "கேட் உருவகப்படுத்துதல்",
    nav_admin: "நிர்வாகம்",
    nav_signout: "வெளியேறு",

    // Toolbar
    tb_profile: "சுயவிவரம்",
    tb_language: "மொழி",
    tb_appearance: "தோற்றம்",
    tb_notifications: "அறிவிப்புகள்",
    tb_light: "வெளிச்சம்",
    tb_dark: "இருள்",
    tb_system: "இயல்பு",
    tb_mark_read: "அனைத்தையும் படித்ததாகக் குறி",
    tb_no_notifications: "புதிய அறிவிப்புகள் இல்லை",

    // Dashboard
    dash_eyebrow: "SMARTPARK கண்ணோட்டம்",
    dash_welcome: "மீண்டும் வருக",
    dash_subtitle: "நிகழ்நேர AI பார்க்கிங் மேலாண்மை, கேட் ஒத்திசைவு மற்றும் நேர கண்காணிப்பு.",
    dash_active_session: "தற்போதைய பார்க்கிங் அமர்வு",
    dash_no_active: "தற்போது எந்த பார்க்கிங் அமர்வும் செயல்பாட்டில் இல்லை.",
    dash_reserve_now: "இப்போது இடம் பதிவு செய்யவும் →",
    dash_location: "பார்க்கிங் இடம்",
    dash_slot: "இட எண்",
    dash_status: "முன்பதிவு நிலை",
    dash_payment: "கட்டண நிலை",
    dash_timer: "பார்க்கிங் டைமர்",
    dash_end_time: "முடிவு நேரம்",
    dash_fee: "நடப்பு கட்டணம்",
    dash_recent_history: "சமீபத்திய முன்பதிவு வரலாறு",
    dash_view_all_history: "அனைத்து முன்பதிவுகளையும் காண்க →",
    dash_nearby_quick: "அருகிலுள்ள வளாகங்கள்",
    dash_code: "பாஸ் குறியீடு",

    // Status Badges
    status_confirmed: "உறுதியானது",
    status_active: "பார்க்கிங் செய்யப்பட்டுள்ளது",
    status_completed: "நிறைவடைந்தது",
    status_cancelled: "ரத்து செய்யப்பட்டது",
    status_paid: "செலுத்தப்பட்டது",
    status_pending: "நிலுவையில்",
    status_refunded: "ரீஃபண்ட் செய்யப்பட்டது",

    // Slot Legend
    slot_free: "காலி (பச்சை)",
    slot_reserved: "முன்பதிவு (மஞ்சள்)",
    slot_occupied: "நிரம்பியது (சிவப்பு)",
    slot_selected: "தேர்ந்தெடுக்கப்பட்டது",

    // Book Slot Page
    book_title: "பார்க்கிங் இடம் பதிவு செய்தல்",
    book_subtitle: "வி.எஸ் மால் போன்ற வளாகத்தைத் தேர்ந்தெடுத்து, விரும்பிய இடத்தை முன்பதிவு செய்யவும்.",
    book_select_facility: "பார்க்கிங் வளாகத்தைத் தேர்ந்தெடுக்கவும்",
    book_start_time: "தொடங்கும் நேரம்",
    book_duration: "கால அளவு (மணிநேரம்)",
    book_summary: "முன்பதிவு சுருக்கம்",
    book_hourly_rate: "மணிநேரக் கட்டணம்",
    book_total_amount: "மொத்தக் கட்டணம்",
    book_proceed_payment: "கட்டணம் செலுத்த தொடரவும் →",
    book_slot_prompt: "வரைபடத்தில் உள்ள பச்சை நிற காலி இடத்தை தேர்ந்தெடுக்கவும்.",

    // Nearby Page
    nearby_title: "அருகிலுள்ள பார்க்கிங் வளாகங்கள்",
    nearby_subtitle: "உங்கள் ஜிபிஎஸ் இருப்பிடத்தின் அடிப்படையில் தூரக் கணக்கீடு.",
    nearby_detect_btn: "என் அருகில் உள்ள இடங்களைக் காண்க",
    nearby_requesting_gps: "ஜிபிஎஸ் இருப்பிடம் கண்டறியப்படுகிறது...",
    nearby_permission_denied: "இருப்பிட அனுமதி மறுக்கப்பட்டது. கீழே உள்ள பட்டியலை உலாவவும்.",
    nearby_retry_btn: "மீண்டும் முயற்சிக்கவும்",
    nearby_distance: "தூரம்",
    nearby_rate: "கட்டணம்/மணி",
    nearby_total_slots: "மொத்த இடங்கள்",
    nearby_free_slots: "காலி இடங்கள்",
    nearby_reserved_slots: "முன்பதிவு",
    nearby_occupied_slots: "நிரம்பியவை",
    nearby_book_action: "முன்பதிவு செய்",

    // Extend Timer Page
    extend_title: "பார்க்கிங் நேர நீட்டிப்பு",
    extend_subtitle: "நேரம் முடிவதற்குள் உங்கள் பார்க்கிங் அமர்வுக்கு கூடுதல் மணிநேரங்களை சேர்க்கவும்.",
    extend_active_card: "தற்போதைய பார்க்கிங் அமர்வு",
    extend_choose_hours: "கூடுதல் கால அளவைத் தேர்வுசெய்க",
    extend_add_1: "+1 மணிநேரம்",
    extend_add_2: "+2 மணிநேரம்",
    extend_add_3: "+3 மணிநேரம்",
    extend_calc_fee: "கூடுதல் கட்டணம்",
    extend_btn: "செலுத்தி நேரத்தை நீட்டிக்கவும் →",
    extend_no_session: "நீட்டிக்க தீவிர அமர்வு ஏதுமில்லை.",

    // Profile Page
    prof_title: "சுயவிவரம் மற்றும் பாதுகாப்பு",
    prof_subtitle: "உங்கள் விவரங்கள், RFID அட்டை மற்றும் கடவுச்சொல்லை நிர்வகிக்கவும்.",
    prof_personal: "தனிப்பட்ட விவரங்கள்",
    prof_fullname: "முழு பெயர்",
    prof_email: "மின்னஞ்சல் முகவரி",
    prof_phone: "தொலைபேசி எண்",
    prof_vehicle_rfid: "வாகன மற்றும் RFID விவரங்கள்",
    prof_vehicle_num: "வாகன பதிவு எண்",
    prof_rfid_num: "RFID அட்டை எண்",
    prof_save_btn: "விவரங்களை சேமிக்கவும்",
    prof_password_manage: "கடவுச்சொல் மேலாண்மை",
    prof_curr_password: "தற்போதைய கடவுச்சொல்",
    prof_new_password: "புதிய கடவுச்சொல்",
    prof_confirm_new_password: "புதிய கடவுச்சொல்லை உறுதிசெய்",
    prof_update_password_btn: "கடவுச்சொல்லை மாற்று",

    // Gate Simulation
    gate_title: "ஸ்மார்ட் கேட் மற்றும் சென்சார் மையம்",
    gate_subtitle: "ESP32, RFID பாஸ், ANPR கேமரா மற்றும் அல்ட்ராசோனிக் சென்சார்களுக்கான வன்பொருள் உருவகப்படுத்துதல்.",
    gate_simulate_btn: "கேட் திறக்க அனுமதி கோருக",
    gate_barrier_closed: "கேட் மூடப்பட்டுள்ளது",
    gate_barrier_open: "கேட் திறக்கப்பட்டுள்ளது",
    gate_entry_action: "வாகன நுழைவு (வருகை & நிறுத்துதல்)",
    gate_exit_action: "வாகன வெளியேறுதல் (முடிவு & இடம் விடுவிப்பு)",

    // General
    btn_cancel: "ரத்து செய்",
    btn_save: "சேமி",
    btn_close: "மூடு",
    loading: "ஏற்றப்படுகிறது...",
  },
};

/**
 * Get active language from localStorage
 */
function getCurrentLanguage() {
  return localStorage.getItem('smartpark_lang') || 'en';
}

/**
 * Translation helper
 */
function t(key, defaultVal = '') {
  const lang = getCurrentLanguage();
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY.en;
  return dict[key] || I18N_DICTIONARY.en[key] || defaultVal || key;
}

/**
 * Change language and re-apply across DOM
 */
function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'ta') lang = 'en';
  localStorage.setItem('smartpark_lang', lang);
  document.documentElement.setAttribute('lang', lang);
  applyTranslations();

  // Dispatch global custom event for other scripts to re-render dynamic content
  window.dispatchEvent(new CustomEvent('smartpark:language-changed', { detail: { lang } }));
}

/**
 * Automatically translate all DOM elements with data-i18n attribute
 */
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || el.type === 'password' || el.type === 'tel')) {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    }
  });

  // Update active language indicator in topbar if present
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = getCurrentLanguage();
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = getCurrentLanguage();
  document.documentElement.setAttribute('lang', currentLang);
  applyTranslations();
});
