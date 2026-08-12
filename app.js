/**
 * AI Employee Presentation — Navigation & Animations
 */

(function () {
    'use strict';

    // ===========================
    // STATE
    // ===========================
    const state = {
        currentSlide: 0,
        totalSlides: 0,
        isTransitioning: false,
        touchStartX: 0,
        touchStartY: 0,
    };

    // ===========================
    // DOM REFERENCES
    // ===========================
    const dom = {
        container: document.getElementById('slidesContainer'),
        progressFill: document.getElementById('progressFill'),
        currentSlideEl: document.getElementById('currentSlide'),
        totalSlidesEl: document.getElementById('totalSlides'),
        navPrev: document.getElementById('navPrev'),
        navNext: document.getElementById('navNext'),
        navDots: document.getElementById('navDots'),
        slides: null,
    };

    // ===========================
    // INIT
    // ===========================
    function init() {
        dom.slides = document.querySelectorAll('.slide');
        state.totalSlides = dom.slides.length;
        dom.totalSlidesEl.textContent = state.totalSlides;

        createDots();
        bindEvents();
        handleUrlHash();
        goToSlide(state.currentSlide, false);

        // Preload all slides with a slight delay for smooth entry
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    }

    // ===========================
    // NAVIGATION
    // ===========================
    function goToSlide(index, animate = true) {
        if (index < 0 || index >= state.totalSlides) return;
        if (state.isTransitioning && animate) return;

        state.isTransitioning = true;
        state.currentSlide = index;

        // Transform container
        const offset = -index * 100;
        dom.container.style.transition = animate
            ? 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none';
        dom.container.style.transform = `translateX(${offset}vw)`;

        // Update UI
        updateProgress();
        updateCounter();
        updateDots();
        updateArrows();
        updateHash();

        // Activate slide and trigger animations
        dom.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (i === index) {
                triggerAnimations(slide);
            }
        });

        // Reset transition lock
        setTimeout(() => {
            state.isTransitioning = false;
        }, animate ? 700 : 50);
    }

    function nextSlide() {
        if (state.currentSlide < state.totalSlides - 1) {
            goToSlide(state.currentSlide + 1);
        }
    }

    function prevSlide() {
        if (state.currentSlide > 0) {
            goToSlide(state.currentSlide - 1);
        }
    }

    // ===========================
    // UI UPDATES
    // ===========================
    function updateProgress() {
        const progress = ((state.currentSlide + 1) / state.totalSlides) * 100;
        dom.progressFill.style.width = `${progress}%`;
    }

    function updateCounter() {
        dom.currentSlideEl.textContent = state.currentSlide + 1;
    }

    function updateDots() {
        const dots = dom.navDots.querySelectorAll('.nav-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === state.currentSlide);
        });
    }

    function updateArrows() {
        dom.navPrev.classList.toggle('hidden', state.currentSlide === 0);
        dom.navNext.classList.toggle('hidden', state.currentSlide === state.totalSlides - 1);
    }

    function updateHash() {
        const slideNumber = state.currentSlide + 1;
        history.replaceState(null, null, `#slide-${slideNumber}`);
    }

    function handleUrlHash() {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/^#slide-(\d+)$/);
            if (match) {
                const slideIndex = parseInt(match[1], 10) - 1;
                if (slideIndex >= 0 && slideIndex < state.totalSlides) {
                    state.currentSlide = slideIndex;
                }
            }
        }
    }

    // ===========================
    // DOTS
    // ===========================
    function createDots() {
        for (let i = 0; i < state.totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = 'nav-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dom.navDots.appendChild(dot);
        }
    }

    // ===========================
    // ANIMATIONS
    // ===========================
    function triggerAnimations(slide) {
        const elements = slide.querySelectorAll('.animate-in');
        elements.forEach((el) => {
            el.classList.remove('visible');
        });

        // Stagger animation triggers
        elements.forEach((el) => {
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => {
                el.classList.add('visible');
            }, delay + 100); // +100ms base offset after slide transition starts
        });
    }

    // ===========================
    // EVENT BINDINGS
    // ===========================
    function bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Arrow button clicks
        dom.navPrev.addEventListener('click', prevSlide);
        dom.navNext.addEventListener('click', nextSlide);

        // Touch events
        dom.container.addEventListener('touchstart', handleTouchStart, { passive: true });
        dom.container.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Mouse wheel (horizontal scrolling)
        document.addEventListener('wheel', handleWheel, { passive: false });

        // Window resize — recalculate position
        window.addEventListener('resize', () => {
            dom.container.style.transition = 'none';
            dom.container.style.transform = `translateX(${-state.currentSlide * 100}vw)`;
        });

        // Hash change
        window.addEventListener('hashchange', () => {
            handleUrlHash();
            goToSlide(state.currentSlide, true);
        });
    }

    function handleKeydown(e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(state.totalSlides - 1);
                break;
        }
    }

    // ===========================
    // TOUCH HANDLING
    // ===========================
    function handleTouchStart(e) {
        state.touchStartX = e.changedTouches[0].screenX;
        state.touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = state.touchStartX - touchEndX;
        const diffY = state.touchStartY - touchEndY;

        // Only trigger if horizontal swipe is dominant and significant
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // ===========================
    // WHEEL HANDLING
    // ===========================
    let wheelTimeout = null;
    let lastWheelTime = 0;

    function handleWheel(e) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastWheelTime < 800) return; // Debounce

        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (Math.abs(delta) > 30) {
            lastWheelTime = now;
            if (delta > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // ===========================
    // BODY FADE IN
    // ===========================
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    // ===========================
    // START
    // ===========================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ===========================
// GLOBAL ACCORDION & FLOW SIMULATION (Slide 11)
// ===========================
function toggleAccordion(id) {
    const item = document.getElementById(id);
    if (!item) return;

    const isActive = item.classList.contains('active');
    
    // Close all accordion items in timeline
    document.querySelectorAll('.timeline-accordion-item').forEach(el => {
        el.classList.remove('active');
    });

    // Toggle current if it wasn't active
    if (!isActive) {
        item.classList.add('active');
    }
}

// Interactive Simulation Engine for Level 1 to 5
const flowSimLogs = {
    1: [
        '[1/3] 🎯 Prompt parsed: "Read React 19 migration guide. List breaking changes affecting OUR app..."',
        '[2/3] 📖 Scanning library changelogs, deprecated function lists, and open GitHub issues...',
        '[3/3] 📋 Compiling step-by-step upgrade checklist with zero breaking changes.',
        '✅ SUCCESS: Tailored migration checklist generated in 2.4s (Saved: upgrade_plan.md)'
    ],
    2: [
        '[1/3] 🔌 Connecting to tools: Jira API, GitHub GraphQL, Slack Webhooks...',
        '[2/3] ⚡ Reading live data directly: 14 open PRs, 3 Jira tickets, 1 CI build alert...',
        '[3/3] 🔗 Correlating status: PR #241 is waiting on Jira Ticket #108 to be merged.',
        '✅ SUCCESS: Multi-tool briefing completed. Zero copy-pasting required!'
    ],
    3: [
        '[1/3] 📋 Loading Team Skill: .claude/skills/code-review-checklist.md',
        '[2/3] 🔍 Auditing PR #302 diff against team rules (React Hooks, a11y, error handling, performance)...',
        '[3/3] ⚖️ Review report: 1 Severity-HIGH (missing ARIA tag), 2 Severity-WARN (unnecessary useEffect).',
        '✅ SUCCESS: Team review checklist executed automatically with exact code fixes.'
    ],
    4: [
        '[1/3] 🎯 Goal received: "Fix 3 failing unit tests in CI." Inspecting test logs & repo...',
        '[2/3] 🔄 Loop 1: Edit auth.ts -> Run npm test... ❌ FAIL (1 test remaining)',
        '[2/3] 🔄 Loop 2: Adjust token expiry delay -> Run npm test... ✅ PASS (42/42 tests green)',
        '✅ SUCCESS: Fix applied, regression test added, 42/42 tests green! (Time to enjoy your coffee ☕)'
    ],
    5: [
        '[1/3] ⏰ 08:00 AM Scheduled Trigger: Starting Daily Engineering Health Check workflow...',
        '[2/3] 🤖 Scanning CI/CD builds, server health & error tracking logs...',
        '[3/3] ⚡ Actions taken: Created Jira ticket #402, auto-triaged error logs, posted Slack summary.',
        '✅ RESPONSIBILITY OWNED: Morning operational routine completed autonomously before standup.'
    ]
};

function runFlowSimulation(e, level) {
    if (e && e.stopPropagation) e.stopPropagation();

    const flowContainer = document.querySelector(`.playable-flow[data-level="${level}"]`);
    if (!flowContainer) return;

    const consoleEl = document.getElementById(`console-${level}`);
    if (!consoleEl) return;

    const contentPre = consoleEl.querySelector('.console-content');
    const indicator = consoleEl.querySelector('.status-indicator');
    const steps = [
        document.getElementById(`sim-${level}-step-1`),
        document.getElementById(`sim-${level}-step-2`),
        document.getElementById(`sim-${level}-step-3`),
    ];

    // Reset step styles
    steps.forEach(s => s && s.classList.remove('active', 'done'));
    indicator.textContent = 'RUNNING...';
    indicator.className = 'status-indicator running';

    const logs = flowSimLogs[level] || [];
    contentPre.textContent = '🚀 Initializing simulation workflow...\n';

    // Step 1
    setTimeout(() => {
        if (steps[0]) steps[0].classList.add('active');
        contentPre.textContent += `${logs[0]}\n`;
    }, 200);

    // Step 2
    setTimeout(() => {
        if (steps[0]) { steps[0].classList.remove('active'); steps[0].classList.add('done'); }
        if (steps[1]) steps[1].classList.add('active');
        contentPre.textContent += `${logs[1]}\n`;
    }, 500);

    // Step 3
    setTimeout(() => {
        if (steps[1]) { steps[1].classList.remove('active'); steps[1].classList.add('done'); }
        if (steps[2]) steps[2].classList.add('active');
        contentPre.textContent += `${logs[2]}\n`;
    }, 850);

    // Done
    setTimeout(() => {
        if (steps[2]) { steps[2].classList.remove('active'); steps[2].classList.add('done'); }
        contentPre.textContent += `\n✨ ${logs[3]}\n`;
        indicator.textContent = 'COMPLETE';
        indicator.className = 'status-indicator complete';
    }, 1100);
}

