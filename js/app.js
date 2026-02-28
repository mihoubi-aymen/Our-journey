(() => {
  // 1. GET DATA
  const memories = Array.isArray(window.MEMORIES) ? window.MEMORIES : [];
  const journey = document.querySelector(".journey");
  const container = document.querySelector(".markers");
  const modal = document.getElementById("memoryModal");

  // ---------------------------------------------------------
  // 2. GENERATE MARKERS (Moved this to the top!)
  // ---------------------------------------------------------
  // We calculate height dynamically based on data
  
  const memoriesCount = memories.length;

  // This replaces the Flask {{ 1400 + (memories|length) * 400 }} logic
  const calculatedHeight = 1400 + (memoriesCount * 400) + 400;

  // Apply it directly to the element's style
  journey.style.setProperty("--journeyHeight", `${calculatedHeight}px`);
  journey.style.height = `${calculatedHeight}px`;

  memories.forEach((m, index) => {
    const button = document.createElement("button");
    button.type = "button";

    // Alternate left/right
    const sideClass = index % 2 === 0 ? "marker--left" : "marker--right";

    button.className = `marker ${sideClass}`;
    // Use the top % from data, or calculate fallback based on index
    // Fallback calculation: spreads them out if marker_top isn't in data
    const topVal = m.marker_top ? m.marker_top : (index * 10) + 5; 
    button.style.top = `${topVal}%`;
    
    button.dataset.id = m.id;
    button.setAttribute("aria-label", `Open memory: ${m.title}`);

    button.innerHTML = `
      <span class="marker__inner">
        <span class="marker__heart" aria-hidden="true"></span>
        <span class="marker__label">${m.title}</span>
      </span>
    `;

    // ADD CLICK LISTENER HERE (Directly on the created element)
    button.addEventListener("click", () => {
      openModal(m);
    });

    container.appendChild(button);
  });

// --- NEW: Add the Final Clickable Heart ---
  const finalBtn = document.createElement("button");
  finalBtn.type = "button";

  // Automatically alternate it left or right depending on the last memory
  const finalSideClass = memoriesCount % 2 === 0 ? "marker--left" : "marker--right";
  finalBtn.className = `marker ${finalSideClass}`;
  
  // Place it beautifully near the very bottom of the extended path
  finalBtn.style.top = `100%`; 

  // Exact same HTML structure so it perfectly matches the others
  finalBtn.innerHTML = `
    <span class="marker__inner">
      <span class="marker__heart" aria-hidden="true"></span>
      <span class="marker__label">the princess's birthday</span>
    </span>
  `;

  // Make it open your new HTML page instead of a modal
  finalBtn.addEventListener("click", () => {
    window.location.href = "birthday.html"; // <-- CHANGE THIS to your actual HTML file name
  });

  container.appendChild(finalBtn);
  
  // ---------------------------------------------------------
  // 3. THEME TOGGLE
  // ---------------------------------------------------------
  const THEME_KEY = "journey_theme";
  const toggleBtn = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") document.body.classList.add("dark-mode");
  } catch (_) {}

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-mode");
      applyTheme(isDark ? "light" : "dark");
    });
  }

  // ---------------------------------------------------------
  // 4. MODAL LOGIC
  // ---------------------------------------------------------
  const closeBtn = document.getElementById("closeModal");
  const memTitle = document.getElementById("memTitle");
  const memText = document.getElementById("memText");
  const memImages = document.getElementById("memImages");

  // Carousel click listeners (Delegation)
  document.addEventListener("click", (e) => {
    const prevBtn = e.target.closest(".carousel-prev");
    const nextBtn = e.target.closest(".carousel-next");
    const btn = prevBtn || nextBtn;
    if (!btn) return;
    const shell = btn.closest(".carousel-shell");
    const wrapper = shell && shell.querySelector(".carousel-wrapper");
    if (!wrapper) return;

    const dir = nextBtn ? 1 : -1;
    wrapper.scrollBy({ left: dir * wrapper.clientWidth, behavior: "smooth" });
  });

  function resolveAssetPath(p) {
    if (!p) return "";
    const raw = String(p).trim().replace(/\\/g, "/");
    if (/^(https?:)?\/\//.test(raw) || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return raw;
    // Assuming images are in an 'img' folder relative to index.html
    return `img/${raw.replace(/^\/+/, "")}`; 
  }

  function clearNode(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function openModal(mem) {
    if (!modal) return;

    memTitle.textContent = mem?.title || "Memory";
    memText.textContent = mem?.text || "";
    clearNode(memImages);

    const images = Array.isArray(mem?.images) ? mem.images : [];
    const videos = Array.isArray(mem?.videos) ? mem.videos : [];

    const media = [
      ...images.map((src) => ({ type: "image", src })),
      ...videos.map((src) => ({ type: "video", src })),
    ];

    if (media.length) {
      const wrapper = document.createElement("div");
      wrapper.className = "carousel-wrapper";
      const track = document.createElement("div");
      track.className = "carousel-track";

      const prev = document.createElement("button");
      prev.className = "carousel-nav carousel-prev";
      prev.innerHTML = "&#10094;";

      const next = document.createElement("button");
      next.className = "carousel-nav carousel-next";
      next.innerHTML = "&#10095;";

      prev.disabled = next.disabled = media.length <= 1;

      media.forEach((item) => {
        const slide = document.createElement("div");
        slide.className = "carousel-slide";

        if (item.type === "image") {
          const img = document.createElement("img");
          img.src = resolveAssetPath(item.src);
          slide.appendChild(img);
        } else {
          const shell = document.createElement("div");
          shell.className = "video-shell";
          const vid = document.createElement("video");
          vid.src = resolveAssetPath(item.src);
          vid.controls = true;
          vid.playsInline = true;  // CRITICAL for iPhone/Safari
          vid.muted = true;        // Browsers often block non-muted videos from loading
          shell.appendChild(vid);
          slide.appendChild(shell);
          vid.preload = "metadata";
        }
        track.appendChild(slide);
      });

      const shell = document.createElement("div");
      shell.className = "carousel-shell";
      shell.appendChild(wrapper);
      shell.appendChild(prev);
      shell.appendChild(next);
      wrapper.appendChild(track);
      memImages.appendChild(shell);
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---------------------------------------------------------
  // 5. ANIMATIONS & SCROLL (Reveal Markers)
  // ---------------------------------------------------------
  const markers = document.querySelectorAll(".marker"); // Now these exist!
  
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    markers.forEach((m) => io.observe(m));
  } else {
    markers.forEach((m) => m.classList.add("is-visible"));
  }

  function drawRoad() {
    const path = document.getElementById("roadPath");
    const highlight = document.getElementById("roadHighlight");
    if (!path) return;
    const len = path.getTotalLength();
    [path, highlight].forEach((p) => {
      if(p) {
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        p.getBoundingClientRect(); // trigger layout
        p.style.strokeDashoffset = "0";
      }
    });
  }

  // Cloud Parallax
  const clouds = Array.from(document.querySelectorAll(".cloud")).map((el) => ({
    el,
    speed: Number.parseFloat(el.dataset.speed || "0.08"),
  }));

  function updateParallax() {
    const y = window.scrollY || 0;
    clouds.forEach(({ el, speed }) => {
      el.style.setProperty("--parallax", `${Math.round(y * speed)}px`);
    });
  }
  window.addEventListener("scroll", () => requestAnimationFrame(updateParallax), { passive: true });
  
  // Init
  updateParallax();
  requestAnimationFrame(() => {
     drawRoad(); 
  });

  // ---------------------------------------------------------
  // 6. SIDEBAR & TOAST
  // ---------------------------------------------------------
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const toast = document.getElementById("toast");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarBackdrop.classList.add("is-open");
  }
  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-open");
  }

  if (menuToggle) menuToggle.addEventListener("click", () => {
    sidebar.classList.contains("is-open") ? closeSidebar() : openSidebar();
  });
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);

})();