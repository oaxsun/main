(() => {
  const termBody = document.getElementById("termBody");
  const input = document.getElementById("cmd");
  const termInput = document.getElementById("termInput");
  const suggest = document.getElementById("suggest");
  if (!termBody || !input || !termInput || !suggest) return;

  const clientLogos = [
    { src: "assets/clients/1.webp", alt: "Volvo" },
    { src: "assets/clients/2.webp", alt: "Nautica Home" },
    { src: "assets/clients/3.webp", alt: "Häcker" },
    { src: "assets/clients/4.webp", alt: "Ron Barajima" },
    { src: "assets/clients/5.webp", alt: "nika" },
    { src: "assets/clients/6.webp", alt: "ixina German kitchens" },
    { src: "assets/clients/7.webp", alt: "Elastómeros Cordaza" },
    { src: "assets/clients/8.webp", alt: "PLAPERS" }
  ];

  const solutionCopy = {
    "WEB SYSTEMS": {
      value: "Launch faster. Convert better. Scale without rebuilding.",
      cta: "Discuss a web project"
    },
    "SOFTWARE & APPS": {
      value: "Turn operational needs into software built around your business.",
      cta: "Build a custom system"
    },
    "BUSINESS INFRASTRUCTURE": {
      value: "Create the technical foundation your products and operations can rely on.",
      cta: "Plan your infrastructure"
    },
    "AUTOMATION & AI": {
      value: "Remove repetitive work and connect AI to real business processes.",
      cta: "Find automation opportunities"
    },
    "DIGITAL GROWTH": {
      value: "Make the systems you already have faster, easier to find and easier to measure.",
      cta: "Improve digital performance"
    }
  };

  function runContactCommand() {
    termInput.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    const contactItem = [...suggest.querySelectorAll(".item")].find(item => item.textContent.trim().toLowerCase() === "/contact");
    if (contactItem) {
      contactItem.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      return;
    }

    input.removeAttribute("readonly");
    input.value = "contact";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
  }

  function enhanceSolutions() {
    const grid = termBody.querySelector(".sol-grid");
    if (!grid || grid.dataset.enhanced === "true") return;

    grid.dataset.enhanced = "true";

    [...grid.querySelectorAll(".sol-card")].forEach(card => {
      const title = card.querySelector(".sol-title")?.textContent?.trim();
      const config = solutionCopy[title];
      if (!config) return;

      const value = document.createElement("div");
      value.className = "sol-value";
      value.textContent = config.value;

      const body = card.querySelector(".sol-body");
      if (body) card.insertBefore(value, body);
      else card.appendChild(value);

      const link = document.createElement("button");
      link.type = "button";
      link.className = "sol-link";
      link.innerHTML = `${config.cta} <span>→</span>`;
      link.addEventListener("click", runContactCommand);
      card.appendChild(link);
    });

    const oldCta = grid.parentElement?.querySelector(".sol-cmd");
    if (oldCta) oldCta.remove();

    const cta = document.createElement("div");
    cta.className = "solutions-cta";
    cta.innerHTML = `
      <div>
        <span class="solutions-cta-label">READY TO BUILD?</span>
        <strong>Have something worth building?</strong>
        <span>Tell us the problem, idea or process you want to improve. We will help define the right technical path.</span>
      </div>
      <button class="solutions-cta-btn" type="button">Start a project <span>→</span></button>
    `;
    cta.querySelector("button")?.addEventListener("click", runContactCommand);
    grid.insertAdjacentElement("afterend", cta);
  }

  function enhanceClients() {
    const marquee = termBody.querySelector(".clients-marquee");
    if (!marquee || marquee.dataset.enhanced === "true") return;

    marquee.dataset.enhanced = "true";
    const logos = clientLogos.concat(clientLogos).map((logo, index) => `
      <div class="client-brand-logo" ${index >= clientLogos.length ? 'aria-hidden="true"' : ''}>
        <img src="${logo.src}" alt="${index < clientLogos.length ? logo.alt : ''}" loading="lazy">
      </div>
    `).join("");

    marquee.innerHTML = `<div class="clients-track clients-track-real">${logos}</div>`;
  }

  function applyEnhancements() {
    enhanceSolutions();
    enhanceClients();
  }

  const observer = new MutationObserver(applyEnhancements);
  observer.observe(termBody, { childList: true, subtree: true });
  applyEnhancements();
})();
