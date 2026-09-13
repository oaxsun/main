(() => {
  const termBody = document.getElementById("termBody");
  const input = document.getElementById("cmd");
  const suggest = document.getElementById("suggest");
  const termInputEl = document.getElementById("termInput");
  const appEl = document.getElementById("app");
  const introEl = document.getElementById("intro");
  const introLoader = document.getElementById("introLoader");
  const introSplash = document.getElementById("introSplash");
  const enterBtn = document.getElementById("enterBtn");
  const introBar = document.getElementById("introBar");
  const introPct = document.getElementById("introPct");

  const COMMANDS = ["about", "solutions", "clients", "contact", "help"];
  const HIDDEN_COMMANDS = ["blog"];
  const ALL_COMMANDS = [...COMMANDS, ...HIDDEN_COMMANDS];

  const isTouch = window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const DESKTOP_HINT = "Press [space] to see commands.";
  const MOBILE_HINT = "Select a command";

  let activeIndex = -1;
  let currentMatches = [];
  let closeTimer = null;
  let busy = false;

  input.placeholder = isTouch ? MOBILE_HINT : DESKTOP_HINT;
  if (isTouch) {
    input.setAttribute("readonly", "");
    input.setAttribute("inputmode", "none");
  }

  const ASCII = {
    ABOUT: ` █████╗ ██████╗  ██████╗ ██╗   ██╗████████╗
██╔══██╗██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝
███████║██████╔╝██║   ██║██║   ██║   ██║
██╔══██║██╔══██╗██║   ██║██║   ██║   ██║
██║  ██║██████╔╝╚██████╔╝╚██████╔╝   ██║
╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝    ╚═╝`,
    SOLUTIONS: `███████╗ ██████╗ ██╗     ██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
██╔════╝██╔═══██╗██║     ██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
███████╗██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║███████╗
╚════██║██║   ██║██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║
███████║╚██████╔╝███████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║███████║
╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝`,
    CLIENTS: ` ██████╗██╗     ██╗███████╗███╗   ██╗████████╗███████╗
██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝██╔════╝
██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║   ███████╗
██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║   ╚════██║
╚██████╗███████╗██║███████╗██║ ╚████║   ██║   ███████║
 ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝`,
    CONTACT: ` ██████╗ ██████╗ ███╗   ██╗████████╗ █████╗  ██████╗████████╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔════╝╚══██╔══╝
██║     ██║   ██║██╔██╗ ██║   ██║   ███████║██║        ██║
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██║██║        ██║
╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╗   ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝   ╚═╝`,
    HELP: `██╗  ██╗███████╗██╗     ██████╗
██║  ██║██╔════╝██║     ██╔══██╗
███████║█████╗  ██║     ██████╔╝
██╔══██║██╔══╝  ██║     ██╔═══╝
██║  ██║███████╗███████╗██║
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝`,
    ERROR: `███████╗██████╗ ██████╗  ██████╗ ██████╗
██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
█████╗  ██████╔╝██████╔╝██║   ██║██████╔╝
██╔══╝  ██╔══██╗██╔══██╗██║   ██║██╔══██╗
███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝`
  };

  function escapeHtml(s) {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function scrollToBottom() { termBody.scrollTop = termBody.scrollHeight; }

  function line(html, cls = "line") {
    const el = document.createElement("div");
    el.className = cls;
    el.innerHTML = html;
    termBody.appendChild(el);
    scrollToBottom();
    return el;
  }

  function blockContainer() {
    const el = document.createElement("div");
    el.className = "block fax";
    termBody.appendChild(el);
    scrollToBottom();
    return el;
  }

  function asciiTitle(name) {
    const art = ASCII[name.toUpperCase()] || ASCII.ERROR;
    return `<pre class="section-ascii">${escapeHtml(art)}</pre>`;
  }

  function echoCommand(cmd) {
    line(`<span class="accent">&gt;</span> ${escapeHtml(cmd)}`);
  }

  function openSuggest(matches) {
    currentMatches = matches;
    activeIndex = matches.length ? 0 : -1;
    suggest.innerHTML = "";

    matches.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "item" + (i === activeIndex ? " active" : "");
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      item.innerHTML = `<span>/${escapeHtml(c)}</span>`;
      item.addEventListener("pointerdown", e => {
        e.preventDefault();
        submit(c);
      });
      suggest.appendChild(item);
    });

    suggest.classList.toggle("open", matches.length > 0);
  }

  function closeSuggestSoon() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => suggest.classList.remove("open"), 120);
  }

  function setActive(i) {
    if (!currentMatches.length) return;
    activeIndex = (i + currentMatches.length) % currentMatches.length;
    [...suggest.querySelectorAll(".item")].forEach((el, idx) => {
      el.classList.toggle("active", idx === activeIndex);
      el.setAttribute("aria-selected", idx === activeIndex ? "true" : "false");
    });
  }

  function refreshSuggest() {
    const v = input.value.trim().toLowerCase();
    const matches = v ? COMMANDS.filter(c => c.startsWith(v)) : [...COMMANDS];
    openSuggest(matches);
  }

  function disableInput(disabled) {
    busy = disabled;
    input.disabled = disabled;
    if (disabled) input.blur();
  }

  function renderBar(pct, width) {
    const filled = Math.round((pct / 100) * width);
    return "[" + "█".repeat(filled) + "░".repeat(Math.max(0, width - filled)) + "]";
  }

  function loaderBarWidth() { return isTouch ? 10 : 18; }

  async function runIntroLoader(label = "initializing", ms = 1100) {
    if (!introLoader) return;
    const spans = introLoader.querySelectorAll(".label");
    if (spans[2]) spans[2].textContent = ` ${label} `;
    introLoader.style.display = "grid";
    introSplash.style.display = "none";

    const width = window.matchMedia?.("(max-width: 520px)").matches ? 12 : 18;
    const started = performance.now();

    await new Promise(resolve => {
      function frame(now) {
        const pct = Math.min(100, Math.round(((now - started) / ms) * 100));
        introBar.textContent = renderBar(pct, width);
        introPct.textContent = pct + "%";
        if (pct >= 100) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });

    await wait(180);
  }

  function introParallaxBind() {
    if (!introEl || !introSplash || !window.matchMedia?.("(pointer: fine)").matches) return;
    window.addEventListener("pointermove", e => {
      if (introEl.style.display === "none") return;
      const rect = introSplash.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);
      introSplash.style.setProperty("--introTX", (-dx * 3).toFixed(2) + "deg");
      introSplash.style.setProperty("--introTY", (-dy * 2.2).toFixed(2) + "deg");
    }, { passive: true });
  }

  async function showSplash() {
    introLoader.style.display = "none";
    introSplash.style.display = "block";
    introSplash.setAttribute("aria-hidden", "false");
  }

  async function enterApp() {
    enterBtn.style.pointerEvents = "none";
    enterBtn.style.opacity = "0.7";
    await runIntroLoader("loading console", 850);
    introEl.style.display = "none";
    appEl.style.opacity = "1";
    appEl.style.pointerEvents = "auto";
    await boot();
  }

  function showRetroLoader(taskLabel) {
    const wrap = document.createElement("div");
    wrap.className = "loader";
    wrap.innerHTML = `<span class="label dim">·</span><span class="label">sys</span><span class="label"> ${escapeHtml(taskLabel)} </span><span class="bar">${renderBar(0, loaderBarWidth())}</span><span class="pct dim">0%</span>`;
    termBody.appendChild(wrap);
    scrollToBottom();
    return { wrap, barEl: wrap.querySelector(".bar"), pctEl: wrap.querySelector(".pct") };
  }

  async function runWithLoader(taskLabel, ms = 700) {
    disableInput(true);
    const { wrap, barEl, pctEl } = showRetroLoader(taskLabel);
    const started = performance.now();

    await new Promise(resolve => {
      function frame(now) {
        const pct = Math.min(100, Math.round(((now - started) / ms) * 100));
        barEl.textContent = renderBar(pct, loaderBarWidth());
        pctEl.textContent = pct + "%";
        scrollToBottom();
        if (pct >= 100) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });

    await wait(120);
    wrap.remove();
    disableInput(false);
  }

  async function faxPrint(cmd, titleKey, linesArr) {
    await runWithLoader(`switch ${cmd} app`, 720);
    const box = blockContainer();
    box.insertAdjacentHTML("beforeend", asciiTitle(titleKey));
    let delay = 50;
    for (const html of linesArr) {
      const ln = document.createElement("div");
      ln.className = "line fax-line";
      ln.style.animationDelay = delay + "ms";
      ln.innerHTML = html;
      box.appendChild(ln);
      delay += 80;
    }
    scrollToBottom();
  }

  async function boot() {
    termBody.innerHTML = "";
    line(`<span class="dim">Booting OAXSUN TECHNOLOGIES...</span>`);
    await wait(420);
    line(`<span class="dim">Loading digital systems layer...</span>`);
    await wait(420);
    line(`<span class="dim">Connection successful</span>`);
    await wait(280);

    const box = blockContainer();
    box.innerHTML = `
      <div class="hero-console-kicker">OAXSUN TECHNOLOGIES</div>
      <div class="hero-console-title">Digital systems engineered for growth.</div>
      <div class="hero-console-copy">We design and build web platforms, applications, business systems and custom technology that help companies operate better, scale faster and create new digital capabilities.</div>
      <div class="line">&nbsp;</div>
      <div class="line dim">Available commands:</div>
      <div class="line"><span class="accent">/about</span> <span class="accent">/solutions</span> <span class="accent">/clients</span> <span class="accent">/contact</span> <span class="accent">/help</span></div>
      <div class="line">&nbsp;</div>
      <div class="line dim">Enter a command to continue. . .</div>`;
    scrollToBottom();
  }

  async function respond(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase().replace(/^\//, "");
    if (!cmd) return;

    if (cmd === "blog") {
      echoCommand(cmd);
      await runWithLoader("opening knowledge base", 520);
      window.location.href = "/blog/";
      return;
    }

    if (!COMMANDS.includes(cmd)) {
      await faxPrint(cmd, "ERROR", [
        `<span class="accent">Command not found:</span> <span class="dim">${escapeHtml(cmd)}</span>`,
        `<span class="dim">Type</span> <span class="accent">help</span> <span class="dim">to view available commands.</span>`
      ]);
      return;
    }

    switch (cmd) {
      case "about":
        await faxPrint("about", "ABOUT", [
          `<span class="dim">We are</span> <span class="accent">Oaxsun Technologies</span><span class="dim">, a technology studio founded in Toronto, Canada.</span>`,
          `<span class="dim">We build digital systems for companies that want to operate better, scale faster and create new digital capabilities.</span>`,
          `<span class="dim">Our work combines</span> <span class="accent">strategy, design, engineering and infrastructure</span><span class="dim"> into practical systems built around real business needs.</span>`,
          `<span class="dim">We focus on clarity, performance, maintainability and measurable business impact.</span>`,
          `<span class="dim">&nbsp;</span>`,
          `<span class="accent">Mission:</span> <span class="dim">Engineer reliable digital systems that remove friction and create room for growth.</span>`,
          `<span class="accent">Approach:</span> <span class="dim">Discover → Design → Build → Deploy → Evolve.</span>`
        ]);
        break;

      case "solutions":
        await faxPrint("solutions", "SOLUTIONS", [
          `<span class="dim">Technology should solve operational problems, unlock growth and stay maintainable after launch.</span>`,
          `<div class="sol-grid">
            <div class="sol-card"><div class="sol-head"><span class="sol-tag">[WEB]</span><span class="sol-title">WEB SYSTEMS</span><span class="sol-status">READY</span></div><div class="sol-body"><div>+ Websites & digital platforms</div><div>+ E-commerce ecosystems</div><div>+ Portals, dashboards & internal tools</div></div></div>
            <div class="sol-card"><div class="sol-head"><span class="sol-tag">[APP]</span><span class="sol-title">SOFTWARE & APPS</span><span class="sol-status">READY</span></div><div class="sol-body"><div>+ Native mobile apps</div><div>+ Custom business software</div><div>+ Admin panels & operational systems</div></div></div>
            <div class="sol-card"><div class="sol-head"><span class="sol-tag">[INFRA]</span><span class="sol-title">BUSINESS INFRASTRUCTURE</span><span class="sol-status">READY</span></div><div class="sol-body"><div>+ APIs, databases & authentication</div><div>+ Payments & third-party integrations</div><div>+ Cloud, deployment & architecture</div></div></div>
            <div class="sol-card"><div class="sol-head"><span class="sol-tag">[AI]</span><span class="sol-title">AUTOMATION & AI</span><span class="sol-status">READY</span></div><div class="sol-body"><div>+ Workflow automation</div><div>+ AI integrations</div><div>+ Internal productivity systems</div></div></div>
            <div class="sol-card"><div class="sol-head"><span class="sol-tag">[GROWTH]</span><span class="sol-title">DIGITAL GROWTH</span><span class="sol-status">READY</span></div><div class="sol-body"><div>+ Technical SEO</div><div>+ Performance & Core Web Vitals</div><div>+ Analytics & conversion foundations</div></div></div>
          </div>`,
          `<div class="sol-cmd"><span class="dim">Have something worth building?</span> <span class="accent">/contact</span></div>`
        ]);
        break;

      case "clients":
        await faxPrint("clients", "CLIENTS", [
          `<span class="dim">Selected brands we work with.</span>`,
          `<div class="clients-marquee" aria-label="Oaxsun clients"><div class="clients-track">
            <div class="client-logo client-nautica">NAUTICA <span>HOME</span></div>
            <div class="client-logo client-hacker">HACKER <span>KITCHENS</span></div>
            <div class="client-logo client-glick">CASA GLICK</div>
            <div class="client-logo client-duelazo">DUELAZO.MX</div>
            <div class="client-logo client-nautica" aria-hidden="true">NAUTICA <span>HOME</span></div>
            <div class="client-logo client-hacker" aria-hidden="true">HACKER <span>KITCHENS</span></div>
            <div class="client-logo client-glick" aria-hidden="true">CASA GLICK</div>
            <div class="client-logo client-duelazo" aria-hidden="true">DUELAZO.MX</div>
          </div></div>`
        ]);
        break;

      case "contact":
        await faxPrint("contact", "CONTACT", [
          `<span class="accent">Have something worth building?</span>`,
          `<span class="dim">Tell us what you are trying to create, improve or automate. We will help define the right technical path.</span>`,
          `<span class="dim">Email:</span> <a class="accent-link" href="mailto:hello@oaxsun.tech">hello@oaxsun.tech</a>`,
          `<a class="btn" href="mailto:hello@oaxsun.tech?subject=Project%20inquiry%20for%20Oaxsun%20Technologies">Start a project</a>`
        ]);
        break;

      case "help":
        await faxPrint("help", "HELP", [
          `<span class="dim">Commands:</span>`,
          `<span class="accent">/about</span> <span class="accent">/solutions</span> <span class="accent">/clients</span> <span class="accent">/contact</span> <span class="accent">/help</span>`,
          `<span class="dim">&nbsp;</span>`,
          `<span class="dim">OAXSUN Technologies 2026 (c) All rights reserved.</span>`
        ]);
        break;
    }
  }

  function niceLabel(cmd) { return cmd.charAt(0).toUpperCase() + cmd.slice(1); }

  async function submit(valueOverride = null) {
    if (busy) return;
    const raw = valueOverride ?? input.value;
    const cmd = raw.trim().toLowerCase().replace(/^\//, "");
    if (!cmd) return;

    input.value = niceLabel(cmd);
    suggest.classList.remove("open");

    if (cmd !== "blog") echoCommand(cmd);
    await respond(cmd);
    if (!isTouch && cmd !== "blog") input.value = "";
  }

  if (isTouch && termInputEl) {
    termInputEl.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (busy) return;
      input.blur();
      input.value = "";
      input.placeholder = MOBILE_HINT;
      openSuggest([...COMMANDS]);
    }, { passive: false });
  }

  input.addEventListener("focus", refreshSuggest);
  input.addEventListener("blur", closeSuggestSoon);
  input.addEventListener("input", refreshSuggest);

  input.addEventListener("keydown", e => {
    if (isTouch) return;
    if (busy) { e.preventDefault(); return; }
    const open = suggest.classList.contains("open") && currentMatches.length;

    if (e.key === "Enter") {
      e.preventDefault();
      const typed = input.value.trim().toLowerCase().replace(/^\//, "");
      if (open && activeIndex >= 0 && (!typed || currentMatches[activeIndex].startsWith(typed))) submit(currentMatches[activeIndex]);
      else submit();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.trim().toLowerCase().replace(/^\//, "");
      const visibleMatches = v ? COMMANDS.filter(c => c.startsWith(v)) : [...COMMANDS];
      if (visibleMatches.length === 1) input.value = visibleMatches[0];
      openSuggest(visibleMatches);
      return;
    }

    if (e.key === "Escape") suggest.classList.remove("open");
    if (e.key === "ArrowDown" && open) { e.preventDefault(); setActive(activeIndex + 1); }
    if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive(activeIndex - 1); }
  });

  document.addEventListener("keydown", e => {
    if (isTouch || busy || e.code !== "Space" || document.activeElement === input) return;
    e.preventDefault();
    input.focus();
    openSuggest([...COMMANDS]);
  }, { passive: false });

  (async () => {
    introParallaxBind();
    await runIntroLoader("initializing", 900);
    await showSplash();
    enterBtn?.addEventListener("click", async e => {
      e.preventDefault();
      await enterApp();
    }, { once: true });
  })();
})();
