(() => {
    const root = document.documentElement;
    const body = document.body;
    const menuToggle = document.querySelector("#menu-toggle");
    const menu = document.querySelector("#site-menu");
    const motionToggle = document.querySelector("#motion-toggle");
    const sectionStatus = document.querySelector("#section-status");
    const loader = document.querySelector("#intro-loader");
    const skipIntro = document.querySelector("#intro-skip");
    const systemReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const storedMotion = localStorage.getItem("quickfolio-motion");
    let reduceMotion = storedMotion ? storedMotion === "reduced" : systemReducedMotion.matches;

    const applyMotionPreference = () => {
        root.classList.toggle("reduce-motion", reduceMotion);
        if (motionToggle) {
            motionToggle.setAttribute("aria-pressed", String(reduceMotion));
            motionToggle.textContent = reduceMotion ? "Motion off" : "Motion on";
        }
    };
    applyMotionPreference();

    motionToggle?.addEventListener("click", () => {
        reduceMotion = !reduceMotion;
        localStorage.setItem("quickfolio-motion", reduceMotion ? "reduced" : "full");
        applyMotionPreference();
    });

    const closeMenu = () => {
        if (!menu || !menuToggle) return;
        menu.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.querySelector(".menu-toggle__icon").textContent = "+";
    };

    menuToggle?.addEventListener("click", () => {
        const willOpen = menu.hidden;
        menu.hidden = !willOpen;
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        menuToggle.querySelector(".menu-toggle__icon").textContent = willOpen ? "−" : "+";
    });

    menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
            finishIntro();
        }
    });
    document.addEventListener("click", (event) => {
        if (!menu || menu.hidden || !menuToggle) return;
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });

    const sections = document.querySelectorAll("[data-section]");
    if ("IntersectionObserver" in window && sectionStatus && sections.length) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) sectionStatus.textContent = visible.target.dataset.section;
        }, { rootMargin: "-30% 0px -55%", threshold: [0, 0.25, 0.5] });
        sections.forEach((section) => observer.observe(section));
    }

    let introTimer;
    function finishIntro() {
        if (!loader || loader.hidden) return;
        const returnFocus = document.activeElement === skipIntro;
        window.clearTimeout(introTimer);
        loader.classList.add("is-leaving");
        sessionStorage.setItem("quickfolio-intro-seen", "true");
        body.classList.remove("intro-active");
        window.setTimeout(() => {
            loader.hidden = true;
            loader.classList.remove("is-leaving", "is-running");
            if (returnFocus) document.querySelector("#main-content")?.focus();
        }, reduceMotion ? 0 : 350);
    }

    const hasSeenIntro = sessionStorage.getItem("quickfolio-intro-seen") === "true";
    if (loader && !hasSeenIntro && !reduceMotion) {
        loader.hidden = false;
        body.classList.add("intro-active");
        requestAnimationFrame(() => loader.classList.add("is-running"));
        introTimer = window.setTimeout(finishIntro, 1650);
        skipIntro?.addEventListener("click", finishIntro);
        skipIntro?.focus();
    }
})();
