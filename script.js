const cvLink = document.querySelector("#download-cv");
const contactForm = document.querySelector("#contact-form");
const formResult = document.querySelector("#form-result");
const submitButton = contactForm.querySelector(".submit-button");
const yearLabel = document.querySelector("#current-year");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const typewriter = document.querySelector(".typewriter");
const mobileMenuToggle = document.querySelector(".menu-toggle");
const mobileNavigation = document.querySelector("#mobile-navigation");
const mobileMenuClose = document.querySelector(".nav-close");
const mobileMenuQuery = window.matchMedia("(max-width: 768px)");

const setMobileMenuOpen = (open, restoreFocus = false) => {
  if (!mobileMenuToggle || !mobileNavigation) {
    return;
  }

  const isOpen = mobileMenuQuery.matches && open;
  mobileNavigation.classList.toggle("is-open", isOpen);
  mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  mobileNavigation.setAttribute("aria-hidden", String(mobileMenuQuery.matches && !isOpen));
  mobileNavigation.inert = mobileMenuQuery.matches && !isOpen;
  document.body.classList.toggle("mobile-nav-open", isOpen);

  if (isOpen) {
    mobileMenuClose?.focus();
  } else if (restoreFocus) {
    mobileMenuToggle.focus();
  }
};

if (mobileMenuToggle && mobileNavigation) {
  setMobileMenuOpen(false);
  mobileMenuToggle.addEventListener("click", () => {
    setMobileMenuOpen(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenuClose?.addEventListener("click", () => setMobileMenuOpen(false, true));
  window.addEventListener("resize", () => {
    if (!mobileMenuQuery.matches) {
      setMobileMenuOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenuToggle.getAttribute("aria-expanded") === "true") {
      setMobileMenuOpen(false, true);
    }
  });
}

if (yearLabel) {
  yearLabel.textContent = new Date().getFullYear();
}

const initializeTypewriter = () => {
  if (!typewriter) {
    return;
  }

  const roles = ["Product & Delivery Manager", "Game Producer", "Product Strategist"];

  if (reduceMotion) {
    typewriter.textContent = roles[0];
  } else {
    let roleIndex = 0;
    let characterIndex = 0;
    let deleting = false;

    const typeNextCharacter = () => {
      const currentRole = roles[roleIndex];
      characterIndex += deleting ? -1 : 1;
      typewriter.textContent = currentRole.slice(0, characterIndex);

      if (!deleting && characterIndex === currentRole.length) {
        deleting = true;
        window.setTimeout(typeNextCharacter, 1400);
        return;
      }

      if (deleting && characterIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        window.setTimeout(typeNextCharacter, 350);
        return;
      }

      window.setTimeout(typeNextCharacter, deleting ? 55 : 105);
    };

    typeNextCharacter();
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTypewriter, { once: true });
} else {
  initializeTypewriter();
}

document.querySelectorAll(".project-card").forEach((card) => {
  const visual = card.querySelector(".project-media");
  const video = card.querySelector(".project-media .project-video");

  if (!visual || !video) {
    console.warn("Skipping project card without project media or video:", card);
    return;
  }

  video.muted = true;
  let isActive = false;
  let playAttempt = 0;

  const playTrailer = () => {
    isActive = true;
    const currentAttempt = ++playAttempt;
    video.play().then(() => {
      if (currentAttempt !== playAttempt) {
        return;
      }

      if (isActive) {
        visual.classList.add("is-playing");
      } else {
        video.pause();
      }
    }).catch((error) => {
      if (currentAttempt === playAttempt) {
        visual.classList.remove("is-playing");
      }

      if (currentAttempt === playAttempt && error.name !== "AbortError" && isActive) {
        console.warn(`Unable to play ${card.dataset.project} trailer:`, error);
      }
    });
  };

  const stopTrailer = () => {
    playAttempt += 1;
    isActive = false;
    video.pause();
    video.currentTime = 0;
    visual.classList.remove("is-playing");
  };

  card.addEventListener("pointerenter", playTrailer);
  card.addEventListener("pointerleave", stopTrailer);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    if (link.closest("#mobile-navigation") && mobileMenuQuery.matches) {
      setMobileMenuOpen(false);
    }
    history.pushState(null, "", link.getAttribute("href"));
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

cvLink.addEventListener("click", () => {
  if (mobileMenuQuery.matches) {
    setMobileMenuOpen(false, true);
  }
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  formResult.hidden = false;
  formResult.textContent = "Sending...";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: new FormData(contactForm),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Web3Forms rejected the submission.");
    }

    contactForm.reset();
    formResult.textContent = "Thank you! Your message has been sent successfully.";
  } catch (error) {
    console.error("Contact form submission failed:", error);
    formResult.textContent = "Something went wrong. Please try again later.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send message";
  }
});
