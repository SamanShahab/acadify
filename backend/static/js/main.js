/* ==========================================================================
   NEXUS — Main Script & Motion Orchestration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lenis Smooth Scroll & GSAP Sync
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis = null;

    if (typeof Lenis !== 'undefined' && !isReducedMotion) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        }
    }

    // 2. Floating Navbar Scroll Behavior
    const navbar = document.querySelector('.navbar-wrapper');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 3. Animated 3D Counter Digits
    const counterElements = document.querySelectorAll('.counter-num');
    if (counterElements.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        counterElements.forEach(el => counterObserver.observe(el));
    }

    function animateCounter(el) {
        const targetVal = parseFloat(el.getAttribute('data-target') || el.innerText);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        
        let startVal = 0;
        const duration = 1200;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            // Expo-out easing
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = startVal + (targetVal - startVal) * easeProgress;

            el.innerText = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    // 4. Scroll Reveal Observer
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => observer.observe(el));
    }

    // 5. Loading Screen Transition
    const loaderScreen = document.getElementById('loading-screen');
    const loaderFill = document.querySelector('.loader-bar-fill');
    const loaderPercent = document.querySelector('.loader-percent');

    if (loaderScreen && loaderFill && loaderPercent) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 25) + 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loaderScreen.style.opacity = '0';
                    loaderScreen.style.visibility = 'hidden';
                }, 150);
            }
            loaderFill.style.width = `${progress}%`;
            loaderPercent.textContent = `${progress}%`;
        }, 40);
    }
});
