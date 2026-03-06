(() => {
  const launcher = document.getElementById("caLauncher");
  const panel = document.getElementById("caPanel");
  const log = document.getElementById("caLog");
  const chips = document.getElementById("caChips");
  const status = document.getElementById("caStatus");

  const voiceBtn = document.getElementById("caVoiceBtn");
  const replayBtn = document.getElementById("caReplayBtn");
  const closeBtn = document.getElementById("caCloseBtn");

  const compose = document.getElementById("caCompose");
  const input = document.getElementById("caInput");
  const sendBtn = document.getElementById("caSendBtn");

  if (!launcher || !panel || !log || !chips) {
    console.warn("County Assistant: Missing required HTML elements.");
    return;
  }

  let voiceEnabled = true;
  let lastSpoken = "";
  let selectedVoice = null;

  let bubbleTimer = null;
  let bubbleIndex = 0;

  const bubbleLines = [
    "Hi — I’m your County Assistant.",
    "Ask me about these tools.",
    "Need help choosing an agent?",
    "Try typing a question."
  ];

  function getVoicesSafe() {
    try {
      return window.speechSynthesis ? speechSynthesis.getVoices() : [];
    } catch {
      return [];
    }
  }

  function pickVoice() {
    const voices = getVoicesSafe();
    if (!voices.length) return null;

    const preferredNames = [
      "Samantha", "Jenny", "Aria", "Serena", "Ava",
      "Allison", "Olivia", "Natalie", "Joanna"
    ];

    const english = voices.filter((v) => /^en(-|_)?/i.test(v.lang));
    const enUS = english.filter((v) => /^en-US/i.test(v.lang));
    const pool = enUS.length ? enUS : (english.length ? english : voices);

    for (const name of preferredNames) {
      const found = pool.find((v) => (v.name || "").toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
    }

    const femaleHints = ["zira", "susan", "aria", "jenny", "samantha", "ava"];
    const maybeFemale = pool.find((v) => femaleHints.some((h) => (v.name || "").toLowerCase().includes(h)));
    return maybeFemale || pool[0];
  }

  function speak(text) {
    lastSpoken = text;

    if (!voiceEnabled) return;
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) return;

    try { speechSynthesis.cancel(); } catch {}

    const u = new SpeechSynthesisUtterance(text);


    u.rate = 1.12;
    u.pitch = 1.32;
    u.volume = 1.0;

    selectedVoice = selectedVoice || pickVoice();
    if (selectedVoice) u.voice = selectedVoice;

    panel.classList.add("ca-speaking");
    u.onend = () => panel.classList.remove("ca-speaking");
    u.onerror = () => panel.classList.remove("ca-speaking");

    try { speechSynthesis.speak(u); } catch {}
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      selectedVoice = pickVoice();
    };
    selectedVoice = pickVoice();
  }


  function clearLog() {
    log.innerHTML = "";
  }

  function addMsg(text, who = "bot") {
    const div = document.createElement("div");
    div.className = who === "user" ? "ca-msg ca-msg-user" : "ca-msg ca-msg-bot";
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function addTyping() {
    const div = document.createElement("div");
    div.className = "ca-msg ca-msg-bot ca-typing";
    div.textContent = "Typing…";
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function setChips(items) {
    chips.innerHTML = "";
    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "ca-chip";
      btn.type = "button";
      btn.textContent = item.label;
      btn.addEventListener("click", item.onClick);
      chips.appendChild(btn);
    });
  }

  function openPanel() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  
    setTimeout(() => input?.focus(), 50);
  }

  function closePanel() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    try { speechSynthesis.cancel(); } catch {}
    panel.classList.remove("ca-speaking");
  }

  function togglePanel() {
    if (panel.classList.contains("is-open")) closePanel();
    else openPanel();
  }

  function ensureBubble() {
    return null;
  }

  function setBubbleLine(line, subline = "Click to open") {
    // bubble disabled — new button design handles this visually
  }

  function startBubbleRotation() {
    // bubble disabled
  }

  function stopBubbleRotation() {
    if (!bubbleTimer) return;
    clearInterval(bubbleTimer);
    bubbleTimer = null;
  }

  function onPanelOpened() {
    launcher.classList.add("ca-open");
    setBubbleLine("I’m here — type or tap a button.", "I’ll explain (no auto-opening)");
    stopBubbleRotation();
  }

  function onPanelClosed() {
    launcher.classList.remove("ca-open");
    startBubbleRotation();
    setBubbleLine(bubbleLines[bubbleIndex], "Click to open");
  }


  function intro() {
    clearLog();

    const introText =
      "Hi, I’m the County Assistant. Ask me anything about the agents on this page, training videos, privacy rules, or how to submit a new agent.";

    addMsg(introText, "bot");
    speak(introText);

    setChips([
      { label: "What is this page?", onClick: describePage },
      { label: "BAI Assist", onClick: describeBAI },
      { label: "Procurement Agent", onClick: describeProcurement },
      { label: "Federal Grants", onClick: describeGrants },
      { label: "Training Videos", onClick: describeTraining },
      { label: "Privacy Rules", onClick: describePrivacy },
      { label: "Submit an Agent", onClick: describeSubmit },
      { label: "Close", onClick: () => { closePanel(); onPanelClosed(); } },
    ]);
  }

  function describePage() {
    const t =
      "This page is the County AI App Store. It lists approved AI agents by category. Each agent supports a specific workflow like writing, procurement, grants, or planning.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Want another tool explained?", "Type a question or tap a button");
  }

  function describeBAI() {
    const t =
      "BAI Assist helps with writing tasks: drafting emails, memos, summaries, and internal communications. Always review content before sending.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("BAI Assist = writing helper", "Emails • memos • summaries");
  }

  function describeProcurement() {
    const t =
      "The Procurement Agent supports purchasing workflows: drafting RFQs/RFPs, preparing vendor email templates, and outlining compliant procurement language.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Procurement Agent", "RFQs • RFPs • vendor templates");
  }

  function describeGrants() {
    const t =
      "The Federal Grants Agent helps with eligibility checks, grant narratives, and compliance reminders. It’s useful for organizing requirements and application materials.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Federal Grants Agent", "Eligibility • narratives • compliance");
  }

  function describeTraining() {
    const t =
      "Training videos provide quick guidance on using county AI tools safely and effectively. New users should start with the welcome overview and the data privacy guidance.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Training helps onboard fast", "Start with Welcome + Privacy");
  }

  function describePrivacy() {
    const t =
      "Privacy basics: do not paste confidential or sensitive resident data. Use summaries instead of full records, and always review AI outputs before sharing or publishing.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Privacy first", "No sensitive resident data");
  }

  function describeSubmit() {
    const t =
      "Submitting an agent lets departments propose new AI tools for county use. Submissions are reviewed for security, usefulness, and policy compliance before approval.";
    addMsg(t, "bot");
    speak(t);
    setBubbleLine("Submit an Agent", "Propose • review • approve");
  }


  function replyFor(textRaw) {
    const text = (textRaw || "").trim().toLowerCase();

    if (!text) return "Say that again? You can ask about BAI Assist, Procurement, Grants, Training, Privacy, or submitting an agent.";

  
    if (/(^|\b)(hi|hello|hey|good morning|good afternoon|good evening)(\b|$)/.test(text)) {
      return "Hi! What can I help with — an agent overview, training videos, privacy rules, or submitting an agent?";
    }
    if (/(^|\b)(help|what can you do|how do you work)(\b|$)/.test(text)) {
      return "I’m a guided helper for this mockup. Ask about an agent (BAI Assist, Procurement, Grants), training videos, privacy rules, or how to submit a new agent.";
    }


    if (text.includes("bai") || text.includes("writer") || text.includes("email") || text.includes("memo") || text.includes("summary")) {
      return "BAI Assist is your writing helper: emails, memos, summaries, and internal updates. Best practice: paste non-sensitive context, request tone/length, then review before sending.";
    }
    if (text.includes("procurement") || text.includes("rfq") || text.includes("rfp") || text.includes("vendor")) {
      return "Procurement Agent supports purchasing workflows: draft RFQs/RFPs, vendor templates, evaluation criteria outlines, and compliant language starters (final review still goes through procurement/legal).";
    }
    if (text.includes("grant") || text.includes("nofo") || text.includes("eligibility") || text.includes("compliance")) {
      return "Federal Grants Agent helps with eligibility checks, narrative drafting structure, requirement summaries, and compliance reminders/checklists to keep packages organized.";
    }
    if (text.includes("training") || text.includes("video") || text.includes("learn")) {
      return "The training videos are short onboarding guides. New users: start with the Welcome video, then the Data Privacy video, then role-based ones like BAI Assist or Procurement basics.";
    }
    if (text.includes("privacy") || text.includes("data") || text.includes("confidential") || text.includes("resident")) {
      return "Privacy rule of thumb: don’t paste confidential or sensitive resident data. Use summaries, minimize identifiers, and always verify outputs before sharing or publishing.";
    }
    if (text.includes("submit") || text.includes("create") || text.includes("new agent") || text.includes("propose")) {
      return "Submitting an agent is how departments propose new tools. In the real build, IT/security would review for data handling, access controls, and compliance before publishing it to staff.";
    }


    return "I can help with: BAI Assist, Procurement, Federal Grants, Training Videos, Privacy Rules, or Submit an Agent. Which one do you want to hear about?";
  }

  function botRespond(userText) {
    const typing = addTyping();


    setTimeout(() => {
      typing.remove();
      const answer = replyFor(userText);
      addMsg(answer, "bot");
      speak(answer);
      setBubbleLine("Want more detail?", "Ask another question");
    }, 450);
  }

  ensureBubble();
  startBubbleRotation();

  launcher.addEventListener("mouseenter", () => launcher.classList.add("ca-hover"));
  launcher.addEventListener("mouseleave", () => launcher.classList.remove("ca-hover"));

  launcher.addEventListener("click", () => {
    const wasOpen = panel.classList.contains("is-open");
    togglePanel();

    if (!wasOpen && panel.classList.contains("is-open")) {
      onPanelOpened();
      if (!log.children.length) intro();
    } else if (wasOpen && !panel.classList.contains("is-open")) {
      onPanelClosed();
    }
  });

  closeBtn?.addEventListener("click", () => {
    closePanel();
    onPanelClosed();
  });

  replayBtn?.addEventListener("click", () => {
    if (lastSpoken) speak(lastSpoken);
  });

  voiceBtn?.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    if (status) status.textContent = voiceEnabled ? "Ready • Voice on" : "Ready • Voice off";
    if (voiceBtn) {
      voiceBtn.innerHTML = voiceEnabled
        ? '<i class="bi bi-volume-up"></i>'
        : '<i class="bi bi-volume-mute"></i>';
    }
    setBubbleLine(voiceEnabled ? "Voice is ON" : "Voice is OFF", "Type or tap buttons");
  });

  compose?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;


    if (!panel.classList.contains("is-open")) {
      openPanel();
      onPanelOpened();
      if (!log.children.length) intro();
    }

    addMsg(text, "user");
    input.value = "";
    botRespond(text);
  });


  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      compose?.requestSubmit?.();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePanel();
      onPanelClosed();
    }
  });

  
  panel.setAttribute("aria-hidden", "true");
})();
