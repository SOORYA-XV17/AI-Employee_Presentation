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
        const now = Date.now();
        if (now - lastWheelTime < 800) return; // Debounce

        const currentSlideEl = dom.slides[state.currentSlide];
        const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        // If the slide has scrollable content, let it scroll first
        if (isVerticalScroll && currentSlideEl) {
            const scrollTop = currentSlideEl.scrollTop;
            const scrollHeight = currentSlideEl.scrollHeight;
            const clientHeight = currentSlideEl.clientHeight;
            const hasScroll = scrollHeight > clientHeight + 5;

            if (hasScroll) {
                const atTop = scrollTop <= 1;
                const atBottom = scrollTop + clientHeight >= scrollHeight - 5;

                // If scrolling down but not at bottom, OR scrolling up but not at top — let the slide scroll
                if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
                    return; // Don't prevent default — let the slide scroll naturally
                }
            }
        }

        e.preventDefault();

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


// ===========================
// SLIDE 7: STEP-BY-STEP FLOW ANIMATION
// ===========================
(function initSlide7Animation() {
    'use strict';

    const slide7 = document.getElementById('slide7');
    if (!slide7) return;

    const chatbotCard = document.getElementById('chatbotCard');
    const agentCard = document.getElementById('agentCard');
    const loopStep = document.getElementById('loopStep');
    const loopArrow = document.getElementById('loopArrow');
    const loopCounter = document.getElementById('loopCounter');
    const completeStep = document.getElementById('completeStep');

    let animationTimeouts = [];
    let hasPlayed = false;

    // Watch for slide becoming active
    const observer = new MutationObserver(() => {
        if (slide7.classList.contains('active')) {
            if (!hasPlayed) {
                hasPlayed = true;
                startAnimation();
            }
        } else {
            // Reset when leaving slide
            resetAnimation();
            hasPlayed = false;
        }
    });
    observer.observe(slide7, { attributes: true, attributeFilter: ['class'] });

    function startAnimation() {
        const chatbotSteps = chatbotCard.querySelectorAll('.anim-step');
        const agentSteps = agentCard.querySelectorAll('.anim-step');
        let delay = 600; // initial delay after slide appears
        const stepInterval = 350;

        // --- Chatbot: reveal steps one-by-one ---
        chatbotSteps.forEach((step, i) => {
            const t = setTimeout(() => {
                step.classList.add('visible');
                step.classList.add('step-active');
                // Remove active from previous
                if (i > 0) chatbotSteps[i - 1].classList.remove('step-active');
            }, delay + i * stepInterval);
            animationTimeouts.push(t);
        });

        // Remove active highlight from last chatbot step
        const chatbotDone = delay + chatbotSteps.length * stepInterval;
        animationTimeouts.push(setTimeout(() => {
            chatbotSteps[chatbotSteps.length - 1].classList.remove('step-active');
        }, chatbotDone));

        // --- Agent: reveal steps one-by-one (starts slightly after chatbot begins) ---
        const agentStart = delay + 200;

        // Steps 1-5 (Goal → Plan → Act/Observe/Reason): reveal sequentially
        for (let i = 0; i < 5; i++) {
            const t = setTimeout(() => {
                agentSteps[i].classList.add('visible');
                agentSteps[i].classList.add('step-active');
                if (i > 0) agentSteps[i - 1].classList.remove('step-active');
            }, agentStart + i * stepInterval);
            animationTimeouts.push(t);
        }

        // --- THE LOOP: 3 iterations ---
        const loopStart = agentStart + 5 * stepInterval;
        const loopIterations = 3;
        const loopDuration = 800; // ms per loop iteration

        for (let iter = 0; iter < loopIterations; iter++) {
            const iterTime = loopStart + iter * loopDuration;

            animationTimeouts.push(setTimeout(() => {
                // Show loop arrow
                loopArrow.classList.add('visible');

                // Spin arrow
                loopArrow.classList.remove('spinning');
                void loopArrow.offsetWidth; // force reflow
                loopArrow.classList.add('spinning');

                // Pulse the loop step
                loopStep.classList.remove('looping');
                void loopStep.offsetWidth;
                loopStep.classList.add('looping');

                // Update counter
                loopCounter.textContent = `#${iter + 1}`;
                loopCounter.classList.add('show');
            }, iterTime));
        }

        // --- After loops: Verify → Complete ---
        const afterLoops = loopStart + loopIterations * loopDuration + 200;

        // Step 6 (loop arrow) is already visible, step 7 = Verify
        animationTimeouts.push(setTimeout(() => {
            loopStep.classList.remove('step-active');
            agentSteps[4].classList.remove('step-active');
            agentSteps[6].classList.add('visible');    // Verify
            agentSteps[6].classList.add('step-active');
        }, afterLoops));

        // Step 8 = arrow, Step 9 = Complete
        animationTimeouts.push(setTimeout(() => {
            agentSteps[6].classList.remove('step-active');
            agentSteps[7].classList.add('visible');    // arrow connector
            agentSteps[8].classList.add('visible');    // Complete
            agentSteps[8].classList.add('step-active');
        }, afterLoops + stepInterval));

        // Step 10 = desc
        animationTimeouts.push(setTimeout(() => {
            agentSteps[8].classList.remove('step-active');
            agentSteps[9].classList.add('visible');    // "Loop until goal achieved"
        }, afterLoops + stepInterval * 2));
    }

    function resetAnimation() {
        // Clear all pending timeouts
        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];

        // Reset all steps
        const allSteps = slide7.querySelectorAll('.anim-step');
        allSteps.forEach(step => {
            step.classList.remove('visible', 'step-active');
        });

        // Reset loop state
        if (loopStep) loopStep.classList.remove('looping');
        if (loopArrow) loopArrow.classList.remove('spinning');
        if (loopCounter) {
            loopCounter.classList.remove('show');
            loopCounter.textContent = '';
        }
    }
})();

