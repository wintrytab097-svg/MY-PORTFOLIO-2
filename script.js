(function() {
    "use strict";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hasGSAP = typeof window.gsap !== "undefined";

    if (hasGSAP && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    document.body.classList.add("is-loading");


    function buildSplitText() {
        const el = document.getElementById("heroTitle");
        if (!el) return;
        const text = el.getAttribute("data-split") || "";
        el.innerHTML = "";

        text.split("").forEach((ch) => {
            const mask = document.createElement("span");
            mask.className = "char-mask";
            const inner = document.createElement("span");
            inner.className = "char";
            inner.textContent = ch === " " ? "\u00A0" : ch;
            mask.appendChild(inner);
            el.appendChild(mask);
        });
    }


    function runPreloader(onDone) {
        const preloader = document.getElementById("preloader");
        const numEl = document.getElementById("preloaderNum");
        const fillEl = document.getElementById("preloaderFill");

        if (!preloader) { onDone(); return; }

        if (prefersReducedMotion) {
            preloader.style.display = "none";
            onDone();
            return;
        }

        const counter = { val: 0 };
        const duration = 1.3;

        function finish() {
            preloader.classList.add("is-done");
            document.body.classList.remove("is-loading");
            setTimeout(() => { preloader.style.display = "none"; }, 1000);
            onDone();
        }

        if (hasGSAP) {
            gsap.to(counter, {
                val: 100,
                duration,
                ease: "power2.inOut",
                onUpdate: () => {
                    const v = Math.round(counter.val);
                    numEl.textContent = v;
                    fillEl.style.width = v + "%";
                },
                onComplete: finish,
            });
        } else {
            let start = null;

            function step(ts) {
                if (!start) start = ts;
                const p = Math.min((ts - start) / (duration * 1000), 1);
                const v = Math.round(p * 100);
                numEl.textContent = v;
                fillEl.style.width = v + "%";
                if (p < 1) requestAnimationFrame(step);
                else finish();
            }
            requestAnimationFrame(step);
        }
    }


    function playHeroIntro() {
        const chars = document.querySelectorAll(".char");
        const fades = document.querySelectorAll('[data-anim="fade"]');

        if (prefersReducedMotion) {
            chars.forEach((c) => (c.style.transform = "none"));
            fades.forEach((f) => { f.style.opacity = 1;
                f.style.transform = "none"; });
            return;
        }

        if (hasGSAP) {
            const tl = gsap.timeline();
            tl.to(chars, {
                y: "0%",
                duration: 0.9,
                ease: "power4.out",
                stagger: 0.035,
            }).to(fades, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.12,
            }, "-=0.5");
        } else {
            chars.forEach((c, i) => {
                setTimeout(() => { c.style.transition = "transform 0.7s ease";
                    c.style.transform = "translateY(0)"; }, i * 30);
            });
            fades.forEach((f, i) => {
                setTimeout(() => {
                    f.style.transition = "opacity 0.6s ease, transform 0.6s ease";
                    f.style.opacity = 1;
                    f.style.transform = "translateY(0)";
                }, 600 + i * 100);
            });
        }
    }


    function initReveal() {
        const targets = document.querySelectorAll(".reveal");
        if (!targets.length) return;

        if (prefersReducedMotion) {
            targets.forEach((t) => t.classList.add("is-visible"));
            return;
        }

        if (hasGSAP) {
            targets.forEach((t) => {
                gsap.to(t, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: t,
                        start: "top 85%",
                    },
                });
            });
            return;
        }

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-visible");
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
            );
            targets.forEach((t) => observer.observe(t));
        } else {
            targets.forEach((t) => t.classList.add("is-visible"));
        }
    }


    function initParallax() {
        if (prefersReducedMotion || !hasGSAP) return;
        const el = document.querySelector("[data-parallax]");
        if (!el) return;
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;

        gsap.to(el, {
            yPercent: -30 * speed * 10,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });
    }


    function initWorkGallery() {
        const pin = document.getElementById("workPin");
        const track = document.getElementById("workTrack");
        if (!pin || !track) return;

        if (prefersReducedMotion || !hasGSAP) {
            track.style.overflowX = "auto";
            track.style.paddingBottom = "1rem";
            return;
        }

        let st;

        function setup() {
            if (st) st.kill();
            const distance = track.scrollWidth - pin.clientWidth;
            if (distance <= 0) return;
            st = ScrollTrigger.create({
                trigger: pin,
                start: "top top+=72",
                end: () => "+=" + distance,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                animation: gsap.to(track, { x: -distance, ease: "none" }),
            });
        }

        const mm = gsap.matchMedia();
        mm.add("(min-width: 861px)", () => {
            setup();
            window.addEventListener("resize", setup);
            return () => {
                window.removeEventListener("resize", setup);
                if (st) st.kill();
            };
        });
    }


    function initCursor() {
        if (!hasFinePointer || prefersReducedMotion) return;

        const dot = document.getElementById("cursorDot");
        const ring = document.getElementById("cursorRing");
        const label = document.getElementById("cursorLabel");
        if (!dot || !ring) return;

        document.body.classList.add("cursor-active");

        let ringX = window.innerWidth / 2;
        let ringY = window.innerHeight / 2;
        let targetX = ringX;
        let targetY = ringY;

        window.addEventListener("mousemove", (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            dot.style.left = e.clientX + "px";
            dot.style.top = e.clientY + "px";
        });

        function raf() {
            ringX += (targetX - ringX) * 0.16;
            ringY += (targetY - ringY) * 0.16;
            ring.style.left = ringX + "px";
            ring.style.top = ringY + "px";
            requestAnimationFrame(raf);
        }
        raf();

        document.querySelectorAll("[data-cursor]").forEach((el) => {
            el.addEventListener("mouseenter", () => {
                ring.classList.add("is-active");
                label.textContent = el.getAttribute("data-cursor") || "";
            });
            el.addEventListener("mouseleave", () => {
                ring.classList.remove("is-active");
                label.textContent = "";
            });
        });
    }


    function initMagnetic() {
        if (!hasFinePointer || prefersReducedMotion) return;

        document.querySelectorAll(".magnetic").forEach((el) => {
            el.addEventListener("mousemove", (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;
                const strength = 0.35;
                if (hasGSAP) {
                    gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: "power3.out" });
                } else {
                    el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
                }
            });
            el.addEventListener("mouseleave", () => {
                if (hasGSAP) {
                    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
                } else {
                    el.style.transform = "translate(0,0)";
                }
            });
        });
    }


    function initNav() {
        const nav = document.getElementById("nav");
        if (nav) {
            const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
            update();
            window.addEventListener("scroll", update, { passive: true });
        }

        const toggle = document.getElementById("navToggle");
        const links = document.querySelector(".nav__links");
        if (toggle && links) {
            toggle.addEventListener("click", () => {
                const isOpen = links.classList.toggle("is-open");
                toggle.classList.toggle("is-open", isOpen);
                toggle.setAttribute("aria-expanded", String(isOpen));
            });
            links.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => {
                    links.classList.remove("is-open");
                    toggle.classList.remove("is-open");
                    toggle.setAttribute("aria-expanded", "false");
                });
            });
        }
    }


    document.addEventListener("DOMContentLoaded", function() {
        buildSplitText();
        initNav();
        initCursor();
        initMagnetic();

        runPreloader(function() {
            playHeroIntro();
            initReveal();
            initParallax();
            initWorkGallery();
            if (hasGSAP && window.ScrollTrigger) ScrollTrigger.refresh();
        });
    });
})();