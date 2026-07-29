const root = document.documentElement;
const body = document.body;
const motionToggle = document.querySelector("#motion-toggle");
const soundToggle = document.querySelector("#sound-toggle");
const menuToggle = document.querySelector("#menu-toggle");
const menu = document.querySelector("#site-menu");
const intro = document.querySelector("#intro-loader");
const skipIntro = document.querySelector("#intro-skip");
const sectionStatus = document.querySelector("#section-status");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

let motionEnabled =
    localStorage.getItem("quickfolio-motion") !== "off" &&
    !prefersReducedMotion.matches;
let soundEnabled = localStorage.getItem("quickfolio-sound") === "on";
let menuTimer;
let audioContext;

function applyMotionPreference() {
    root.classList.toggle("reduce-motion", !motionEnabled);

    if (motionToggle) {
        motionToggle.textContent = motionEnabled ? "Motion on" : "Motion off";
        motionToggle.setAttribute("aria-pressed", String(motionEnabled));
    }

    if (!motionEnabled) {
        document.querySelectorAll("[data-reveal]").forEach((element) => {
            element.classList.add("is-visible");
        });
    }
}

function applySoundPreference() {
    if (!soundToggle) return;

    soundToggle.textContent = soundEnabled ? "Sound on" : "Sound off";
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
}

function playTone(frequency = 440, duration = 0.045) {
    if (!soundEnabled) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContext ||= new AudioContext();

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
}

function closeMenu({ immediate = false } = {}) {
    if (!menu || !menuToggle) return;

    clearTimeout(menuTimer);
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");

    if (immediate || !motionEnabled) {
        menu.hidden = true;
        return;
    }

    menuTimer = window.setTimeout(() => {
        menu.hidden = true;
    }, 180);
}

function openMenu() {
    if (!menu || !menuToggle) return;

    clearTimeout(menuTimer);
    menu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");

    window.requestAnimationFrame(() => {
        menu.classList.add("is-open");
    });

    playTone(540);
}

function finishIntro() {
    if (!intro || intro.hidden) return;

    intro.classList.add("is-leaving");
    sessionStorage.setItem("quickfolio-intro-seen", "true");

    window.setTimeout(() => {
        intro.hidden = true;
        intro.classList.remove("is-running", "is-leaving");
    }, motionEnabled ? 420 : 0);
}

function initialiseIntro() {
    if (!intro) return;

    const introSeen = sessionStorage.getItem("quickfolio-intro-seen") === "true";

    if (introSeen || !motionEnabled) {
        intro.hidden = true;
        return;
    }

    intro.hidden = false;
    window.requestAnimationFrame(() => intro.classList.add("is-running"));
    window.setTimeout(finishIntro, 1500);
}

function initialiseReveals() {
    const revealElements = document.querySelectorAll("[data-reveal]");
    if (!revealElements.length) return;

    if (!motionEnabled || !("IntersectionObserver" in window)) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    revealElements.forEach((element) => observer.observe(element));
}

function initialiseSectionStatus() {
    if (!sectionStatus || !("IntersectionObserver" in window)) return;

    const sections = document.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visibleEntry) {
                sectionStatus.textContent = visibleEntry.target.dataset.section;
            }
        },
        { rootMargin: "-32% 0px -58% 0px", threshold: [0, 0.2, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
}

function initialiseFolderCards() {
    document.querySelectorAll(".folder[href^='#']").forEach((card) => {
        card.addEventListener("click", (event) => {
            if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                !motionEnabled
            ) {
                return;
            }

            const target = document.querySelector(card.hash);
            if (!target) return;

            event.preventDefault();
            card.classList.add("is-opening");
            playTone(610);

            window.setTimeout(() => {
                history.pushState(null, "", card.hash);
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                card.classList.remove("is-opening");
            }, 260);
        });
    });
}

function initialiseCardTilt() {
    document.querySelectorAll(".project-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            if (!motionEnabled || !finePointer.matches) return;

            const bounds = card.getBoundingClientRect();
            const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
            const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

            card.style.setProperty("--tilt-x", `${vertical * -8}deg`);
            card.style.setProperty("--tilt-y", `${horizontal * 8}deg`);
            card.classList.add("is-tilting");
        });

        card.addEventListener("pointerleave", () => {
            card.classList.remove("is-tilting");
            card.style.removeProperty("--tilt-x");
            card.style.removeProperty("--tilt-y");
        });
    });
}