// ===========================
// DRAG & DROP DUSTBIN — SLIDE 1
// ===========================
(function initDustbinDrag() {
    'use strict';

    const promptWord = document.getElementById('promptWord');
    const dustbinZone = document.getElementById('dustbinZone');
    const particleBurst = document.getElementById('particleBurst');
    const dragHint = document.getElementById('dragHint');

    if (!promptWord || !dustbinZone) return;

    let isTransformed = false;

    // --- Desktop Drag Events ---
    promptWord.addEventListener('dragstart', (e) => {
        if (isTransformed) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', 'PROMPT');
        e.dataTransfer.effectAllowed = 'move';
        promptWord.classList.add('dragging');
        dustbinZone.classList.add('visible');
    });

    promptWord.addEventListener('dragend', () => {
        promptWord.classList.remove('dragging');
        if (!isTransformed) {
            dustbinZone.classList.remove('visible');
            dustbinZone.classList.remove('drag-over');
        }
    });

    // Dustbin drop zone events
    dustbinZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dustbinZone.classList.add('drag-over');
    });

    dustbinZone.addEventListener('dragleave', () => {
        dustbinZone.classList.remove('drag-over');
    });

    dustbinZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (isTransformed) return;
        performTransformation();
    });

    // --- Touch Support for Mobile ---
    let touchActive = false;

    promptWord.addEventListener('touchstart', (e) => {
        if (isTransformed) return;
        touchActive = true;
        promptWord.classList.add('dragging');
        dustbinZone.classList.add('visible');
        // Stop slide swipe from triggering
        e.stopPropagation();
    }, { passive: true });

    promptWord.addEventListener('touchmove', (e) => {
        if (!touchActive) return;
        e.stopPropagation();
        const touch = e.touches[0];
        const binRect = dustbinZone.getBoundingClientRect();
        if (touch.clientY >= binRect.top) {
            dustbinZone.classList.add('drag-over');
        } else {
            dustbinZone.classList.remove('drag-over');
        }
    }, { passive: true });

    promptWord.addEventListener('touchend', (e) => {
        if (!touchActive) return;
        touchActive = false;
        promptWord.classList.remove('dragging');
        e.stopPropagation();

        // Check if finger was released over the bin
        const touch = e.changedTouches[0];
        const binRect = dustbinZone.getBoundingClientRect();
        if (touch.clientY >= binRect.top &&
            touch.clientX >= binRect.left &&
            touch.clientX <= binRect.right) {
            performTransformation();
        } else {
            dustbinZone.classList.remove('visible');
            dustbinZone.classList.remove('drag-over');
        }
    }, { passive: true });

    // --- Transformation Logic ---
    function performTransformation() {
        isTransformed = true;

        // Burst particles from the dustbin
        spawnParticles();

        // Consume the dustbin
        dustbinZone.classList.remove('drag-over');
        dustbinZone.classList.add('consumed');

        // Hide drag hint
        if (dragHint) dragHint.classList.add('hidden');

        // Morph "PROMPT" → "AI ASSISTANT"
        setTimeout(() => {
            promptWord.textContent = 'AI ASSISTANT';
            promptWord.classList.remove('dragging');
            promptWord.classList.add('transforming');
            promptWord.draggable = false;

            // Change gradient to green
            promptWord.style.background = 'linear-gradient(135deg, #4dff91, #00d4ff)';
            promptWord.style.webkitBackgroundClip = 'text';
            promptWord.style.webkitTextFillColor = 'transparent';
            promptWord.style.backgroundClip = 'text';
        }, 200);

        // Final settled state
        setTimeout(() => {
            promptWord.classList.remove('transforming');
            promptWord.classList.add('transformed');
            dustbinZone.classList.remove('visible');
        }, 1100);

        // Allow reset by double-clicking the transformed word
        promptWord.addEventListener('dblclick', resetTransformation, { once: true });
    }

    function resetTransformation() {
        isTransformed = false;
        promptWord.textContent = 'PROMPT';
        promptWord.draggable = true;
        promptWord.classList.remove('transformed', 'transforming');

        // Restore original gradient
        promptWord.style.background = '';
        promptWord.style.webkitBackgroundClip = '';
        promptWord.style.webkitTextFillColor = '';
        promptWord.style.backgroundClip = '';

        dustbinZone.classList.remove('consumed');
        if (dragHint) dragHint.classList.remove('hidden');
    }

    function spawnParticles() {
        const colors = ['#ff5555', '#ff6b9d', '#ffa64d', '#00d4ff', '#7b61ff', '#4dff91'];
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            const angle = (Math.PI * 2 * i) / 16;
            const dist = 60 + Math.random() * 80;
            p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--ty', `${Math.sin(angle) * dist - 40}px`);
            p.style.background = colors[i % colors.length];
            p.style.width = `${4 + Math.random() * 6}px`;
            p.style.height = p.style.width;
            particleBurst.appendChild(p);
        }
        // Clean up particles after animation
        setTimeout(() => { particleBurst.innerHTML = ''; }, 1000);
    }
})();

