document.addEventListener("DOMContentLoaded", () => {
  // --- Theme Switcher (High-Contrast Dark / Light) ---
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("smartpark-theme") || "dark";

  if (savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const nextTheme = isLight ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("smartpark-theme", nextTheme);
      localStorage.setItem("smartpark_theme", nextTheme);
      if (typeof showToast === "function") {
        showToast(`Theme: ${nextTheme === "dark" ? "Modern Dark" : "Clean Light"}`);
      }
    });
  }

  // --- Password Visibility Toggle ---
  const togglePasswordBtn = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");

      const eyeShow = togglePasswordBtn.querySelector(".eye-show");
      const eyeHide = togglePasswordBtn.querySelector(".eye-hide");
      if (eyeShow && eyeHide) {
        eyeShow.style.display = isPassword ? "none" : "block";
        eyeHide.style.display = isPassword ? "block" : "none";
      }
      togglePasswordBtn.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  // --- Quick Demo Auto-fill Helper ---
  const demoFillBtn = document.getElementById("btn-demo-fill");
  if (demoFillBtn) {
    demoFillBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("email");
      if (emailInput && passwordInput) {
        emailInput.value = "user@smartpark.ai";
        passwordInput.value = "password123";
        showToast("Demo driver credentials filled!");
        emailInput.focus();
      }
    });
  }

  // --- Form Submissions ---
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const submitBtn = document.getElementById("submit-btn");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "").trim();

      if (!email || !password) {
        showToast("Please enter both email and password.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>Signing in...</span>";
      }

      try {
        const result = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (result.token) {
          localStorage.setItem("smartpark_token", result.token);
        }

        sessionStorage.setItem(
          "smartpark-user",
          JSON.stringify(result.user || { email, name: email.split("@")[0] })
        );
        showToast("Login successful! Redirecting...");
        setTimeout(() => {
          location.href = "dashboard.html";
        }, 500);
      } catch (error) {
        console.error("Backend login error:", error);
        // Strictly reject invalid credentials - Never allow login without registering in MongoDB!
        const errorMsg = error.message || "Invalid email or password. Please register an account first.";
        showToast(errorMsg);
        
        // Render visible error banner on the login card
        let errBanner = document.getElementById("auth-error-banner");
        if (!errBanner) {
          errBanner = document.createElement("div");
          errBanner.id = "auth-error-banner";
          errBanner.className = "alert alert-error";
          errBanner.style.cssText = "background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.885rem; font-weight: 600;";
          loginForm.prepend(errBanner);
        }
        errBanner.textContent = "Authentication Error: " + errorMsg;
        return;
      } finally {
        if (submitBtn) {
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "<span>Sign in →</span>";
          }, 1000);
        }
      }
    });
  }

  // --- 7-Field Registration Form Handler ---
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(registerForm);
      const fullName = String(formData.get("fullName") || formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim().toLowerCase();
      const phone = String(formData.get("phone") || formData.get("phoneNumber") || "").trim();
      const vehicleNumber = String(formData.get("vehicleNumber") || "").trim().toUpperCase();
      const rfid = String(formData.get("rfid") || formData.get("rfidNumber") || "").trim().toUpperCase();
      const password = String(formData.get("password") || "").trim();
      const confirmPassword = String(formData.get("confirmPassword") || "").trim();

      // Client-side validations for all 7 mandatory fields
      if (!fullName || !email || !phone || !vehicleNumber || !rfid || !password || !confirmPassword) {
        showToast("Please fill in all 7 mandatory fields.");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match. Please verify your password.");
        return;
      }

      if (password.length < 6) {
        showToast("Password must be at least 6 characters long.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span>Creating account...</span>";
      }

      try {
        const result = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName,
            email,
            phone,
            vehicleNumber,
            rfid,
            password,
            confirmPassword,
          }),
        });

        if (result.token) {
          localStorage.setItem("smartpark_token", result.token);
        }

        showToast(result.message || "Account created successfully! Redirecting...");
        setTimeout(() => {
          location.href = "login.html";
        }, 800);
      } catch (error) {
        console.error("Backend register error:", error);
        showToast(error.message || "Registration failed. Please check your details.");
      } finally {
        if (submitBtn) {
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "<span>Create Account →</span>";
          }, 1000);
        }
      }
    });
  }

  // --- Logout handling ---
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest("/auth/logout", { method: "POST" });
      } catch (error) {
        console.warn("Backend logout unavailable.", error);
      }

      localStorage.removeItem("smartpark_token");
      sessionStorage.removeItem("smartpark-user");
      location.href = "login.html";
    });
  });
});
