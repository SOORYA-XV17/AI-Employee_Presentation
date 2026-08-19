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