// ===========================
// DSPY INTERACTIVE DEMO — SLIDE 14
// ===========================
function switchDspyDemo(index, btn) {
    // Switch tabs
    document.querySelectorAll('.dspy-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Switch panels
    document.querySelectorAll('.dspy-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('dspy-panel-' + index);
    if (panel) panel.classList.add('active');
}

function runDspyDemo(index) {
    const outputEl = document.querySelector('#dspy-output-' + index + ' .dspy-result-code');
    const btn = document.querySelector('#dspy-panel-' + index + ' .dspy-run-btn');
    if (!outputEl || !btn) return;

    // Disable button
    btn.disabled = true;
    btn.textContent = '⏳ Running...';
    outputEl.textContent = '';

    const outputs = [
        // Ticket Classifier
`⚡ DSPy Compiler optimizing...
✓ Tested 47 prompt variants
✓ Best accuracy: 96.2%

━━━ OUTPUT ━━━━━━━━━━━━━━━━━━
{
  "reasoning": "User mentions being charged
  twice and requests a refund. This is
  clearly a billing/payment issue with
  high urgency due to financial impact.",
  "category": "billing",
  "urgency": 5
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Structured. Consistent. Every time.`,

        // Code Reviewer
`⚡ DSPy Compiler optimizing...
✓ Tested 52 prompt variants
✓ Best detection rate: 98.1%

━━━ OUTPUT ━━━━━━━━━━━━━━━━━━
{
  "reasoning": "Direct string interpolation
  of user_input into SQL query allows
  attackers to inject malicious SQL.",
  "bugs": ["SQL Injection vulnerability"],
  "severity": "🔴 CRITICAL",
  "fix": "Use parameterized queries:\n  cursor.execute(\n    'SELECT * FROM users WHERE id = %s',\n    (user_input,)\n  )"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ No prompt tweaking needed. Same result
   across GPT-4, Claude, Gemini.`,

        // Meeting Summary
`⚡ DSPy Compiler optimizing...
✓ Tested 39 prompt variants
✓ Best F1 score: 94.7%

━━━ OUTPUT ━━━━━━━━━━━━━━━━━━
{
  "reasoning": "Extracting structured info
  from standup discussion about auth
  migration, documentation, and blocker.",
  "decisions": [
    "Migrate authentication to OAuth2"
  ],
  "action_items": [
    "Raj → Update API documentation",
    "DevOps → Fix staging deploy blocker"
  ],
  "deadlines": [
    "OAuth2 migration → Friday"
  ]
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Each field separate. No parsing needed.
   Ready for Jira/Slack integration.`
    ];

    const fullOutput = outputs[index] || 'No demo available';
    let charIndex = 0;

    // Typewriter effect
    const typeInterval = setInterval(() => {
        if (charIndex < fullOutput.length) {
            outputEl.textContent += fullOutput[charIndex];
            charIndex++;
        } else {
            clearInterval(typeInterval);
            btn.disabled = false;
            btn.textContent = '▶ Run Again';
        }
    }, 8);
}


// ==========================================
// WORKFLOW MODAL CONTROL & NAVIGATION
// ==========================================
function openWorkflowModal() {
    const modal = document.getElementById('workflowModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeWorkflowModal() {
    const modal = document.getElementById('workflowModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleModalBackdropClick(e) {
    if (e.target && e.target.classList.contains('workflow-modal-overlay')) {
        closeWorkflowModal();
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWorkflowModal();
    }
});

function switchModalTab(tabName, btn) {
    // Tab buttons
    document.querySelectorAll('.workflow-modal-tabs .modal-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Panes
    document.querySelectorAll('.workflow-modal-body .modal-tab-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('modal-pane-' + tabName);
    if (pane) pane.classList.add('active');
}


// ==========================================
// TAB 1: FLOWCHART ANIMATION ENGINE
// ==========================================
function runFlowchartAnimation() {
    const playBtn = document.getElementById('flowchartPlayBtn');
    if (playBtn) {
        playBtn.disabled = true;
        playBtn.textContent = '⏳ Running Flow...';
    }

    const nodeSequence = [
        { id: 'fn-human', conn: 'fc-conn-1', delay: 200 },
        { id: 'fn-agent', conn: 'fc-conn-2', delay: 800 },
        { id: 'fn-jira', delay: 1400 },
        { id: 'fn-git', delay: 1550 },
        { id: 'fn-mcp', conn: 'fc-conn-3', delay: 1700 },
        { id: 'fn-context', conn: 'fc-conn-4', delay: 2400 },
        { id: 'fn-dspy', conn: 'fc-conn-5', delay: 3100 },
        { id: 'fn-llm', conn: 'fc-conn-6', delay: 3800 },
        { id: 'fn-exec', conn: 'fc-conn-7', delay: 4500 },
        { id: 'fn-code', conn: 'fc-conn-8', delay: 5200 },
        { id: 'fn-test', delay: 5900 },
        { id: 'fn-fail-branch', delay: 6600 },
        { id: 'fn-pass-branch', delay: 7500 },
        { id: 'fn-approval', delay: 8200 }
    ];

    // Reset all pulses
    document.querySelectorAll('.fc-node, .fc-branch').forEach(n => n.classList.remove('pulse-active'));
    document.querySelectorAll('.fc-connector-v').forEach(c => c.classList.remove('glow'));

    nodeSequence.forEach(item => {
        setTimeout(() => {
            const el = document.getElementById(item.id);
            if (el) el.classList.add('pulse-active');

            if (item.conn) {
                const connEl = document.getElementById(item.conn);
                if (connEl) connEl.classList.add('glow');
            }
        }, item.delay);
    });

    setTimeout(() => {
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.textContent = '▶ Run Again';
        }
    }, 9000);
}


// ==========================================
// TAB 2: FOLDER STRUCTURE CODE VIEWER
// ==========================================
const folderFileSnippets = {
    dspy_sig: {
        title: '🧩 src/dspy_signatures/genesis_card_signature.py',
        code: `import dspy

class GenesisCardSignature(dspy.Signature):
    """
    DSPy Task Signature for transforming CMS-123 Jira requirements 
    and legacy HTML/CSS into a modern React GenesisCard component.
    """
    user_request   = dspy.InputField(desc="Original human prompt")
    jira_ticket    = dspy.InputField(desc="JSON specification from CMS-123")
    legacy_html    = dspy.InputField(desc="Legacy Genesis Card HTML & CSS markup")
    existing_cards = dspy.InputField(desc="Existing Kia/Hyundai TSX component code")
    project_rules  = dspy.InputField(desc="TypeScript & CSS module conventions")
    
    component_tsx  = dspy.OutputField(desc="Production-ready TypeScript React component")
    module_css     = dspy.OutputField(desc="CSS Module with CSS variables and glassmorphic styling")
    unit_tests     = dspy.OutputField(desc="Jest/Vitest test file covering all card states")
    reasoning      = dspy.OutputField(desc="Architectural decisions & prop choices")`
    },
    dspy_mod: {
        title: '🧩 src/dspy_signatures/component_generator.py',
        code: `import dspy
from genesis_card_signature import GenesisCardSignature

class ComponentGeneratorModule(dspy.Module):
    """
    DSPy Teleprompter module that compiles structured inputs
    into optimized LLM prompts with Chain-of-Thought reasoning.
    """
    def __init__(self):
        super().__init__()
        self.generator = dspy.ChainOfThought(GenesisCardSignature)

    def forward(self, context_payload):
        # Passes aggregated context straight into DSPy reasoning loop
        prediction = self.generator(
            user_request=context_payload["user_request"],
            jira_ticket=context_payload["jira_ticket"],
            legacy_html=context_payload["legacy_html"],
            existing_cards=context_payload["existing_cards"],
            project_rules=context_payload["project_rules"]
        )
        return prediction`
    },
    agent_orch: {
        title: '🐍 src/agent/orchestrator.py',
        code: `class AgentOrchestrator:
    """
    Primary Agent Router — interprets human intent, invokes MCP tools
    (Jira, Git, Figma), builds relevant context, and calls DSPy.
    """
    def __init__(self, jira_tool, git_tool, dspy_module):
        self.jira = jira_tool
        self.git = git_tool
        self.dspy = dspy_module

    async def execute_task(self, prompt: str):
        ticket_id = self.extract_ticket_id(prompt) # CMS-123
        ticket_data = await self.jira.get_ticket(ticket_id)
        legacy_code = await self.git.get_file("src/components/LegacyGenesisCard.html")
        
        context = self.build_context(prompt, ticket_data, legacy_code)
        result = self.dspy(context)
        return result`
    },
    agent_ctx: {
        title: '🐍 src/agent/context_builder.py',
        code: `def build_relevant_context(prompt, jira_ticket, legacy_code, test_feedback=None):
    """
    Aggregates user prompt, Jira specifications, legacy markup,
    project conventions, and execution errors into a unified DSPy Context.
    """
    context = {
        "user_request": prompt,
        "jira_ticket": jira_ticket,
        "legacy_html": legacy_code,
        "project_rules": "Strict TypeScript, CSS Modules, Jest test suite.",
        "previous_error": test_feedback or "None"
    }
    return context`
    },
    mcp_jira: {
        title: '🔌 src/tools/jira_mcp.py',
        code: `class JiraMCPTool:
    """
    Model Context Protocol (MCP) Tool for fetching Jira ticket details.
    """
    async def get_ticket(self, ticket_id: str):
        # GET /rest/api/3/issue/CMS-123
        return {
            "id": ticket_id,
            "title": "Redesign Genesis Card component",
            "acceptance_criteria": [
                "Dark glassmorphic styling",
                "Badge prop with types (primary, success, warning)",
                "Price field display",
                "Click handler callback"
            ]
        }`
    },
    mcp_git: {
        title: '🔌 src/tools/git_mcp.py',
        code: `class GitMCPTool:
    """
    MCP tool for reading repo files, diffs, and existing component patterns.
    """
    async def get_file(self, filepath: str):
        return """<div class="genesis-card-old">
  <span class="badge">NEW</span>
  <h3>Genesis G80</h3>
  <p>$58,000</p>
</div>"""`
    },
    test_runner: {
        title: '🧪 src/tools/test_runner.py',
        code: `import subprocess

class TestRunnerTool:
    """
    Executes Jest / Vitest CLI unit tests and captures stdout/stderr.
    """
    def run_tests(self, test_file="src/components/GenesisCard.test.tsx"):
        result = subprocess.run(["npx", "jest", test_file], capture_output=True, text=True)
        return {
            "passed": result.returncode == 0,
            "output": result.stdout or result.stderr
        }`
    },
    genesis_tsx: {
        title: '⚛️ src/components/GenesisCard.tsx',
        code: `import React from 'react';
import styles from './GenesisCard.module.css';

export interface GenesisCardProps {
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeType?: 'primary' | 'success' | 'warning';
    imageUrl?: string;
    price?: string;
    onClick?: () => void;
}

export const GenesisCard: React.FC<GenesisCardProps> = ({
    title,
    subtitle,
    badgeText = 'NEW',
    badgeType = 'primary',
    imageUrl,
    price,
    onClick
}) => {
    return (
        <div className={styles.genesisCard} onClick={onClick}>
            {badgeText && (
                <span className={\`\${styles.badge} \${styles[badgeType]}\`}>
                    {badgeText}
                </span>
            )}
            {imageUrl && <img src={imageUrl} alt={title} className={styles.cardImage} />}
            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
                {price && <div className={styles.cardPrice}>{price}</div>}
            </div>
        </div>
    );
};`
    },
    genesis_css: {
        title: '🎨 src/components/GenesisCard.module.css',
        code: `.genesisCard {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    backdrop-filter: blur(12px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.genesisCard:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 212, 255, 0.4);
    box-shadow: 0 12px 30px rgba(0, 212, 255, 0.15);
}

.badge {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 0.7rem;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
}

.primary { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.success { background: rgba(77, 255, 145, 0.2); color: #4dff91; }
.warning { background: rgba(255, 166, 77, 0.2); color: #ffa64d; }`
    },
    genesis_test: {
        title: '🧪 src/components/GenesisCard.test.tsx',
        code: `import { render, screen, fireEvent } from '@testing-library/react';
import { GenesisCard } from './GenesisCard';

describe('GenesisCard Component (CMS-123)', () => {
    test('renders card title and price correctly', () => {
        render(<GenesisCard title="Genesis GV80" price="$65,000" />);
        expect(screen.getByText('Genesis GV80')).toBeInDOM();
        expect(screen.getByText('$65,000')).toBeInDOM();
    });

    test('handles click callback when clicked', () => {
        const handleClick = jest.fn();
        render(<GenesisCard title="Test Card" onClick={handleClick} />);
        fireEvent.click(screen.getByText('Test Card'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});`
    },
    skill_genesis: {
        title: '📝 .claude/skills/genesis-card-migration.md',
        code: `# Genesis Component Migration Skill

Use this skill when converting legacy Hyundai/Genesis components into modern React TSX modules.

## Guidelines
1. Enforce Glassmorphism CSS Modules (\`GenesisCard.module.css\`).
2. Add optional default badge fallback (\`NEW\`).
3. Ensure 100% test coverage with Vitest/Jest.
4. Auto-generate component prop interface.`
    },
    skill_review: {
        title: '📝 .claude/skills/code-review.md',
        code: `# Team Code Review Skill

Checklist for automated PR reviews:
- [ ] No inline styling (use CSS modules)
- [ ] Explicit TypeScript interface exports
- [ ] Accessibility aria tags present
- [ ] Jest unit tests included`
    },
    mcp_config: {
        title: '⚙️ .claude/mcp.json',
        code: `{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@mcp/server-jira"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@mcp/server-git"]
    }
  }
}`
    },
    dspy_config: {
        title: '🐍 dspy.config.py',
        code: `import dspy

# Configures DSPy with Anthropic Claude 3.5 Sonnet LLM
lm = dspy.LM('anthropic/claude-3-5-sonnet-20241022')
dspy.configure(lm=lm)`
    }
};

function showFolderFileDetail(key, el) {
    if (el) {
        document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }

    const detail = folderFileSnippets[key];
    if (!detail) return;

    const titleEl = document.getElementById('folderDetailTitle');
    const codeEl = document.getElementById('folderDetailCode');
    if (titleEl) titleEl.textContent = detail.title;
    if (codeEl) codeEl.textContent = detail.code;
}


// ==========================================
// TAB 3: VS CODE & AI AGENT LIVE SIMULATOR
// ==========================================
const ideFileContents = {
    tsx: {
        filename: 'src/components/GenesisCard.tsx',
        code: `import React from 'react';
import styles from './GenesisCard.module.css';

export interface GenesisCardProps {
    title: string;
    subtitle?: string;
    badgeText?: string;
    badgeType?: 'primary' | 'success' | 'warning';
    imageUrl?: string;
    price?: string;
    onClick?: () => void;
}

export const GenesisCard: React.FC<GenesisCardProps> = ({
    title,
    subtitle,
    badgeText = 'NEW',
    badgeType = 'primary',
    imageUrl,
    price,
    onClick
}) => {
    return (
        <div className={styles.genesisCard} onClick={onClick}>
            {badgeText && (
                <span className={\`\${styles.badge} \${styles[badgeType]}\`}>
                    {badgeText}
                </span>
            )}
            {imageUrl && <img src={imageUrl} alt={title} className={styles.cardImage} />}
            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
                {price && <div className={styles.cardPrice}>{price}</div>}
            </div>
        </div>
    );
};`
    },
    sig: {
        filename: 'src/dspy_signatures/genesis_card_signature.py',
        code: `import dspy

class GenesisCardSignature(dspy.Signature):
    """DSPy Task Signature for CMS-123 Genesis Card Redesign"""
    user_request = dspy.InputField()
    jira_ticket  = dspy.InputField()
    legacy_html  = dspy.InputField()
    
    component_tsx = dspy.OutputField()
    unit_tests    = dspy.OutputField()`
    },
    context: {
        filename: 'src/agent/context_payload.json',
        code: `{
  "task": "Implement CMS-123 for Genesis Card component",
  "jira_ticket": {
    "key": "CMS-123",
    "summary": "Redesign Genesis Card Component",
    "status": "IN_PROGRESS"
  },
  "legacy_files": ["src/components/LegacyCard.html"],
  "dspy_signature": "GenesisCardSignature",
  "framework": "React + TypeScript + CSS Modules"
}`
    },
    test: {
        filename: 'src/components/GenesisCard.test.tsx',
        code: `import { render, screen } from '@testing-library/react';
import { GenesisCard } from './GenesisCard';

describe('GenesisCard (CMS-123)', () => {
    it('renders Genesis title and default badge', () => {
        render(<GenesisCard title="Genesis Electrified G80" />);
        expect(screen.getByText('Genesis Electrified G80')).toBeInDOM();
        expect(screen.getByText('NEW')).toBeInDOM();
    });
});`
    },
    term: {
        filename: 'Terminal — npm test',
        code: `> npx jest GenesisCard.test.tsx

 PASS  src/components/GenesisCard.test.tsx
  GenesisCard (CMS-123)
    ✓ renders Genesis title and default badge (18 ms)
    ✓ renders custom price and handles click (12 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.942 s
Ran all test suites matching /GenesisCard.test.tsx/i.`
    }
};

function switchIdeTab(tabKey) {
    document.querySelectorAll('.ide-file-tabs .ide-tab').forEach(t => t.classList.remove('active'));
    const btn = document.getElementById('ideTab-' + tabKey);
    if (btn) btn.classList.add('active');

    const file = ideFileContents[tabKey];
    if (!file) return;

    const nameEl = document.getElementById('ideActiveFileName');
    const codeEl = document.getElementById('ideCodeDisplay');
    if (nameEl) nameEl.textContent = file.filename;
    if (codeEl) codeEl.textContent = file.code;
}

let isSimulating = false;

function startIdeAgentSimulation() {
    if (isSimulating) return;
    isSimulating = true;

    const chatContainer = document.getElementById('agentChatMessages');
    const runBtn = document.getElementById('ideRunBtn');
    const promptInput = document.getElementById('agentPromptInput');
    const promptText = promptInput ? promptInput.value || "Implement CMS-123 for Genesis Card component" : "Implement CMS-123 for Genesis Card component";

    if (runBtn) runBtn.disabled = true;

    // Helper to add chat msg
    function appendChatMsg(type, htmlContent) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        msg.innerHTML = htmlContent;
        chatContainer.appendChild(msg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Clear chat
    chatContainer.innerHTML = '';
    appendChatMsg('system', '🚀 Agent Session Started...');

    // Step 1: User prompt
    setTimeout(() => {
        appendChatMsg('user', `👤 <strong>Human:</strong> "${promptText}"`);
    }, 300);

    // Step 2: Orchestrator triggers tools
    setTimeout(() => {
        appendChatMsg('agent', '🤖 <strong>Agent Orchestrator:</strong> Goal understood. Requesting Jira ticket <code>CMS-123</code> &amp; legacy code via MCP...');
    }, 1000);

    // Step 3: MCP Tool Result
    setTimeout(() => {
        appendChatMsg('tool', '🔌 <strong>Jira MCP:</strong> Ticket fetched — <em>"Redesign Genesis Card component with dark glassmorphism styling &amp; badge types"</em>');
        switchIdeTab('context');
    }, 1800);

    // Step 4: DSPy Framework
    setTimeout(() => {
        appendChatMsg('agent', '🧩 <strong>DSPy Framework:</strong> Compiling <code>GenesisCardSignature</code> and optimizing teleprompter instructions...');
        switchIdeTab('sig');
    }, 2800);

    // Step 5: LLM Code Gen
    setTimeout(() => {
        appendChatMsg('agent', '🧠 <strong>LLM Engine:</strong> Generating production-ready <code>GenesisCard.tsx</code> and Jest unit tests...');
        switchIdeTab('tsx');
    }, 3800);

    // Step 6: Test Failure Simulation
    setTimeout(() => {
        appendChatMsg('tool', '🧪 <strong>Test Runner:</strong> Running <code>npm test</code>... ❌ 1 test failed (Missing default badge type parameter).');
        switchIdeTab('term');
        const codeEl = document.getElementById('ideCodeDisplay');
        if (codeEl) {
            codeEl.textContent = `FAIL src/components/GenesisCard.test.tsx
  GenesisCard (CMS-123)
    ✕ renders Genesis title and default badge (24 ms)

  ● GenesisCard (CMS-123) › renders default badge

    TypeError: Cannot read properties of undefined (reading 'primary')
      at GenesisCard (src/components/GenesisCard.tsx:21:40)`;
        }
    }, 5000);

    // Step 7: Self-Correction Loop
    setTimeout(() => {
        appendChatMsg('agent', '🔄 <strong>Self-Correction Loop:</strong> Error trace captured → Context updated → DSPy re-invoked → Applying default prop fix to <code>GenesisCard.tsx</code>...');
        switchIdeTab('tsx');
    }, 6200);

    // Step 8: Retest PASS
    setTimeout(() => {
        appendChatMsg('tool', '🧪 <strong>Test Runner:</strong> Re-running <code>npm test</code>... ✅ 2/2 Tests PASS!');
        switchIdeTab('term');
        const codeEl = document.getElementById('ideCodeDisplay');
        if (codeEl) {
            codeEl.textContent = ideFileContents['term'].code;
        }
    }, 7400);

    // Step 9: Final Pass & Approval
    setTimeout(() => {
        appendChatMsg('agent', '✅ <strong>Agent Complete:</strong> <code>GenesisCard.tsx</code> created, glassmorphic CSS styled, 2/2 unit tests green! Ready for Human Approval &amp; Merge Request.');
        if (runBtn) runBtn.disabled = false;
        isSimulating = false;
    }, 8500);
}


// ==========================================
// SLIDE 15: LINE-BY-LINE INSPECTOR & BUILTIN EXPLORER
// ==========================================
const dspyLineInspectData = {
    sig_import: {
        tag: '📦 TOOLKIT IMPORT',
        title: 'import dspy',
        html: '<p><strong>The Toolkit Import:</strong> Brings in the DSPy framework. Replaces writing long, messy prompt paragraphs with structured, reusable code tools.</p>'
    },
    sig_class: {
        tag: '🧩 THE JOB CONTRACT',
        title: 'class GenesisCardSignature(dspy.Signature):',
        html: '<p><strong>The Job Contract (dspy.Signature):</strong> Like hiring an employee with a clear contract! You define: 1) What info you hand to the AI, and 2) What exact work it must deliver back.</p>'
    },
    sig_doc: {
        tag: '📝 THE JOB DESCRIPTION',
        title: '"""Transform CMS-123 Jira specs..."""',
        html: '<p><strong>The Job Description:</strong> This single sentence tells the AI what it is hired to do. DSPy reads this description so you don\'t have to write 3 pages of system instructions!</p>'
    },
    sig_input: {
        tag: '📥 INTAKE INGREDIENTS',
        title: 'user_request = dspy.InputField(desc="...")',
        html: '<p><strong>Intake Ingredients (InputField):</strong> The raw materials you feed into the AI! Tells the AI: "Here is the human goal, the Jira ticket specs, and the legacy code snippet".</p>'
    },
    sig_output: {
        tag: '📤 GUARANTEED DELIVERABLES',
        title: 'component_tsx = dspy.OutputField(desc="...")',
        html: '<p><strong>Guaranteed Deliverables (OutputField):</strong> Forces the AI to give back clean, structured outputs (like <code>prediction.component_tsx</code>) instead of random conversational chit-chat!</p>'
    },
    mod_class: {
        tag: '🏗️ WORKFLOW MANAGER',
        title: 'class GenesisCardGenerator(dspy.Module):',
        html: '<p><strong>The Workflow Manager (dspy.Module):</strong> A reusable pipeline class that packages your AI reasoning steps, tools, and safety rules together into one clean object.</p>'
    },
    mod_init: {
        tag: '⚙️ WORKSPACE SETUP',
        title: 'def __init__(self): super().__init__()',
        html: '<p><strong>Workspace Setup:</strong> Prepares the AI workspace when your program starts. Connects your reasoning engines and tools (Jira MCP, Git MCP).</p>'
    },
    cot: {
        tag: '🧠 SHOW YOUR WORK ENGINE',
        title: 'self.thinker = dspy.ChainOfThought(GenesisCardSignature)',
        html: '<p><strong>Show Your Work (ChainOfThought):</strong> Forces the AI to write down "Here is my step-by-step thinking..." <em>before</em> generating code. This prevents silly mistakes and boosts accuracy by 35%!</p>'
    },
    react: {
        tag: '🤖 AUTONOMOUS ASSISTANT',
        title: 'self.agent = dspy.ReAct(GenesisCardSignature, tools=[...])',
        html: '<p><strong>The Do-Check-Fix Assistant (ReAct):</strong> An autonomous loop! The AI tries an action (like fetching a Jira ticket), inspects what happened, adjusts its plan, and loops until done.</p>'
    },
    mod_forward: {
        tag: '▶ RUN THE WORKFLOW',
        title: 'def forward(self, user_request, jira_ticket...):',
        html: '<p><strong>The "Go" Button (forward):</strong> Takes your incoming data, runs it through the reasoning steps, enforces safety rules, and returns the finished code.</p>'
    },
    suggest: {
        tag: '🛡️ QUALITY INSPECTOR',
        title: 'dspy.Suggest(len(legacy_html) > 0, "...")',
        html: '<p><strong>Quality Inspector (Suggest & Assert):</strong> A bouncer rule! If the AI generates empty code or breaks a rule, it automatically says: "Stop! Fix this error and try again".</p>'
    },
    predict_call: {
        tag: '⚡ EXECUTE THINKING',
        title: 'prediction = self.thinker(...)',
        html: '<p><strong>Execute Thinking:</strong> Runs the Chain-of-Thought reasoning engine with your exact input data to produce the final component code.</p>'
    },
    result_ret: {
        tag: '📦 RETURN FINISHED RESULT',
        title: 'return prediction',
        html: '<p><strong>Return Result:</strong> Hands back the compiled output object containing <code>prediction.component_tsx</code> and <code>prediction.reasoning</code> directly to your app.</p>'
    },
    teleprompter: {
        tag: '⚡ AUTO-TUNING COACH',
        title: 'teleprompter = dspy.teleprompt.BootstrapFewShot(...)',
        html: '<p><strong>The Auto-Tuner (teleprompt):</strong> Instead of spending hours manually tweaking prompt text, this auto-tests 50 prompt variants against real test cases and picks the highest-scoring winner!</p>'
    },
    compile: {
        tag: '🚀 SAVE OPTIMIZED PROGRAM',
        title: 'compiled_agent = teleprompter.compile(...)',
        html: '<p><strong>Save Optimized Program:</strong> Compiles and saves the winning auto-tuned prompt configuration so your AI runs faster, cheaper, and with maximum accuracy every time!</p>'
    }
};

function inspectDspyLine(key, el) {
    if (el) {
        document.querySelectorAll('.code-line-row').forEach(row => row.classList.remove('active'));
        el.classList.add('active');
    }

    const data = dspyLineInspectData[key];
    if (!data) return;

    const tagEl = document.getElementById('dspyInspTag');
    const titleEl = document.getElementById('dspyInspTitle');
    const bodyEl = document.getElementById('dspyInspBody');

    if (tagEl) tagEl.textContent = data.tag;
    if (titleEl) titleEl.textContent = data.title;
    if (bodyEl) bodyEl.innerHTML = data.html;
}

function switchDspyBuiltin(key, btn) {
    document.querySelectorAll('.explorer-tabs .ex-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.explorer-panes .ex-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('exp-pane-' + key);
    if (pane) pane.classList.add('active');
}

function switchDspyMasterSection(secKey, btn) {
    document.querySelectorAll('.dspy-master-tabs .master-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.dspy-master-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('dspy-sec-' + secKey);
    if (pane) pane.classList.add('active');
}





