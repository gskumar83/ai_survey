/* =========================================================
   VISTERIA INSIGHTPULSE AI — LANDING PAGE CONTROLLER
   Neural Canvas, Header Dynamics, Eagle AI Assistant
   Authentication & Backend Integration
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. AMBIENT NEURAL NETWORK BACKGROUND CANVAS
       ===================================================== */

    const canvas = document.getElementById("neuralCanvas");

    if (canvas) {
        const ctx = canvas.getContext("2d");

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let nodes = [];

        const nodeCount = Math.min(
            Math.floor(width / 35),
            45
        );

        function initNodes() {
            nodes = [];

            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: (Math.random() - 0.5) * 0.45,
                    radius: Math.random() * 2 + 1.2,
                    alpha: Math.random() * 0.45 + 0.15
                });
            }
        }

        initNodes();

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;

            initNodes();
        });

        function drawNeuralCanvas() {

            ctx.clearRect(
                0,
                0,
                width,
                height
            );

            const maxDistance = 140;

            /* ---------------------------------------------
               CONNECT NODES
            --------------------------------------------- */

            for (let i = 0; i < nodes.length; i++) {

                for (let j = i + 1; j < nodes.length; j++) {

                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;

                    const distance = Math.sqrt(
                        dx * dx + dy * dy
                    );

                    if (distance < maxDistance) {

                        const lineAlpha =
                            (1 - distance / maxDistance) * 0.22;

                        ctx.beginPath();

                        ctx.moveTo(
                            nodes[i].x,
                            nodes[i].y
                        );

                        ctx.lineTo(
                            nodes[j].x,
                            nodes[j].y
                        );

                        ctx.strokeStyle =
                            `rgba(23, 105, 213, ${lineAlpha})`;

                        ctx.lineWidth = 0.85;

                        ctx.stroke();
                    }
                }
            }

            /* ---------------------------------------------
               DRAW NODES
            --------------------------------------------- */

            for (let i = 0; i < nodes.length; i++) {

                const node = nodes[i];

                node.x += node.vx;
                node.y += node.vy;

                if (
                    node.x < 0 ||
                    node.x > width
                ) {
                    node.vx *= -1;
                }

                if (
                    node.y < 0 ||
                    node.y > height
                ) {
                    node.vy *= -1;
                }

                ctx.beginPath();

                ctx.arc(
                    node.x,
                    node.y,
                    node.radius,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    `rgba(37, 125, 235, ${node.alpha})`;

                ctx.fill();
            }

            requestAnimationFrame(drawNeuralCanvas);
        }

        drawNeuralCanvas();
    }

    /* =====================================================
       1B. ANIMATED DIGITAL 3D GLOBE VISUALIZATION
       (Rendered behind the left welcome panel card)
       ===================================================== */

    const digitalGlobeCanvas = document.getElementById("digitalGlobeCanvas");

    if (digitalGlobeCanvas) {
        const gCtx = digitalGlobeCanvas.getContext("2d");
        const gSize = 480;
        digitalGlobeCanvas.width = gSize;
        digitalGlobeCanvas.height = gSize;

        const gCenterX = gSize / 2;
        const gCenterY = gSize / 2;
        const gRadius = 180;

        // 1. Latitude parallels (rings)
        const latRings = 9;
        const ringSegments = 40;
        const parallels = [];
        for (let i = 1; i <= latRings; i++) {
            const phi = (Math.PI * i) / (latRings + 1);
            const y = gRadius * Math.cos(phi);
            const r = gRadius * Math.sin(phi);
            const pts = [];
            for (let j = 0; j <= ringSegments; j++) {
                const theta = (2 * Math.PI * j) / ringSegments;
                pts.push({ x: r * Math.sin(theta), y: y, z: r * Math.cos(theta) });
            }
            parallels.push(pts);
        }

        // 2. Longitude meridians
        const numMeridians = 12;
        const meridianSegments = 40;
        const meridians = [];
        for (let i = 0; i < numMeridians; i++) {
            const theta = (Math.PI * i) / numMeridians;
            const pts = [];
            for (let j = 0; j <= meridianSegments; j++) {
                const phi = (2 * Math.PI * j) / meridianSegments;
                pts.push({
                    x: gRadius * Math.sin(phi) * Math.sin(theta),
                    y: gRadius * Math.cos(phi),
                    z: gRadius * Math.sin(phi) * Math.cos(theta)
                });
            }
            meridians.push(pts);
        }

        // 3. Surface node particles
        const numParticles = 110;
        const particles = [];
        for (let i = 0; i < numParticles; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2 * Math.PI;
            const phi = Math.acos(2 * v - 1);
            particles.push({
                x: gRadius * Math.sin(phi) * Math.cos(theta),
                y: gRadius * Math.sin(phi) * Math.sin(theta),
                z: gRadius * Math.cos(phi),
                size: Math.random() * 1.6 + 1.1
            });
        }

        let gRotY = 0;
        const gRotX = 0.24;
        const gRotSpeedY = 0.005;

        function drawDigitalGlobe() {
            gCtx.clearRect(0, 0, gSize, gSize);
            gRotY += gRotSpeedY;

            const cosY = Math.cos(gRotY);
            const sinY = Math.sin(gRotY);
            const cosX = Math.cos(gRotX);
            const sinX = Math.sin(gRotX);

            function project(pt) {
                const x1 = pt.x * cosY + pt.z * sinY;
                const z1 = -pt.x * sinY + pt.z * cosY;
                const y2 = pt.y * cosX - z1 * sinX;
                const z2 = pt.y * sinX + z1 * cosX;
                const scale = 400 / (400 + z2);
                return {
                    x: gCenterX + x1 * scale,
                    y: gCenterY + y2 * scale,
                    z: z2,
                    scale: scale
                };
            }

            // A. Atmosphere Radial Glow
            const grad = gCtx.createRadialGradient(gCenterX, gCenterY, gRadius * 0.15, gCenterX, gCenterY, gRadius * 1.12);
            grad.addColorStop(0, "rgba(38, 198, 218, 0.12)");
            grad.addColorStop(0.65, "rgba(15, 174, 170, 0.05)");
            grad.addColorStop(1, "rgba(15, 174, 170, 0)");
            gCtx.fillStyle = grad;
            gCtx.beginPath();
            gCtx.arc(gCenterX, gCenterY, gRadius * 1.12, 0, Math.PI * 2);
            gCtx.fill();

            // B. Outer subtle perimeter ring
            gCtx.beginPath();
            gCtx.arc(gCenterX, gCenterY, gRadius, 0, Math.PI * 2);
            gCtx.strokeStyle = "rgba(38, 198, 218, 0.25)";
            gCtx.lineWidth = 1.2;
            gCtx.stroke();

            // C. Draw Parallels (Latitude lines)
            parallels.forEach(ring => {
                for (let i = 0; i < ring.length - 1; i++) {
                    const p1 = project(ring[i]);
                    const p2 = project(ring[i + 1]);
                    const avgZ = (p1.z + p2.z) / 2;
                    const isFront = avgZ > 0;

                    gCtx.beginPath();
                    gCtx.moveTo(p1.x, p1.y);
                    gCtx.lineTo(p2.x, p2.y);
                    if (isFront) {
                        const norm = Math.max(0.1, (avgZ / gRadius));
                        gCtx.strokeStyle = "rgba(38, 198, 218, " + (0.18 + 0.28 * norm).toFixed(3) + ")";
                        gCtx.lineWidth = 1.0;
                    } else {
                        gCtx.strokeStyle = "rgba(15, 174, 170, 0.06)";
                        gCtx.lineWidth = 0.7;
                    }
                    gCtx.stroke();
                }
            });

            // D. Draw Meridians (Longitude lines)
            meridians.forEach(meridian => {
                for (let i = 0; i < meridian.length - 1; i++) {
                    const p1 = project(meridian[i]);
                    const p2 = project(meridian[i + 1]);
                    const avgZ = (p1.z + p2.z) / 2;
                    const isFront = avgZ > 0;

                    gCtx.beginPath();
                    gCtx.moveTo(p1.x, p1.y);
                    gCtx.lineTo(p2.x, p2.y);
                    if (isFront) {
                        const norm = Math.max(0.1, (avgZ / gRadius));
                        gCtx.strokeStyle = "rgba(38, 198, 218, " + (0.16 + 0.26 * norm).toFixed(3) + ")";
                        gCtx.lineWidth = 1.0;
                    } else {
                        gCtx.strokeStyle = "rgba(15, 174, 170, 0.06)";
                        gCtx.lineWidth = 0.7;
                    }
                    gCtx.stroke();
                }
            });

            // E. Draw Surface Particles & Geodesic Connections
            const projParticles = particles.map(p => {
                const pr = project(p);
                return { x: pr.x, y: pr.y, z: pr.z, size: p.size, scale: pr.scale };
            });

            for (let i = 0; i < projParticles.length; i++) {
                const p1 = projParticles[i];
                if (p1.z < -20) continue;
                for (let j = i + 1; j < projParticles.length; j++) {
                    const p2 = projParticles[j];
                    if (p2.z < -20) continue;
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 1440) { // < 38px
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / 38) * 0.35;
                        gCtx.beginPath();
                        gCtx.moveTo(p1.x, p1.y);
                        gCtx.lineTo(p2.x, p2.y);
                        gCtx.strokeStyle = "rgba(38, 198, 218, " + alpha.toFixed(3) + ")";
                        gCtx.lineWidth = 0.8;
                        gCtx.stroke();
                    }
                }
            }

            projParticles.forEach(p => {
                const norm = (p.z + gRadius) / (2 * gRadius);
                if (norm < 0.12) return;
                const r = Math.max(0.7, p.size * p.scale * (0.35 + 0.65 * norm));
                const a = Math.min(0.95, Math.max(0.15, norm * 0.95));

                gCtx.beginPath();
                gCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
                if (norm > 0.65) {
                    gCtx.fillStyle = "rgba(38, 198, 218, " + a.toFixed(3) + ")";
                    gCtx.shadowColor = "rgba(38, 198, 218, 0.35)";
                    gCtx.shadowBlur = 4;
                } else {
                    gCtx.fillStyle = "rgba(15, 174, 170, " + (a * 0.75).toFixed(3) + ")";
                    gCtx.shadowBlur = 0;
                }
                gCtx.fill();
            });
            gCtx.shadowBlur = 0;

            requestAnimationFrame(drawDigitalGlobe);
        }

        drawDigitalGlobe();
    }



    /* =====================================================
       2. HEADER SCROLL DYNAMICS
       ===================================================== */

    const header =
        document.querySelector(".landing-header");

    if (header) {

        window.addEventListener(
            "scroll",
            () => {

                if (window.scrollY > 25) {
                    header.classList.add("scrolled");
                } else {
                    header.classList.remove("scrolled");
                }

            },
            { passive: true }
        );
    }


    
    /* =====================================================
       2B. THEME TOGGLE SWITCH & REMEMBER ME PREFERENCES
       ===================================================== */
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
        const savedTheme = localStorage.getItem("visteria_theme") ||
            (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        if (savedTheme === "dark") {
            document.body.classList.add("dark");
            themeBtn.classList.add("is-dark");
            themeBtn.setAttribute("aria-checked", "true");
        } else {
            document.body.classList.remove("dark");
            themeBtn.classList.remove("is-dark");
            themeBtn.setAttribute("aria-checked", "false");
        }

        themeBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");
            themeBtn.classList.toggle("is-dark", isDark);
            themeBtn.setAttribute("aria-checked", isDark ? "true" : "false");
            localStorage.setItem("visteria_theme", isDark ? "dark" : "light");
        });
    }

    // Restore Remember Me on page load
    const rememberMeBox = document.getElementById("rememberMe");
    const signinInput = document.getElementById("signinEmployeeId");
    if (rememberMeBox && signinInput) {
        const isRemembered = localStorage.getItem("visteria_remember_me") === "true";
        const savedIdentifier = localStorage.getItem("visteria_saved_identifier");
        if (isRemembered && savedIdentifier) {
            signinInput.value = savedIdentifier;
            rememberMeBox.checked = true;
        }
    }

    // Mount Multilingual Selector in Header if slot exists
    if (window.I18n && typeof window.I18n.mountLanguageSelector === 'function') {
        const langSlot = document.getElementById("langSelectorSlot");
        if (langSlot) {
            window.I18n.mountLanguageSelector('#langSelectorSlot');
        }
    }


    /* =====================================================
       3. EAGLE AI ASSISTANT
       ===================================================== */

    const eagleContainer =
        document.getElementById(
            "eagleAssistantContainer"
        );

    const eagleAvatar =
        document.getElementById(
            "eagleAvatar"
        );

    const eagleChatBox =
        document.getElementById(
            "eagleChatBox"
        );

    const eagleChatCloseBtn =
        document.getElementById(
            "eagleChatCloseBtn"
        );

    const eagleChatMessages =
        document.getElementById(
            "eagleChatMessages"
        );

    const eagleChatForm =
        document.getElementById(
            "eagleChatForm"
        );

    const eagleChatInput =
        document.getElementById(
            "eagleChatInput"
        );

    const quickChips =
        document.querySelectorAll(
            ".quick-chip"
        );


    /* =====================================================
       3A. EAGLE ENTRANCE TIMING

       Visible initially
       Hide after 10 seconds
       Reappear after 2 seconds
       ===================================================== */

    if (eagleContainer) {

        setTimeout(() => {

            eagleContainer.classList.add(
                "eagle-hidden"
            );

            setTimeout(() => {

                eagleContainer.classList.remove(
                    "eagle-hidden"
                );

            }, 2000);

        }, 10000);
    }


    /* =====================================================
       3B. EAGLE DRAG & DROP
       ===================================================== */

    let isDragging = false;
    let hasMoved = false;

    let startX = 0;
    let startY = 0;

    let initialLeft = 28;
    let initialBottom = 28;


    function getPointerPos(e) {

        if (
            e.touches &&
            e.touches.length > 0
        ) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }

        return {
            x: e.clientX,
            y: e.clientY
        };
    }


    function onDragStart(e) {

        if (
            e.target.closest(
                ".eagle-chat-box"
            )
        ) {
            return;
        }

        const pos =
            getPointerPos(e);

        startX = pos.x;
        startY = pos.y;

        hasMoved = false;
        isDragging = true;

        const rect =
            eagleContainer.getBoundingClientRect();

        initialLeft =
            rect.left;

        initialBottom =
            window.innerHeight -
            rect.bottom;


        document.addEventListener(
            "mousemove",
            onDragMove
        );

        document.addEventListener(
            "mouseup",
            onDragEnd
        );

        document.addEventListener(
            "touchmove",
            onDragMove,
            { passive: false }
        );

        document.addEventListener(
            "touchend",
            onDragEnd
        );
    }


    function onDragMove(e) {

        if (!isDragging) {
            return;
        }

        const pos =
            getPointerPos(e);

        const deltaX =
            pos.x - startX;

        const deltaY =
            pos.y - startY;


        if (
            Math.abs(deltaX) > 4 ||
            Math.abs(deltaY) > 4
        ) {

            hasMoved = true;

            if (e.cancelable) {
                e.preventDefault();
            }


            let newLeft =
                initialLeft + deltaX;

            let newBottom =
                initialBottom - deltaY;


            const containerWidth =
                eagleAvatar.offsetWidth;

            const containerHeight =
                eagleAvatar.offsetHeight;

            const padding = 12;


            const maxLeft =
                window.innerWidth -
                containerWidth -
                padding;

            const maxBottom =
                window.innerHeight -
                containerHeight -
                padding;


            newLeft =
                Math.max(
                    padding,
                    Math.min(
                        newLeft,
                        maxLeft
                    )
                );

            newBottom =
                Math.max(
                    padding,
                    Math.min(
                        newBottom,
                        maxBottom
                    )
                );


            eagleContainer.style.left =
                `${newLeft}px`;

            eagleContainer.style.bottom =
                `${newBottom}px`;


            /* ---------------------------------------------
               CHAT BOX POSITION
            --------------------------------------------- */

            if (
                newLeft >
                window.innerWidth / 2
            ) {

                eagleChatBox.style.left =
                    "auto";

                eagleChatBox.style.right =
                    "88px";

                eagleChatBox.style.transformOrigin =
                    "bottom right";

            } else {

                eagleChatBox.style.left =
                    "88px";

                eagleChatBox.style.right =
                    "auto";

                eagleChatBox.style.transformOrigin =
                    "bottom left";
            }
        }
    }


    function onDragEnd() {

        if (!isDragging) {
            return;
        }

        isDragging = false;


        document.removeEventListener(
            "mousemove",
            onDragMove
        );

        document.removeEventListener(
            "mouseup",
            onDragEnd
        );

        document.removeEventListener(
            "touchmove",
            onDragMove
        );

        document.removeEventListener(
            "touchend",
            onDragEnd
        );
    }


    if (eagleAvatar) {

        eagleAvatar.addEventListener(
            "mousedown",
            onDragStart
        );

        eagleAvatar.addEventListener(
            "touchstart",
            onDragStart,
            { passive: true }
        );


        /* ---------------------------------------------
           CLICK TO OPEN CHAT
        --------------------------------------------- */

        eagleAvatar.addEventListener(
            "click",
            () => {

                if (hasMoved) {
                    return;
                }

                toggleEagleChat();
            }
        );


        /* ---------------------------------------------
           KEYBOARD ACCESSIBILITY
        --------------------------------------------- */

        eagleAvatar.addEventListener(
            "keydown",
            (e) => {

                if (
                    e.key === "Enter" ||
                    e.key === " "
                ) {

                    e.preventDefault();

                    toggleEagleChat();
                }
            }
        );
    }


    /* =====================================================
       3C. EAGLE CHAT TOGGLE
       ===================================================== */

    function toggleEagleChat(
        forceOpen = null
    ) {

        if (
            !eagleChatBox ||
            !eagleAvatar
        ) {
            return;
        }


        const isOpen =
            forceOpen !== null
                ? forceOpen
                : !eagleChatBox.classList.contains(
                    "chat-open"
                );


        if (isOpen) {

            eagleChatBox.classList.add(
                "chat-open"
            );

            eagleChatBox.setAttribute(
                "aria-hidden",
                "false"
            );

            eagleAvatar.setAttribute(
                "aria-expanded",
                "true"
            );


            if (eagleChatInput) {
                eagleChatInput.focus();
            }

        } else {

            eagleChatBox.classList.remove(
                "chat-open"
            );

            eagleChatBox.setAttribute(
                "aria-hidden",
                "true"
            );

            eagleAvatar.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }


    /* =====================================================
       CLOSE EAGLE CHAT
       ===================================================== */

    if (eagleChatCloseBtn) {

        eagleChatCloseBtn.addEventListener(
            "click",
            () => {

                toggleEagleChat(false);

            }
        );
    }


    /* =====================================================
       CLICK OUTSIDE EAGLE
       ===================================================== */

    document.addEventListener(
        "click",
        (e) => {

            if (
                eagleChatBox &&
                eagleChatBox.classList.contains(
                    "chat-open"
                ) &&
                eagleContainer &&
                !eagleContainer.contains(
                    e.target
                )
            ) {

                toggleEagleChat(false);
            }
        }
    );


    /* =====================================================
       3D. EAGLE KNOWLEDGE BASE
       ===================================================== */

    const eagleKnowledgeBase = {

        "what is insightpulse ai?":
            "Visteria InsightPulse AI is an enterprise employee survey and analytics platform that transforms authentic workforce feedback into actionable organizational insights using intelligent natural language processing.",

        "is my feedback confidential?":
            "Yes, 100%! InsightPulse AI is built with privacy-first architecture. Individual responses are encrypted, anonymized, and aggregated into high-level patterns so your personal identity is never shared.",

        "how long does the survey take?":
            "Most surveys take only 5 to 7 minutes to complete! Questions are intuitive, streamlined, and designed for a comfortable, distraction-free experience.",

        "why should i complete the survey?":
            "Your voice directly shapes your workplace culture, leadership decisions, benefits, and team workflows. Every response provides vital signals to build a better working environment!"
    };


    /* =====================================================
       APPEND EAGLE MESSAGE
       ===================================================== */

    function appendMessage(
        sender,
        htmlContent
    ) {

        if (!eagleChatMessages) {
            return;
        }


        const bubble =
            document.createElement("div");

        bubble.className =
            `chat-bubble ${sender === "user"
                ? "user-bubble"
                : "eagle-bubble"
            }`;


        bubble.innerHTML =
            `<p>${htmlContent}</p>`;


        eagleChatMessages.appendChild(
            bubble
        );


        eagleChatMessages.scrollTop =
            eagleChatMessages.scrollHeight;
    }


    /* =====================================================
       EAGLE LOCAL RESPONSE
       ===================================================== */

    function generateEagleResponse(
        userQuery
    ) {

        const cleaned =
            userQuery
                .trim()
                .toLowerCase();


        /* ---------------------------------------------
           DIRECT MATCH
        --------------------------------------------- */

        for (
            const [key, answer]
            of Object.entries(
                eagleKnowledgeBase
            )
        ) {

            if (
                cleaned.includes(
                    key.replace("?", "")
                ) ||
                key.includes(cleaned)
            ) {

                return answer;
            }
        }


        /* ---------------------------------------------
           PRIVACY
        --------------------------------------------- */

        if (
            cleaned.includes("confidential") ||
            cleaned.includes("privacy") ||
            cleaned.includes("safe") ||
            cleaned.includes("anonymous")
        ) {

            return eagleKnowledgeBase[
                "is my feedback confidential?"
            ];
        }


        /* ---------------------------------------------
           SURVEY TIME
        --------------------------------------------- */

        if (
            cleaned.includes("time") ||
            cleaned.includes("long") ||
            cleaned.includes("duration") ||
            cleaned.includes("minutes")
        ) {

            return eagleKnowledgeBase[
                "how long does the survey take?"
            ];
        }


        /* ---------------------------------------------
           PURPOSE
        --------------------------------------------- */

        if (
            cleaned.includes("why") ||
            cleaned.includes("importance") ||
            cleaned.includes("purpose") ||
            cleaned.includes("benefit")
        ) {

            return eagleKnowledgeBase[
                "why should i complete the survey?"
            ];
        }


        /* ---------------------------------------------
           ABOUT PLATFORM
        --------------------------------------------- */

        if (
            cleaned.includes("what") ||
            cleaned.includes("about") ||
            cleaned.includes("insightpulse") ||
            cleaned.includes("visteria")
        ) {

            return eagleKnowledgeBase[
                "what is insightpulse ai?"
            ];
        }


        /* ---------------------------------------------
           LOGIN / SIGNUP
        --------------------------------------------- */

        if (
            cleaned.includes("start") ||
            cleaned.includes("login") ||
            cleaned.includes("sign in") ||
            cleaned.includes("sign up") ||
            cleaned.includes("take survey")
        ) {

            return "You can create your employee account first, or sign into your existing account using the authentication panel.";
        }


        /* ---------------------------------------------
           GREETING
        --------------------------------------------- */

        if (
            cleaned.includes("hello") ||
            cleaned.includes("hi") ||
            cleaned.includes("hey")
        ) {

            return "Hello there! 😊 I'm Eagle, your AI survey assistant. How can I help you today?";
        }


        /* ---------------------------------------------
           FALLBACK
        --------------------------------------------- */

        return "I'm here to help with questions about your employee survey, privacy protection, and Visteria InsightPulse AI. Feel free to ask me about the survey process!";
    }


    /* =====================================================
       EAGLE API CHAT
       ===================================================== */

    async function handleUserQuestion(
        questionText
    ) {

        if (!questionText.trim()) {
            return;
        }


        appendMessage(
            "user",
            questionText
        );


        /* ---------------------------------------------
           THINKING INDICATOR
        --------------------------------------------- */

        const thinkingBubble =
            document.createElement("div");

        thinkingBubble.className =
            "chat-bubble eagle-bubble thinking-bubble";

        thinkingBubble.innerHTML =
            `<p style="display:flex;align-items:center;gap:6px;opacity:0.8;">
                <span style="animation:spin 1s infinite linear;display:inline-block;">
                    ⚡
                </span>
                Eagle AI thinking...
            </p>`;


        if (eagleChatMessages) {

            eagleChatMessages.appendChild(
                thinkingBubble
            );

            eagleChatMessages.scrollTop =
                eagleChatMessages.scrollHeight;
        }


        try {

            let reply = "";


            /* ---------------------------------------------
               USE EXISTING API METHOD
            --------------------------------------------- */

            if (
                window.VisteriaAPI?.employee?.chatWithEagle
            ) {

                const res =
                    await window.VisteriaAPI.employee.chatWithEagle(
                        questionText
                    );


                reply =
                    res?.data?.reply ||
                    res?.reply;
            }


            /* ---------------------------------------------
               DIRECT API FALLBACK
            --------------------------------------------- */

            else {

                const token =
                    window.VisteriaAPI?.auth?.getEmployeeToken?.() ||
                    localStorage.getItem(
                        "employee_accessToken"
                    );


                const response =
                    await fetch(
                        "/api/employee/assistant/chat",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                ...(token
                                    ? {
                                        "Authorization":
                                            `Bearer ${token}`
                                    }
                                    : {})
                            },

                            body: JSON.stringify({
                                message:
                                    questionText
                            })
                        }
                    );


                const data =
                    await response.json();


                reply =
                    data?.data?.reply ||
                    data?.reply;
            }


            /* ---------------------------------------------
               REMOVE THINKING
            --------------------------------------------- */

            if (
                thinkingBubble &&
                thinkingBubble.parentNode
            ) {

                thinkingBubble.remove();
            }


            /* ---------------------------------------------
               SHOW RESPONSE
            --------------------------------------------- */

            appendMessage(
                "eagle",
                reply ||
                generateEagleResponse(
                    questionText
                )
            );

        } catch (err) {

            console.warn(
                "Eagle Assistant live API fallback:",
                err
            );


            if (
                thinkingBubble &&
                thinkingBubble.parentNode
            ) {

                thinkingBubble.remove();
            }


            appendMessage(
                "eagle",
                generateEagleResponse(
                    questionText
                )
            );
        }
    }


    /* =====================================================
       QUICK QUESTION CHIPS
       ===================================================== */

    quickChips.forEach(
        (chip) => {

            chip.addEventListener(
                "click",
                () => {

                    const question =
                        chip.getAttribute(
                            "data-question"
                        ) ||
                        chip.textContent.trim();


                    handleUserQuestion(
                        question
                    );
                }
            );
        }
    );


    /* =====================================================
       EAGLE FREE-FORM CHAT
       ===================================================== */

    if (
        eagleChatForm &&
        eagleChatInput
    ) {

        eagleChatForm.addEventListener(
            "submit",
            (e) => {

                e.preventDefault();


                const text =
                    eagleChatInput.value.trim();


                if (text) {

                    handleUserQuestion(
                        text
                    );

                    eagleChatInput.value = "";
                }
            }
        );
    }


    /* =====================================================
       4. AUTHENTICATION CONTROLLER
       ===================================================== */

    const authTabs =
        document.querySelector(
            ".auth-tabs"
        );

    const tabSignIn =
        document.getElementById(
            "tabSignIn"
        );

    const tabSignUp =
        document.getElementById(
            "tabSignUp"
        );

    const panelSignIn =
        document.getElementById(
            "panelSignIn"
        );

    const panelSignUp =
        document.getElementById(
            "panelSignUp"
        );

    const linkToSignUp =
        document.getElementById(
            "linkToSignUp"
        );

    const linkToSignIn =
        document.getElementById(
            "linkToSignIn"
        );

    const toast =
        document.getElementById(
            "notificationToast"
        );


    /* =====================================================
       TOAST NOTIFICATION
       ===================================================== */

    function showToast(
        title,
        desc,
        type = "success"
    ) {

        if (!toast) {
            return;
        }


        const iconEl =
            toast.querySelector(
                ".toast-icon"
            );

        const titleEl =
            toast.querySelector(
                ".toast-title"
            );

        const descEl =
            toast.querySelector(
                ".toast-desc"
            );


        toast.className =
            `notification-toast toast-${type}`;


        if (titleEl) {
            titleEl.textContent =
                title;
        }


        if (descEl) {
            descEl.textContent =
                desc;
        }


        if (iconEl) {

            iconEl.textContent =
                type === "success"
                    ? "✓"
                    : type === "error"
                        ? "✕"
                        : "ℹ";
        }


        toast.classList.add("show");


        clearTimeout(
            toast._timer
        );


        toast._timer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                4000
            );
    }


    /* =====================================================
       4A. SWITCH AUTH TAB

       signup = CREATE ACCOUNT
       signin = SIGN IN
       ===================================================== */

    function switchAuthTab(
        targetTab
    ) {
        const panelForgot = document.getElementById("panelForgot");
        const panelReset = document.getElementById("panelReset");

        if (targetTab === "forgot") {
            if (authTabs) authTabs.style.display = "none";
            if (panelSignIn) panelSignIn.classList.remove("active-panel");
            if (panelSignUp) panelSignUp.classList.remove("active-panel");
            if (panelReset) panelReset.style.display = "none";
            if (panelForgot) {
                panelForgot.style.display = "block";
                panelForgot.classList.add("active-panel");
            }
            return;
        }

        if (targetTab === "reset") {
            if (authTabs) authTabs.style.display = "none";
            if (panelSignIn) panelSignIn.classList.remove("active-panel");
            if (panelSignUp) panelSignUp.classList.remove("active-panel");
            if (panelForgot) panelForgot.style.display = "none";
            if (panelReset) {
                panelReset.style.display = "block";
                panelReset.classList.add("active-panel");
            }
            return;
        }

        // Show tabs for signin and signup
        if (authTabs) authTabs.style.display = "flex";
        if (panelForgot) panelForgot.style.display = "none";
        if (panelReset) panelReset.style.display = "none";

        if (targetTab === "signup") {

            /* ---------------------------------------------
               AUTH TAB STATE
            --------------------------------------------- */

            if (authTabs) {

                authTabs.setAttribute(
                    "data-active",
                    "signup"
                );
            }


            /* ---------------------------------------------
               SIGN IN TAB
            --------------------------------------------- */

            if (tabSignIn) {

                tabSignIn.classList.remove(
                    "active"
                );

                tabSignIn.setAttribute(
                    "aria-selected",
                    "false"
                );
            }


            /* ---------------------------------------------
               CREATE ACCOUNT TAB
            --------------------------------------------- */

            if (tabSignUp) {

                tabSignUp.classList.add(
                    "active"
                );

                tabSignUp.setAttribute(
                    "aria-selected",
                    "true"
                );
            }


            /* ---------------------------------------------
               PANELS
            --------------------------------------------- */

            if (panelSignIn) {

                panelSignIn.classList.remove(
                    "active-panel"
                );
            }


            if (panelSignUp) {

                panelSignUp.classList.add(
                    "active-panel"
                );

                if (typeof loadSignupDropdowns === "function") {
                    loadSignupDropdowns();
                }
            }

        } else {

            /* ---------------------------------------------
               SIGN IN ACTIVE
            --------------------------------------------- */

            if (authTabs) {

                authTabs.removeAttribute(
                    "data-active"
                );
            }


            /* ---------------------------------------------
               CREATE ACCOUNT TAB OFF
            --------------------------------------------- */

            if (tabSignUp) {

                tabSignUp.classList.remove(
                    "active"
                );

                tabSignUp.setAttribute(
                    "aria-selected",
                    "false"
                );
            }


            /* ---------------------------------------------
               SIGN IN TAB ON
            --------------------------------------------- */

            if (tabSignIn) {

                tabSignIn.classList.add(
                    "active"
                );

                tabSignIn.setAttribute(
                    "aria-selected",
                    "true"
                );
            }


            /* ---------------------------------------------
               PANELS
            --------------------------------------------- */

            if (panelSignUp) {

                panelSignUp.classList.remove(
                    "active-panel"
                );
            }


            if (panelSignIn) {

                panelSignIn.classList.add(
                    "active-panel"
                );
            }
        }
    }


    /* =====================================================
       AUTH TAB CLICK EVENTS
       ===================================================== */

    if (tabSignIn) {

        tabSignIn.addEventListener(
            "click",
            () => {

                switchAuthTab(
                    "signin"
                );
            }
        );
    }


    if (tabSignUp) {

        tabSignUp.addEventListener(
            "click",
            () => {

                switchAuthTab(
                    "signup"
                );
            }
        );
    }


    if (linkToSignUp) {

        linkToSignUp.addEventListener(
            "click",
            (e) => {

                e.preventDefault();

                switchAuthTab(
                    "signup"
                );
            }
        );
    }


    if (linkToSignIn) {

        linkToSignIn.addEventListener(
            "click",
            (e) => {

                e.preventDefault();

                switchAuthTab(
                    "signin"
                );
            }
        );
    }


    /* =====================================================
       5. PASSWORD VISIBILITY TOGGLE
       ===================================================== */

    const toggleBtns =
        document.querySelectorAll(
            ".btn-toggle-password"
        );


    toggleBtns.forEach(
        (btn) => {

            btn.addEventListener(
                "click",
                () => {

                    const targetId =
                        btn.getAttribute(
                            "data-target"
                        );


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {
                        return;
                    }


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";


                        btn.innerHTML =
                            `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>`;


                        btn.setAttribute(
                            "title",
                            "Hide password"
                        );

                    } else {

                        input.type =
                            "password";


                        btn.innerHTML =
                            `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>`;


                        btn.setAttribute(
                            "title",
                            "Show password"
                        );
                    }
                }
            );
        }
    );


    /* =====================================================
       6. FORGOT PASSWORD
       ===================================================== */

    const forgotPwBtn = document.getElementById("forgotPasswordBtn");
    const linkBackToSignIn = document.getElementById("linkBackToSignIn");
    const formForgot = document.getElementById("formForgot");
    const formReset = document.getElementById("formReset");

    if (forgotPwBtn) {
        forgotPwBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab("forgot");
        });
    }

    if (linkBackToSignIn) {
        linkBackToSignIn.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab("signin");
        });
    }

    // Submit Forgot Password Request
    if (formForgot) {
        formForgot.addEventListener("submit", async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("forgotEmail");
            const email = emailInput?.value?.trim();
            if (!email) {
                showToast("Email Required", "Please enter your registered work email address.", "error");
                return;
            }

            const submitBtn = formForgot.querySelector('button[type="submit"]');
            const origHtml = submitBtn ? submitBtn.innerHTML : "";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Processing Request...</span>';
            }

            try {
                const apiClient = window.VisteriaAPI || window.api;
                const res = await (apiClient?.auth?.forgotPasswordEmployee ? apiClient.auth.forgotPasswordEmployee(email) : fetch('/api/auth/employee/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                }).then(r => r.json()));

                if (res && res.emailConfigured === false) {
                    showToast("Email Service Requirement", res.message || "Outbound email requires SENDGRID_API_KEY / SMTP configuration in server/.env.", "info");
                    
                    // Show helpful banner in form
                    let infoBox = document.getElementById("forgotInfoBox");
                    if (!infoBox) {
                        infoBox = document.createElement("div");
                        infoBox.id = "forgotInfoBox";
                        infoBox.style.cssText = "margin-top:16px;padding:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;font-size:13px;color:#1E40AF;line-height:1.4;";
                        formForgot.appendChild(infoBox);
                    }
                    
                    if (res.token) {
                        infoBox.innerHTML = '<strong>Request Processed (Local Dev Mode)</strong><p style="margin:6px 0;">Outbound email service (SendGrid/SMTP) is not configured in server/.env. You can proceed directly with the generated security token below:</p><button type="button" id="devDirectResetBtn" class="btn-primary" style="margin-top:8px;padding:8px 16px;font-size:12px;width:auto;">Proceed to Set New Password →</button>';
                        document.getElementById("devDirectResetBtn")?.addEventListener("click", () => {
                            window.history.pushState({}, '', '?token=' + encodeURIComponent(res.token));
                            switchAuthTab("reset");
                        });
                    } else {
                        infoBox.innerHTML = '<strong>Password Reset Initiated</strong><p style="margin:6px 0;">' + (res.message || 'If an account matches that email, reset instructions have been generated. Note: Email delivery requires SENDGRID_API_KEY in server/.env.') + '</p>';
                    }
                } else {
                    showToast("Reset Link Sent", "If your account exists, password reset instructions have been dispatched.", "success");
                }
            } catch (err) {
                showToast("Request Failed", err?.message || "Unable to process password reset request. Please try again.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            }
        });
    }

    // Submit Reset Password with Token
    if (formReset) {
        formReset.addEventListener("submit", async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById("resetPassword")?.value;
            const confirmPassword = document.getElementById("resetConfirmPassword")?.value;

            if (!newPassword || newPassword.length < 8) {
                showToast("Invalid Password", "Password must be at least 8 characters long.", "error");
                return;
            }
            if (newPassword !== confirmPassword) {
                showToast("Password Mismatch", "New password and confirm password do not match.", "error");
                return;
            }

            const urlToken = new URLSearchParams(window.location.search).get("token");
            if (!urlToken) {
                showToast("Missing Token", "Password reset token is missing or expired. Please request a new link.", "error");
                return;
            }

            const submitBtn = formReset.querySelector('button[type="submit"]');
            const origHtml = submitBtn ? submitBtn.innerHTML : "";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Updating Password...</span>';
            }

            try {
                const apiClient = window.VisteriaAPI || window.api;
                await (apiClient?.auth?.resetPasswordWithToken ? apiClient.auth.resetPasswordWithToken(urlToken, newPassword) : fetch('/api/auth/employee/reset-password-with-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: urlToken, newPassword })
                }).then(async r => {
                    if (!r.ok) {
                        const err = await r.json();
                        throw new Error(err.error || 'Password reset failed');
                    }
                    return r.json();
                }));

                showToast("Password Updated", "Your password has been reset successfully. Please sign in.", "success");
                window.history.replaceState({}, '', window.location.pathname);
                setTimeout(() => {
                    switchAuthTab("signin");
                    const signinPw = document.getElementById("signinPassword");
                    if (signinPw) signinPw.focus();
                }, 800);
            } catch (err) {
                showToast("Reset Failed", err?.message || "Failed to update password. Token may have expired.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            }
        });
    }

    // Auto-detect ?token= parameter on page load
    const initialToken = new URLSearchParams(window.location.search).get("token");
    if (initialToken) {
        setTimeout(() => switchAuthTab("reset"), 100);
    }


    /* =====================================================
       7. HTML ESCAPE FUNCTION
       ===================================================== */

    function escapeHtml(str) {

        if (!str) {
            return "";
        }


        return String(str)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            );
    }


    /* =====================================================
       8. LOAD COMPANIES FROM BACKEND
       ===================================================== */

    async function loadCompanyDropdown() {

        const companySelect =
            document.getElementById(
                "signupCompany"
            );


        if (!companySelect) {
            return;
        }


        try {

            companySelect.innerHTML =
                '<option value="">Loading companies...</option>';


            const companies =
                await ((window.VisteriaAPI || window.api)?.auth?.getCompanies?.());


            if (
                Array.isArray(companies) &&
                companies.length > 0
            ) {

                companySelect.innerHTML =
                    '<option value="">Select company</option>' +
                    companies
                        .map(
                            (company) =>
                                `<option value="${escapeHtml(company.id)}">
                                    ${escapeHtml(company.name)}
                                </option>`
                        )
                        .join("");

            } else {

                companySelect.innerHTML =
                    '<option value="">No companies found</option>';
            }

        } catch (err) {

            console.warn(
                "Failed to load companies from API:",
                err
            );


            companySelect.innerHTML =
                '<option value="">Unable to load companies (server offline)</option>';
        }
    }


    loadCompanyDropdown();


    /* =====================================================
       9. REGISTERED BANNER → SIGN IN
       ===================================================== */

    const bannerSignInBtn =
        document.getElementById(
            "registeredBannerSignInBtn"
        );


    if (bannerSignInBtn) {

        bannerSignInBtn.addEventListener(
            "click",
            () => {

                switchAuthTab(
                    "signin"
                );


                document
                    .getElementById(
                        "signinPassword"
                    )
                    ?.focus();
            }
        );
    }


    /* =====================================================
       10. SIGN IN FORM
       POST /api/auth/employee/login
       ===================================================== */

    const formSignIn = document.getElementById("formSignIn");

    if (formSignIn) {
        formSignIn.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Prevent duplicate submissions
            if (formSignIn.dataset.submitting === "true") {
                return;
            }

            const empId = document.getElementById("signinEmployeeId")?.value.trim();
            const companyName = document.getElementById("signinCompanyName")?.value?.trim() || "";
            const password = document.getElementById("signinPassword")?.value.trim();

            const inlineErr = document.getElementById("signinInlineError");
            if (inlineErr) {
                inlineErr.textContent = "";
                inlineErr.style.display = "none";
            }

            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */
            if (!empId || !password) {
                const msg = "Please enter your Email or Employee ID and Password.";
                showToast("Missing Credentials", msg, "error");
                if (inlineErr) {
                    inlineErr.textContent = msg;
                    inlineErr.style.display = "block";
                }
                return;
            }

            /* -----------------------------------------
               BUTTON LOADING STATE
            ----------------------------------------- */
            const submitBtn = formSignIn.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";

            formSignIn.dataset.submitting = "true";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add("is-loading");
                submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Signing In...</span>';
            }

            let authenticatedAs = null;

            // Failsafe watchdog timer (10 seconds)
            const watchdog = setTimeout(() => {
                if (!authenticatedAs && submitBtn && submitBtn.disabled) {
                    formSignIn.dataset.submitting = "false";
                    submitBtn.disabled = false;
                    submitBtn.classList.remove("is-loading");
                    submitBtn.innerHTML = originalBtnHtml || '<span data-i18n="auth.btn_signin">Sign In</span><span class="btn-arrow" aria-hidden="true">→</span>';
                    if (inlineErr && inlineErr.style.display === "none") {
                        inlineErr.textContent = "Request timed out. Please verify your connection and try again.";
                        inlineErr.style.display = "block";
                    }
                }
            }, 10000);

            try {
                /* -------------------------------------
                   1. EMPLOYEE LOGIN API
                ------------------------------------- */
                const apiClient = window.VisteriaAPI || window.api;
                if (!apiClient?.auth?.loginEmployee) {
                    throw new Error('API Client is still initializing. Please refresh the page.');
                }
                await apiClient.auth.loginEmployee(empId, companyName, password);
                authenticatedAs = 'employee';

                /* -------------------------------------
                   FETCH EMPLOYEE PROFILE & PREFERENCES
                ------------------------------------- */
                try {
                    const profileRes = await (window.VisteriaAPI?.employee?.getProfile ? window.VisteriaAPI.employee.getProfile() : window.api?.employee?.getProfile());
                    if (profileRes && profileRes.data) {
                        const emp = profileRes.data;
                        if (emp.company && window.I18n) {
                            const supported = (emp.company.supported_languages && emp.company.supported_languages.length > 0)
                                ? emp.company.supported_languages
                                : ['en'];
                            window.I18n.setAllowedLanguages(supported);
                            if (emp.company.default_language && supported.includes(emp.company.default_language)) {
                                window.I18n.setLanguage(emp.company.default_language);
                            }
                        }
                        sessionStorage.setItem("visteria_auth_user", JSON.stringify({
                            name: emp.name,
                            employeeId: emp.employee_code,
                            company: emp.company ? emp.company.name : "Visteria",
                            department: emp.department || "General",
                            email: emp.email,
                            role: "employee",
                            loginTime: new Date().toISOString()
                        }));
                    }
                } catch (profileError) {
                    sessionStorage.setItem("visteria_auth_user", JSON.stringify({
                        employeeId: empId,
                        role: "employee",
                        loginTime: new Date().toISOString()
                    }));
                }

                // Handle Remember Me preference
                const rememberBox = document.getElementById("rememberMe");
                if (rememberBox && rememberBox.checked) {
                    localStorage.setItem("visteria_remember_me", "true");
                    localStorage.setItem("visteria_saved_identifier", empId);
                } else {
                    localStorage.removeItem("visteria_remember_me");
                    localStorage.removeItem("visteria_saved_identifier");
                }

                showToast("Authenticated Successfully", "Welcome back! Accessing your survey portal...", "success");
                setTimeout(() => {
                    const redirectParams = new URLSearchParams();
                    const forwardCycleId = (new URLSearchParams(window.location.search)).get("cycleId") || sessionStorage.getItem("visteria_target_cycle_id");
                    const forwardCompanyId = (new URLSearchParams(window.location.search)).get("companyId") || sessionStorage.getItem("visteria_target_company_id");
                    if (forwardCycleId) redirectParams.set("cycleId", forwardCycleId);
                    if (forwardCompanyId) redirectParams.set("companyId", forwardCompanyId);
                    const qStr = redirectParams.toString() ? `?${redirectParams.toString()}` : "";
                    window.location.href = `/employee/welcome.html${qStr}`;
                }, 600);

            } catch (err) {
                // 2. Fallback: check if valid admin credentials entered on this form
                const fallbackClient = window.VisteriaAPI || window.api;
                if (!authenticatedAs && fallbackClient?.auth?.loginAdmin) {
                    try {
                        await fallbackClient.auth.loginAdmin(empId, password);
                        authenticatedAs = 'admin';
                        showToast("Administrator Authenticated", "Welcome back! Accessing Executive Admin Portal...", "success");
                        setTimeout(() => {
                            window.location.href = "/admin/visteria-admin-panel.html";
                        }, 600);
                        return;
                    } catch (adminFallbackErr) {
                        console.warn("[Auth Notice] Admin fallback verification also declined:", adminFallbackErr?.message || adminFallbackErr);
                    }
                }

                let msg;
                if (err?.isNetworkError || err?.status === 0 || err?.status === 502 || err?.status === 503 || err?.status === 504) {
                    msg = "Cannot connect to server. Please verify the backend server is running.";
                } else if (err?.status === 401) {
                    msg = err.message || "Invalid Email/Employee ID or password. Please try again.";
                } else if (err?.status === 403) {
                    msg = err.message || "Access denied. Your account is not authorized.";
                } else if (err?.status >= 500) {
                    msg = "Server encountered an issue. Please verify backend service health.";
                } else {
                    msg = err?.message || "Invalid Email or Employee ID and password. Please try again.";
                }

                showToast("Authentication Failed", msg, "error");
                if (inlineErr) {
                    inlineErr.textContent = msg;
                    inlineErr.style.display = "block";
                }

                document.getElementById("signinPassword")?.focus();

            } finally {
                clearTimeout(watchdog);
                formSignIn.dataset.submitting = "false";
                if (submitBtn) {
                    if (authenticatedAs) {
                        submitBtn.disabled = true;
                        submitBtn.classList.remove("is-loading");
                        submitBtn.innerHTML = '<span style="color:#059669;font-weight:600;">✓ Accessing Portal...</span>';
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove("is-loading");
                        submitBtn.innerHTML = originalBtnHtml || '<span data-i18n="auth.btn_signin">Sign In</span><span class="btn-arrow" aria-hidden="true">→</span>';
                    }
                }
            }
        });
    }


    /* =====================================================
       11. SIGN UP FORM
       POST /api/auth/employee/register
       ===================================================== */

    const formSignUp =
        document.getElementById(
            "formSignUp"
        );


    const signupFormHeader =
        document.querySelector(
            "#panelSignUp .auth-form-header"
        );


    const signupSuccessView =
        document.getElementById(
            "signupSuccessView"
        );


    const doneSignupBtn =
        document.getElementById(
            "doneSignup"
        );

    async function loadSignupDropdowns() {
        const companySelect = document.getElementById("signupCompany");
        const deptSelect = document.getElementById("signupDepartment");
        const otherFieldsRow = document.getElementById("otherFieldsRow");
        const otherCompanyGroup = document.getElementById("otherCompanyGroup");
        const otherDeptGroup = document.getElementById("otherDepartmentGroup");
        const otherCompanyInput = document.getElementById("signupOtherCompany");
        const otherDeptInput = document.getElementById("signupOtherDepartment");

        function updateOtherVisibility() {
            const isOtherCompany = companySelect && companySelect.value === 'other';
            const isOtherDept = deptSelect && deptSelect.value === 'other';

            if (otherCompanyGroup) {
                otherCompanyGroup.style.display = isOtherCompany ? 'block' : 'none';
                if (otherCompanyInput) otherCompanyInput.required = isOtherCompany;
            }
            if (otherDeptGroup) {
                otherDeptGroup.style.display = isOtherDept ? 'block' : 'none';
                if (otherDeptInput) otherDeptInput.required = isOtherDept;
            }
            if (otherFieldsRow) {
                otherFieldsRow.style.display = (isOtherCompany || isOtherDept) ? 'grid' : 'none';
            }
        }

        if (companySelect && !companySelect.dataset.hasListener) {
            companySelect.dataset.hasListener = "true";
            companySelect.addEventListener("change", updateOtherVisibility);
        }
        if (deptSelect && !deptSelect.dataset.hasListener) {
            deptSelect.dataset.hasListener = "true";
            deptSelect.addEventListener("change", updateOtherVisibility);
        }

        if (companySelect && (window.VisteriaAPI?.auth?.getCompanies || window.api?.auth?.getCompanies)) {
            try {
                const companies = await ((window.VisteriaAPI || window.api)?.auth?.getCompanies?.());
                if (Array.isArray(companies)) {
                    const currentVal = companySelect.value;
                    companySelect.innerHTML = '<option value="" disabled selected>Select your company</option>' +
                        companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('') +
                        '<option value="other">Other (Specify Below)</option>';
                    const targetCompanyId = (new URLSearchParams(window.location.search)).get("companyId") || sessionStorage.getItem("visteria_target_company_id");
                    if (targetCompanyId && companies.some(c => c.id === targetCompanyId)) {
                        companySelect.value = targetCompanyId;
                    } else if (currentVal && companies.some(c => c.id === currentVal)) {
                        companySelect.value = currentVal;
                    }
                }
            } catch (err) {
                console.warn("Could not load companies for dropdown:", err);
            }
        }

        if (deptSelect && window.VisteriaAPI?.auth?.getDepartments) {
            try {
                const depts = await window.VisteriaAPI.auth.getDepartments();
                if (Array.isArray(depts) && depts.length > 0) {
                    const currentVal = deptSelect.value;
                    deptSelect.innerHTML = '<option value="" disabled selected>Select your department</option>' +
                        depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
                    if (currentVal && depts.some(d => d.name === currentVal)) {
                        deptSelect.value = currentVal;
                    }
                }
            } catch (err) {
                console.warn("Could not load departments for dropdown:", err);
            }
        }
    }

    loadSignupDropdowns();

    if (formSignUp) {

        formSignUp.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                /* -----------------------------------------
                   GET FORM VALUES
                ----------------------------------------- */

                const name =
                    document
                        .getElementById(
                            "signupName"
                        )
                        ?.value
                        .trim();


                const companyId =
                    document
                        .getElementById(
                            "signupCompany"
                        )
                        ?.value;


                const dept =
                    document
                        .getElementById(
                            "signupDepartment"
                        )
                        ?.value;


                const email =
                    document
                        .getElementById(
                            "signupEmail"
                        )
                        ?.value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "signupPassword"
                        )
                        ?.value;


                const confirmPw =
                    document
                        .getElementById(
                            "signupConfirmPassword"
                        )
                        ?.value;


                const terms =
                    document
                        .getElementById(
                            "signupTerms"
                        )
                        ?.checked;


                /* -----------------------------------------
                   REQUIRED FIELD VALIDATION
                ----------------------------------------- */

                if (
                    !name ||
                    !companyId ||
                    !dept ||
                    !email ||
                    !password ||
                    !confirmPw
                ) {

                    showToast(
                        "Incomplete Form",
                        "Please fill in all required fields including Company.",
                        "error"
                    );

                    return;
                }

                if (!/^[0-9a-fA-F]{24}$/.test(companyId)) {
                    showToast(
                        "Invalid Company",
                        "Please select a valid registered company from the dropdown.",
                        "error"
                    );
                    return;
                }


                /* -----------------------------------------
                   PASSWORD LENGTH
                ----------------------------------------- */

                if (
                    password.length < 8
                ) {

                    showToast(
                        "Password Requirements",
                        "Password must be at least 8 characters.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   PASSWORD MATCH
                ----------------------------------------- */

                if (
                    password !== confirmPw
                ) {

                    showToast(
                        "Password Mismatch",
                        "Passwords do not match. Please re-enter.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   TERMS
                ----------------------------------------- */

                if (!terms) {

                    showToast(
                        "Terms Required",
                        "Please agree to the survey confidentiality guidelines.",
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   SUBMIT BUTTON
                ----------------------------------------- */

                const submitBtn =
                    document.getElementById(
                        "submitSignup"
                    ) ||
                    formSignUp.querySelector(
                        'button[type="submit"]'
                    );


                const originalBtnHtml =
                    submitBtn
                        ? submitBtn.innerHTML
                        : "";


                if (submitBtn) {

                    submitBtn.disabled =
                        true;

                    submitBtn.classList.add(
                        "is-loading"
                    );

                    submitBtn.innerHTML =
                        '<span class="btn-spinner" aria-hidden="true"></span><span>Creating Account...</span>';
                }


                try {

                    /* -------------------------------------
                       REGISTER EMPLOYEE
                    ------------------------------------- */

                    const otherCompVal = document.getElementById("signupOtherCompany")?.value?.trim();
                    const otherDeptVal = document.getElementById("signupOtherDepartment")?.value?.trim();

                    const regPayload = {
                        name,
                        department: dept === 'other' ? (otherDeptVal || 'General') : dept,
                        email,
                        password,
                        agreedToTerms: true
                    };

                    if (companyId === 'other') {
                        regPayload.otherCompany = otherCompVal || 'Enterprise';
                        regPayload.companyName = otherCompVal || 'Enterprise';
                    } else {
                        regPayload.companyId = companyId;
                    }

                    const res = await ((window.VisteriaAPI || window.api)?.auth?.registerEmployee || (() => { throw new Error('API Client unavailable'); }))(regPayload);


                    /* -------------------------------------
                       GET GENERATED EMPLOYEE ID
                    ------------------------------------- */

                    const empData =
                        (
                            res &&
                            res.data
                        )
                            ? res.data
                            : {};


                    const generatedEmpCode =
                        empData.employee_code ||
                        "EMP-REGISTERED";


                    /* -------------------------------------
                       HIDE SIGNUP FORM
                    ------------------------------------- */

                    if (signupFormHeader) {

                        signupFormHeader.style.display =
                            "none";
                    }


                    formSignUp.style.display =
                        "none";


                    /* -------------------------------------
                       SHOW GENERATED EMPLOYEE ID
                    ------------------------------------- */

                    const generatedEmpIdEl =
                        document.getElementById(
                            "generatedEmpId"
                        );


                    if (generatedEmpIdEl) {

                        generatedEmpIdEl.textContent =
                            generatedEmpCode;
                    }


                    if (signupSuccessView) {

                        signupSuccessView.style.display =
                            "block";
                    }


                    /* -------------------------------------
                       UPDATE REGISTERED BANNER
                    ------------------------------------- */

                    const banner =
                        document.getElementById(
                            "alreadyRegisteredBanner"
                        );


                    const bannerEmpId =
                        document.getElementById(
                            "registeredBannerEmpId"
                        );


                    if (
                        banner &&
                        bannerEmpId
                    ) {

                        bannerEmpId.textContent =
                            generatedEmpCode;

                        banner.style.display =
                            "flex";
                    }


                    /* -------------------------------------
                       PREFILL SIGN IN EMPLOYEE ID
                    ------------------------------------- */

                    const signinEmpIdInput =
                        document.getElementById(
                            "signinEmployeeId"
                        );


                    if (signinEmpIdInput) {

                        signinEmpIdInput.value =
                            generatedEmpCode;
                    }


                    /* -------------------------------------
                       SUCCESS TOAST
                    ------------------------------------- */

                    showToast(
                        "Account Created",
                        `Employee ID ${generatedEmpCode} created successfully! Redirecting to Sign In...`,
                        "success"
                    );


                    /* -------------------------------------
                       AUTO SWITCH TO SIGN IN
                    ------------------------------------- */

                    setTimeout(
                        () => {

                            if (
                                signupSuccessView &&
                                signupSuccessView.style.display !==
                                "none"
                            ) {

                                switchAuthTab(
                                    "signin"
                                );


                                document
                                    .getElementById(
                                        "signinPassword"
                                    )
                                    ?.focus();
                            }

                        },
                        2500
                    );


                } catch (err) {

                    console.error(
                        "Employee registration failed:",
                        err
                    );


                    const msg =
                        err.isNetworkError
                            ? "Cannot connect to server. Please ensure backend is running."
                            : (
                                err.message ||
                                "Registration failed. Please check your information and try again."
                            );


                    showToast(
                        "Registration Failed",
                        msg,
                        "error"
                    );


                } finally {

                    if (submitBtn) {

                        submitBtn.disabled =
                            false;

                        submitBtn.classList.remove(
                            "is-loading"
                        );

                        submitBtn.innerHTML =
                            originalBtnHtml;
                    }
                }
            }
        );
    }


    /* =====================================================
       12. DONE BUTTON AFTER REGISTRATION
       ===================================================== */

    if (doneSignupBtn) {

        doneSignupBtn.addEventListener(
            "click",
            () => {

                switchAuthTab(
                    "signin"
                );


                document
                    .getElementById(
                        "signinPassword"
                    )
                    ?.focus();
            }
        );
    }


    /* =====================================================
       13. DEFAULT AUTH TAB
       
       IMPORTANT:
       CREATE ACCOUNT IS THE FIRST/DEFAULT TAB.
       
       URL OPTIONS:
       ?tab=signin
       ?action=signin
       
       → SIGN IN
       
       ?tab=signup
       ?action=signup
       
       → CREATE ACCOUNT
       ===================================================== */

    const urlAuthParams = new URLSearchParams(window.location.search);

    // Save target survey cycle and company if provided in shareable survey link
    const initialCycleId = urlAuthParams.get("cycleId");
    const initialCompanyId = urlAuthParams.get("companyId");
    if (initialCycleId) {
        try { sessionStorage.setItem("visteria_target_cycle_id", initialCycleId); } catch (e) {}
    }
    if (initialCompanyId) {
        try { sessionStorage.setItem("visteria_target_company_id", initialCompanyId); } catch (e) {}
    }


    const requestedTab =
        urlAuthParams.get("tab");


    const requestedAction =
        urlAuthParams.get("action");


    /* ---------------------------------------------
       EXPLICIT SIGN IN
    --------------------------------------------- */

    if (
        requestedTab === "signin" ||
        requestedAction === "signin"
    ) {

        switchAuthTab(
            "signin"
        );

    }

    /* ---------------------------------------------
       EXPLICIT CREATE ACCOUNT
    --------------------------------------------- */

    else if (
        requestedTab === "signup" ||
        requestedAction === "signup"
    ) {

        switchAuthTab(
            "signup"
        );

    }

    /* ---------------------------------------------
       DEFAULT → SIGN IN (MATCHING SCREENSHOT 1)
    --------------------------------------------- */

    else {

        switchAuthTab(
            "signin"
        );
    }


    /* =====================================================
       14. FINAL INITIALIZATION
       ===================================================== */

    console.log(
        "Visteria InsightPulse AI Employee Portal initialized."
    );

    console.log(
        "Default authentication tab: CREATE ACCOUNT"
    );



    /* =====================================================
       15. LEGAL POLICY MODAL CONTROLLER (TERMS & PRIVACY)
       ===================================================== */
    function initLegalPolicyModal() {
        const modal = document.getElementById("legalPolicyModal");
        if (!modal) return;

        const tabTerms = document.getElementById("legalTabTerms");
        const tabPrivacy = document.getElementById("legalTabPrivacy");
        const contentTerms = document.getElementById("legalContentTerms");
        const contentPrivacy = document.getElementById("legalContentPrivacy");
        const closeTopBtn = document.getElementById("closeLegalModalBtn");
        const closeBottomBtn = document.getElementById("closeLegalPolicyModalBtn");
        const acceptBtn = document.getElementById("acceptLegalPolicyBtn");

        function openModal(activeTab) {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
            switchTab(activeTab || "terms");
        }

        function closeModal() {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }

        function switchTab(target) {
            if (target === "terms") {
                if (tabTerms) { tabTerms.classList.add("active"); tabTerms.setAttribute("aria-selected", "true"); }
                if (tabPrivacy) { tabPrivacy.classList.remove("active"); tabPrivacy.setAttribute("aria-selected", "false"); }
                if (contentTerms) { contentTerms.classList.add("active"); contentTerms.style.display = "block"; }
                if (contentPrivacy) { contentPrivacy.classList.remove("active"); contentPrivacy.style.display = "none"; }
            } else {
                if (tabTerms) { tabTerms.classList.remove("active"); tabTerms.setAttribute("aria-selected", "false"); }
                if (tabPrivacy) { tabPrivacy.classList.add("active"); tabPrivacy.setAttribute("aria-selected", "true"); }
                if (contentTerms) { contentTerms.classList.remove("active"); contentTerms.style.display = "none"; }
                if (contentPrivacy) { contentPrivacy.classList.add("active"); contentPrivacy.style.display = "block"; }
            }
        }

        // Click listeners on trigger links
        const termsTriggers = [
            document.getElementById("openTermsLink"),
            document.getElementById("footerTermsLink")
        ].filter(Boolean);

        const privacyTriggers = [
            document.getElementById("openPrivacyLink"),
            document.getElementById("footerPrivacyLink")
        ].filter(Boolean);

        termsTriggers.forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal("terms");
            });
        });

        privacyTriggers.forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal("privacy");
            });
        });

        // Tab buttons inside modal
        if (tabTerms) tabTerms.addEventListener("click", (e) => { e.preventDefault(); switchTab("terms"); });
        if (tabPrivacy) tabPrivacy.addEventListener("click", (e) => { e.preventDefault(); switchTab("privacy"); });

        // Close buttons
        if (closeTopBtn) closeTopBtn.addEventListener("click", (e) => { e.preventDefault(); closeModal(); });
        if (closeBottomBtn) closeBottomBtn.addEventListener("click", (e) => { e.preventDefault(); closeModal(); });

        // Accept button
        if (acceptBtn) {
            acceptBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const agreeCb = document.getElementById("signupAgree");
                if (agreeCb) agreeCb.checked = true;
                closeModal();
            });
        }

        // Close on backdrop click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        // Close on Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display === "flex") {
                closeModal();
            }
        });
    }

    try {
        initLegalPolicyModal();
    } catch (e) {
        console.warn("Legal policy modal init warning:", e);
    }

});