async function copyEmail(button) {
    const email = button.dataset.copyEmail;
    const status = document.querySelector("#copy-status");
    if (!email) return;

    try {
        await navigator.clipboard.writeText(email);
    } catch {
        const textArea = document.createElement("textarea");
        textArea.value = email;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
    }

    const originalText = button.textContent;
    button.textContent = "Email copied";
    button.setAttribute("aria-label", `${email} copied to clipboard`);
    if (status) status.textContent = `${email} copied to clipboard.`;
    playTone(720);

    window.setTimeout(() => {
        button.textContent = originalText;
        button.setAttribute("aria-label", `Copy ${email} to clipboard`);
        if (status) status.textContent = "";
    }, 1800);
}

function initialiseCopyEmail() {
    document.querySelectorAll("[data-copy-email]").forEach((button) => {
        button.addEventListener("click", () => copyEmail(button));
    });
}

function initialisePageTransitions() {
    document
        .querySelectorAll(".project-card a[href], .project-pagination a[href], .back-link[href]")
        .forEach((link) => {
            link.addEventListener("click", (event) => {
                if (
                    !motionEnabled ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    link.target === "_blank" ||
                    link.hasAttribute("download")
                ) {
                    return;
                }

                const destination = new URL(link.href, window.location.href);
                if (
                    destination.origin !== window.location.origin ||
                    destination.hash ||
                    destination.href === window.location.href
                ) {
                    return;
                }

                event.preventDefault();
                body.classList.add("is-leaving");
                playTone(460);

                window.setTimeout(() => {
                    window.location.href = destination.href;
                }, 180);
            });
        });
}

function initialiseDeveloperConsole() {
    const developerConsole = document.querySelector("#developer-console");
    const closeButton = document.querySelector("#close-console");
    if (!developerConsole || !closeButton) return;

    const commands = ["sudo", "nebula"];
    let keyBuffer = "";
    let previousFocus;

    function openDeveloperConsole() {
        if (developerConsole.open) return;
        previousFocus = document.activeElement;
        developerConsole.showModal();
        body.classList.add("console-open");
        closeButton.focus();
        playTone(820, 0.08);
    }

    function closeDeveloperConsole() {
        if (!developerConsole.open) return;
        developerConsole.close();
        body.classList.remove("console-open");
        previousFocus?.focus();
    }

    document.addEventListener("keydown", (event) => {
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey
        ) {
            return;
        }

        if (event.key === "Escape" && developerConsole.open) {
            closeDeveloperConsole();
            return;
        }

        if (event.key.length !== 1 || developerConsole.open) return;

        keyBuffer = `${keyBuffer}${event.key.toLowerCase()}`.slice(-10);
        if (commands.some((command) => keyBuffer.endsWith(command))) {
            keyBuffer = "";
            openDeveloperConsole();
        }
    });

    closeButton.addEventListener("click", closeDeveloperConsole);
    developerConsole.addEventListener("click", (event) => {
        if (event.target === developerConsole) {
            closeDeveloperConsole();
        }
    });
}

applyMotionPreference();
applySoundPreference();
initialiseIntro();
initialiseReveals();
initialiseSectionStatus();
initialiseFolderCards();
initialiseCardTilt();
initialiseCopyEmail();
initialisePageTransitions();
initialiseDeveloperConsole();

motionToggle?.addEventListener("click", () => {
    motionEnabled = !motionEnabled;
    localStorage.setItem("quickfolio-motion", motionEnabled ? "on" : "off");
    applyMotionPreference();
    playTone(motionEnabled ? 660 : 340);
});

soundToggle?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("quickfolio-sound", soundEnabled ? "on" : "off");
    applySoundPreference();
    playTone(soundEnabled ? 680 : 320);
});

menuToggle?.addEventListener("click", () => {
    if (!menu) return;
    menu.hidden ? openMenu() : closeMenu();
});

menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu({ immediate: true }));
});

skipIntro?.addEventListener("click", finishIntro);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu && !menu.hidden) {
        closeMenu();
        menuToggle?.focus();
    }
});

window.addEventListener("pageshow", () => {
    body.classList.remove("is-leaving");
});
