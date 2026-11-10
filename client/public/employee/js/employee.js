/**
 * Visteria InsightPulse AI — Unified Employee Portal Controller
 * Controls Eagle Assistant (live backend AI API), survey resume flow, and auth UX.
 */

(function (window, document) {
    'use strict';

    // Global Employee Controller namespace
    window.VisteriaEmployee = {
        initEagleAssistant,
        loadActiveSurveyState,
        showToast
    };

    /**
     * Show notification toast
     */
    function showToast(title, desc, type = "success") {
        const toast = document.getElementById("notificationToast");
        if (!toast) return;

        const iconEl = toast.querySelector(".toast-icon");
        const titleEl = toast.querySelector(".toast-title");
        const descEl = toast.querySelector(".toast-desc");

        toast.className = `notification-toast toast-${type}`;
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (iconEl) {
            iconEl.textContent = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
        }

        toast.classList.add("show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    /**
     * Initialize real backend-connected Eagle Assistant
     */
    function initEagleAssistant(options = {}) {
        const eagleContainer = document.getElementById("eagleContainer");
        const eagleAvatar = document.getElementById("eagleAvatar");
        const eagleChatBox = document.getElementById("eagleChatBox");
        const eagleChatCloseBtn = document.getElementById("eagleChatCloseBtn");
        const eagleChatMessages = document.getElementById("eagleChatMessages");
        const eagleChatForm = document.getElementById("eagleChatForm");
        const eagleChatInput = document.getElementById("eagleChatInput");
        const quickChips = document.querySelectorAll(".quick-chip");

        if (!eagleAvatar || !eagleChatBox) return;

        const chatHistory = [];

        function toggleEagleChat(forceOpen = null) {
            const isOpen = forceOpen !== null ? forceOpen : !eagleChatBox.classList.contains("chat-open") && !eagleChatBox.classList.contains("active");

            if (isOpen) {
                eagleChatBox.classList.add("chat-open", "active");
                eagleChatBox.setAttribute("aria-hidden", "false");
                eagleAvatar.setAttribute("aria-expanded", "true");
                if (eagleChatInput) eagleChatInput.focus();
            } else {
                eagleChatBox.classList.remove("chat-open", "active");
                eagleChatBox.setAttribute("aria-hidden", "true");
                eagleAvatar.setAttribute("aria-expanded", "false");
            }
        }

        eagleAvatar.addEventListener("click", () => toggleEagleChat());

        if (eagleChatCloseBtn) {
            eagleChatCloseBtn.addEventListener("click", () => toggleEagleChat(false));
        }

        // Close on clicking outside
        document.addEventListener("click", (e) => {
            if (
                eagleChatBox &&
                (eagleChatBox.classList.contains("chat-open") || eagleChatBox.classList.contains("active")) &&
                eagleContainer &&
                !eagleContainer.contains(e.target) &&
                !eagleAvatar.contains(e.target) && !document.getElementById("askEagleBtn")?.contains(e.target) && !document.getElementById("assistantAvatarBadge")?.contains(e.target)
            ) {
                toggleEagleChat(false);
            }
        });

        function appendMessage(sender, text, isHtml = false) {
            if (!eagleChatMessages) return;

            const bubble = document.createElement("div");
            bubble.className = `chat-bubble ${sender === "user" ? "user-bubble" : "eagle-bubble"}`;

            const p = document.createElement("p");
            if (isHtml) {
                p.innerHTML = text;
            } else {
                p.textContent = text;
            }
            bubble.appendChild(p);

            eagleChatMessages.appendChild(bubble);
            eagleChatMessages.scrollTop = eagleChatMessages.scrollHeight;
            return bubble;
        }

        // Live backend AI interaction
        async function handleUserQuestion(questionText) {
            if (!questionText.trim()) return;

            appendMessage("user", questionText);
            chatHistory.push({ role: "user", content: questionText });

            // Render thinking indicator
            const thinkingBubble = document.createElement("div");
            thinkingBubble.className = "chat-bubble eagle-bubble thinking-bubble";
            thinkingBubble.innerHTML = `<p style="display:flex;align-items:center;gap:6px;opacity:0.8;"><span style="animation:spin 1s infinite linear;display:inline-block;">⚡</span> Eagle AI thinking...</p>`;
            eagleChatMessages.appendChild(thinkingBubble);
            eagleChatMessages.scrollTop = eagleChatMessages.scrollHeight;

            try {
                // Call real backend API: POST /api/employee/assistant/chat
                let aiReply = "";
                if (window.VisteriaAPI?.employee?.chatWithEagle) {
                    const res = await window.VisteriaAPI.employee.chatWithEagle(
                        questionText,
                        chatHistory.slice(-6),
                        options.context || null
                    );
                    aiReply = res?.data?.reply || res?.reply || "I am here to guide you through your confidential survey experience.";
                } else {
                    // Fallback to fetch directly
                    const token = window.VisteriaAPI?.auth?.getEmployeeToken?.() || localStorage.getItem("employee_accessToken");
                    const response = await fetch("/api/employee/assistant/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { "Authorization": `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ message: questionText, history: chatHistory.slice(-6) })
                    });
                    const data = await response.json();
                    aiReply = data?.data?.reply || data?.reply || "I am here to assist you with your survey.";
                }

                thinkingBubble.remove();
                appendMessage("eagle", aiReply);
                chatHistory.push({ role: "assistant", content: aiReply });
            } catch (err) {
                console.error("Eagle Assistant API error:", err);
                thinkingBubble.remove();
                appendMessage("eagle", "I'm having trouble connecting to the survey AI service right now. Please ensure your session is active, or try again in a moment.");
            }
        }

        // Quick chip clicks
        quickChips.forEach(chip => {
            chip.addEventListener("click", () => {
                const question = chip.getAttribute("data-question") || chip.textContent.trim();
                handleUserQuestion(question);
            });
        });

        // Form submit
        if (eagleChatForm && eagleChatInput) {
            eagleChatForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = eagleChatInput.value.trim();
                if (text) {
                    handleUserQuestion(text);
                    eagleChatInput.value = "";
                }
            });
        }
    }

    /**
     * Inspect active survey state and update welcome/dashboard CTA
     */
    async function loadActiveSurveyState() {
        const startBtn = document.getElementById("startSurveyBtn");
        if (!startBtn) return;

        try {
            if (!window.VisteriaAPI?.employee) return;
            const res = await window.VisteriaAPI.employee.getAssignments();
            const assignments = res?.data || [];

            const completed = assignments.find(a => a.status === 'completed');
            const inProgress = assignments.find(a => a.status === 'in_progress');
            const assigned = assignments.find(a => a.status === 'assigned');

            if (completed && !inProgress && !assigned) {
                // Completed Survey Protection in UI
                startBtn.classList.remove("btn-primary");
                startBtn.classList.add("btn-completed");
                startBtn.removeAttribute("href");
                startBtn.style.background = "#059669";
                startBtn.style.cursor = "default";
                startBtn.style.boxShadow = "none";
                startBtn.innerHTML = `<span>✓ SURVEY COMPLETED</span>`;

                const ctaGroup = startBtn.closest(".hero-cta-group");
                if (ctaGroup && !document.getElementById("surveyCompletedNotice")) {
                    const notice = document.createElement("div");
                    notice.id = "surveyCompletedNotice";
                    notice.className = "survey-completed-banner";
                    notice.style.marginTop = "14px";
                    notice.innerHTML = `<span>🎉</span><span>Thank you! Your survey responses have been submitted and locked securely.</span>`;
                    ctaGroup.appendChild(notice);
                }
            } else if (inProgress) {
                // Resume state
                const answeredCount = inProgress.saved_answers?.length || 0;
                const totalQ = inProgress.survey_cycle?.survey?.questions?.length || 0;
                const progressText = totalQ > 0 ? ` (${answeredCount} of ${totalQ} answered)` : '';

                startBtn.innerHTML = `<span>RESUME SURVEY${progressText}</span><span class="btn-arrow" aria-hidden="true">→</span>`;
                startBtn.setAttribute("href", `survey.html?assignmentId=${inProgress.id}`);
            } else if (assigned) {
                startBtn.innerHTML = `<span>START YOUR SURVEY</span><span class="btn-arrow" aria-hidden="true">→</span>`;
                startBtn.setAttribute("href", `survey.html?assignmentId=${assigned.id}`);
            }
        } catch (err) {
            console.warn("Could not load assignment state for welcome button:", err);
        }
    }

    // Auto-init on DOM ready or immediately if already loaded
    function init() {
        initEagleAssistant();
        loadActiveSurveyState();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})(window, document);
