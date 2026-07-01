/* ==========================================================================
   AI Work Avatar - Application Core Logic & Gemini Integration
   ========================================================================== */

// 1. STATE INITIALIZATION
let activeConfig = {};
let geminiApiKey = "";

// Default welcome message template
const getWelcomeMessage = (avatarName, userName) => {
  return `안녕하세요! ${userName}님의 공식 업무 아바타인 **'${avatarName}'**입니다. 

현재 ${userName}님은 업무에 집중하고 계시거나 미팅 중입니다. 대신 제가 **담당 프로젝트, 기술 스택, 코드 리뷰 규칙, 업무 협업 요령** 등에 대해 정확히 답변해 드리겠습니다. 

아래 추천 질문을 클릭하거나 궁금하신 업무 내용을 자유롭게 질문해 보세요! 😊`;
};

// Initialize App State
function initAppState() {
  // Load configuration: Check localStorage first, fallback to static config.js
  const savedConfig = localStorage.getItem("AVATAR_CONFIG");
  if (savedConfig) {
    try {
      activeConfig = JSON.parse(savedConfig);
    } catch (e) {
      console.error("저장된 설정을 불러오는 도중 오류가 발생했습니다. 기본값을 사용합니다.", e);
      activeConfig = { ...CONFIG };
    }
  } else {
    activeConfig = { ...CONFIG };
  }

  // Load API Key: Check localStorage first, fallback to static config.js
  const savedApiKey = localStorage.getItem("GEMINI_API_KEY");
  // Vercel 환경 변수(process.env)를 최우선으로 확인하고 없으면 기존 순서대로 작동하게 합니다. 
  geminiApiKey = process.env.GEMINI_API_KEY || savedApiKey || CONFIG.GEMINI_API_KEY || "";

  // Render elements
  syncProfileUI();
  renderFaqListAdmin();
  renderSuggestionChips();
  resetChatFeed();
}

// 2. DOM ELEMENTS
const tabChat = document.getElementById("tab-chat");
const tabAdmin = document.getElementById("tab-admin");
const viewChat = document.getElementById("view-chat");
const viewAdmin = document.getElementById("view-admin");

// Dynamic Profile Elements
const sidebarAvatarEmoji = document.getElementById("sidebar-avatar-emoji");
const sidebarUserName = document.getElementById("sidebar-user-name");
const sidebarRole = document.getElementById("sidebar-role");
const sidebarTeam = document.getElementById("sidebar-team");
const sidebarStatus = document.getElementById("sidebar-status");
const sidebarContact = document.getElementById("sidebar-contact");
const headerLogoEmoji = document.getElementById("header-logo-emoji");
const headerTitle = document.getElementById("header-title");
const chatHeaderEmoji = document.getElementById("chat-header-emoji");
const chatHeaderTitle = document.getElementById("chat-header-title");

// Admin Input Elements
const adminApiKey = document.getElementById("admin-api-key");
const adminEmoji = document.getElementById("admin-emoji");
const adminUserName = document.getElementById("admin-user-name");
const adminAvatarName = document.getElementById("admin-avatar-name");
const adminRole = document.getElementById("admin-role");
const adminTeam = document.getElementById("admin-team");
const adminStatus = document.getElementById("admin-status");
const adminContact = document.getElementById("admin-contact");
const adminKnowledgeBase = document.getElementById("admin-knowledge-base");
const newFaqQ = document.getElementById("new-faq-q");
const newFaqA = document.getElementById("new-faq-a");

// Buttons & Actions
const saveApiKeyBtn = document.getElementById("save-api-key-btn");
const saveProfileBtn = document.getElementById("save-profile-btn");
const saveKnowledgeBtn = document.getElementById("save-knowledge-btn");
const addFaqBtn = document.getElementById("add-faq-btn");
const downloadConfigBtn = document.getElementById("download-config-btn");
const resetDefaultsBtn = document.getElementById("reset-defaults-btn");
const toggleApiKeyVisibility = document.getElementById("toggle-api-key-visibility");

// Status Indicators
const apiKeySaveStatus = document.getElementById("api-key-save-status");
const profileSaveStatus = document.getElementById("profile-save-status");
const knowledgeSaveStatus = document.getElementById("knowledge-save-status");

// Chat Components
const chatMessagesFeed = document.getElementById("chat-messages-feed");
const chatSuggestionsChips = document.getElementById("chat-suggestions-chips");
const chatInputForm = document.getElementById("chat-input-form");
const chatUserInput = document.getElementById("chat-user-input");

// 3. UI RENDERING & UTILITIES

// Switch between Chat and Admin tabs
tabChat.addEventListener("click", () => {
  tabChat.classList.add("active");
  tabAdmin.classList.remove("active");
  viewChat.classList.add("active");
  viewAdmin.classList.remove("active");
  syncProfileUI(); // Sync any changes
});

tabAdmin.addEventListener("click", () => {
  tabAdmin.classList.add("active");
  tabChat.classList.remove("active");
  viewAdmin.classList.add("active");
  viewChat.classList.remove("active");
  populateAdminInputs(); // Load current data into form
});

// Toggle API Key password visibility
toggleApiKeyVisibility.addEventListener("click", () => {
  if (adminApiKey.type === "password") {
    adminApiKey.type = "text";
    toggleApiKeyVisibility.textContent = "🙈";
  } else {
    adminApiKey.type = "password";
    toggleApiKeyVisibility.textContent = "👁️";
  }
});

// Update all UI elements on Visitor Chat Mode
function syncProfileUI() {
  sidebarAvatarEmoji.textContent = activeConfig.EMOJI || "🧑‍💻";
  headerLogoEmoji.textContent = activeConfig.EMOJI || "🧑‍💻";
  sidebarUserName.textContent = activeConfig.USER_NAME || "영우 (Youngwu)";
  sidebarRole.textContent = activeConfig.ROLE || "플랫폼 엔지니어";
  sidebarTeam.textContent = activeConfig.TEAM || "플랫폼 개발팀";
  sidebarStatus.textContent = activeConfig.STATUS || "💻 집중 업무 중 (Deep Work)";
  sidebarContact.textContent = activeConfig.CONTACT || "";
  
  headerTitle.textContent = `${activeConfig.USER_NAME} 아바타 봇`;
  chatHeaderEmoji.textContent = "🤖";
  chatHeaderTitle.textContent = activeConfig.AVATAR_NAME || "Youngwu 아바타 봇";
}

// Load current configuration into Admin inputs
function populateAdminInputs() {
  adminApiKey.value = geminiApiKey;
  adminEmoji.value = activeConfig.EMOJI || "🧑‍💻";
  adminUserName.value = activeConfig.USER_NAME || "";
  adminAvatarName.value = activeConfig.AVATAR_NAME || "";
  adminRole.value = activeConfig.ROLE || "";
  adminTeam.value = activeConfig.TEAM || "";
  adminStatus.value = activeConfig.STATUS || "";
  adminContact.value = activeConfig.CONTACT || "";
  adminKnowledgeBase.value = activeConfig.KNOWLEDGE_BASE || "";

  // Set tone radio check
  const toneRadio = document.querySelector(`input[name="avatar-tone"][value="${activeConfig.TONE || 'friendly'}"]`);
  if (toneRadio) toneRadio.checked = true;
}

// Render FAQs inside Admin settings
function renderFaqListAdmin() {
  const container = document.getElementById("admin-faq-list-container");
  container.innerHTML = "";
  
  if (!activeConfig.FAQS || activeConfig.FAQS.length === 0) {
    container.innerHTML = `<p class="text-center" style="font-size: 0.8rem; color: var(--text-muted); padding: 20px 0;">등록된 FAQ가 없습니다.</p>`;
    return;
  }

  activeConfig.FAQS.forEach((faq, index) => {
    const faqItem = document.createElement("div");
    faqItem.className = "faq-item";
    faqItem.innerHTML = `
      <div class="faq-item-text">
        <p class="faq-item-q">Q: ${escapeHtml(faq.q)}</p>
        <p class="faq-item-a">A: ${escapeHtml(faq.a)}</p>
      </div>
      <button type="button" class="btn-delete-faq" data-index="${index}" aria-label="FAQ 삭제">✕</button>
    `;
    container.appendChild(faqItem);
  });

  // Bind delete events
  container.querySelectorAll(".btn-delete-faq").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.getAttribute("data-index"));
      deleteFaq(index);
    });
  });
}

// Render Visitor Suggestion Chips
function renderSuggestionChips() {
  chatSuggestionsChips.innerHTML = "";
  
  // Choose suggestions from config. If empty, fallback to FAQ questions
  const suggestions = activeConfig.SUGGESTIONS && activeConfig.SUGGESTIONS.length > 0 
    ? activeConfig.SUGGESTIONS 
    : (activeConfig.FAQS ? activeConfig.FAQS.map(f => f.q) : []);

  if (suggestions.length === 0) {
    chatSuggestionsChips.parentElement.style.display = "none";
    return;
  } else {
    chatSuggestionsChips.parentElement.style.display = "block";
  }

  suggestions.forEach(suggest => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = suggest;
    chip.addEventListener("click", () => {
      handleUserSubmit(suggest);
    });
    chatSuggestionsChips.appendChild(chip);
  });
}

// Helper to escape HTML tags to prevent XSS
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// 4. ADMIN ACTIONS (SAVE CONFIGS)

// Display Status Notification
function showStatus(element, text, isSuccess) {
  element.textContent = text;
  element.className = `save-status-indicator ${isSuccess ? 'success' : 'error'}`;
  setTimeout(() => {
    element.textContent = "";
    element.className = "save-status-indicator";
  }, 3500);
}

// Save API Key
saveApiKeyBtn.addEventListener("click", () => {
  const newKey = adminApiKey.value.trim();
  geminiApiKey = newKey;
  localStorage.setItem("GEMINI_API_KEY", newKey);
  showStatus(apiKeySaveStatus, "Gemini API Key가 안전하게 로컬에 저장되었습니다! 🔑", true);
});

// Save Profile Info
saveProfileBtn.addEventListener("click", () => {
  const selectedTone = document.querySelector('input[name="avatar-tone"]:checked').value;
  
  activeConfig.EMOJI = adminEmoji.value.trim();
  activeConfig.USER_NAME = adminUserName.value.trim() || "영우 (Youngwu)";
  activeConfig.AVATAR_NAME = adminAvatarName.value.trim() || "Youngwu 아바타 봇";
  activeConfig.ROLE = adminRole.value.trim();
  activeConfig.TEAM = adminTeam.value.trim();
  activeConfig.STATUS = adminStatus.value.trim();
  activeConfig.CONTACT = adminContact.value.trim();
  activeConfig.TONE = selectedTone;

  saveToLocalStorage();
  syncProfileUI();
  renderSuggestionChips();
  showStatus(profileSaveStatus, "아바타 프로필 변경 사항이 정상적으로 반영되었습니다! 👤", true);
});

// Save Knowledge Base
saveKnowledgeBtn.addEventListener("click", () => {
  activeConfig.KNOWLEDGE_BASE = adminKnowledgeBase.value;
  saveToLocalStorage();
  showStatus(knowledgeSaveStatus, "업무 지식 데이터베이스가 성공적으로 업데이트되었습니다! 📖", true);
});

// Add FAQ
addFaqBtn.addEventListener("click", () => {
  const qVal = newFaqQ.value.trim();
  const aVal = newFaqA.value.trim();

  if (!qVal || !aVal) {
    alert("질문과 답변을 모두 채워주세요.");
    return;
  }

  if (!activeConfig.FAQS) activeConfig.FAQS = [];
  
  activeConfig.FAQS.push({ q: qVal, a: aVal });
  
  // If suggestions were empty or built from FAQs, update them too
  if (!activeConfig.SUGGESTIONS || activeConfig.SUGGESTIONS.length < 4) {
    if (!activeConfig.SUGGESTIONS) activeConfig.SUGGESTIONS = [];
    activeConfig.SUGGESTIONS.push(qVal);
  }

  saveToLocalStorage();
  renderFaqListAdmin();
  renderSuggestionChips();
  
  // Clear inputs
  newFaqQ.value = "";
  newFaqA.value = "";
});

// Delete FAQ
function deleteFaq(index) {
  if (confirm("이 FAQ 항목을 삭제하시겠습니까?")) {
    const deletedFaq = activeConfig.FAQS.splice(index, 1)[0];
    
    // Also remove from suggestion chips if it was there
    if (activeConfig.SUGGESTIONS) {
      activeConfig.SUGGESTIONS = activeConfig.SUGGESTIONS.filter(s => s !== deletedFaq.q);
    }

    saveToLocalStorage();
    renderFaqListAdmin();
    renderSuggestionChips();
  }
}

// Reset Configuration to Default
resetDefaultsBtn.addEventListener("click", () => {
  if (confirm("정말 모든설정을 기획 초기 기본값으로 리셋하시겠습니까?\n(로컬에 저장된 정보 및 API Key가 모두 삭제됩니다)")) {
    localStorage.removeItem("AVATAR_CONFIG");
    localStorage.removeItem("GEMINI_API_KEY");
    location.reload();
  }
});

// Save to LocalStorage helper
function saveToLocalStorage() {
  localStorage.setItem("AVATAR_CONFIG", JSON.stringify(activeConfig));
}

// Generate and trigger download of config.js file
downloadConfigBtn.addEventListener("click", () => {
  // Grab latest API Key from input to offer baking it in
  const latestApiKey = adminApiKey.value.trim();
  
  let keyToBake = "";
  if (latestApiKey) {
    if (confirm("🔒 [보안 중요]\n다운로드받는 config.js 파일 안에 입력된 Gemini API Key를 같이 동봉하시겠습니까?\n\n'확인'을 누르시면 동료들이 이 파일을 실행할 때 별도 API Key 입력 없이 즉시 대화가 가능한 완성형 파일이 제작됩니다. (사내용 보안 공유 시 권장)\n'취소'를 누르시면 API Key란을 빈칸으로 남겨둔 안전형 파일이 제작됩니다.")) {
      keyToBake = latestApiKey;
    }
  }

  const generatedJsContent = `// AI Work Avatar - Static Configuration
const CONFIG = {
  // 여기에 Gemini API Key를 적어두면 동료들이 접속했을 때 API Key 입력 없이 즉시 대화가 가능합니다.
  // 비워둘 경우 브라우저의 localStorage나 관리자 설정 창에서 입력한 키를 사용합니다.
  GEMINI_API_KEY: "${keyToBake.replace(/"/g, '\\"')}",
  
  // 아바타 프로필 정보
  AVATAR_NAME: "${(activeConfig.AVATAR_NAME || '').replace(/"/g, '\\"')}",
  USER_NAME: "${(activeConfig.USER_NAME || '').replace(/"/g, '\\"')}",
  ROLE: "${(activeConfig.ROLE || '').replace(/"/g, '\\"')}",
  TEAM: "${(activeConfig.TEAM || '').replace(/"/g, '\\"')}",
  STATUS: "${(activeConfig.STATUS || '').replace(/"/g, '\\"')}",
  EMOJI: "${(activeConfig.EMOJI || '').replace(/"/g, '\\"')}",
  CONTACT: "${(activeConfig.CONTACT || '').replace(/"/g, '\\"')}",
  
  // 아바타 인격 및 말투 설정 (Option A)
  // 'friendly' (친절하고 유연함), 'professional' (정중하고 전문적), 'concise' (간결하고 핵심적)
  TONE: "${(activeConfig.TONE || 'friendly')}", 
  
  // 추천 질문 퀵 칩 목록
  SUGGESTIONS: ${JSON.stringify(activeConfig.SUGGESTIONS || [], null, 2)},
  
  // 자주 묻는 질문 FAQ
  FAQS: ${JSON.stringify(activeConfig.FAQS || [], null, 2)},
  
  // 업무 지식 데이터베이스 (AI 아바타가 대답할 때 참고할 상세 업무 명세서)
  KNOWLEDGE_BASE: \`${activeConfig.KNOWLEDGE_BASE.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
};
`;

  // Create Blob and trigger download
  const blob = new Blob([generatedJsContent], { type: "application/javascript;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "config.js");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// 5. VISITOR CHAT SYSTEM

let chatHistory = [];

// Reset chat messages to welcome message
function resetChatFeed() {
  chatMessagesFeed.innerHTML = "";
  chatHistory = [];
  
  const botWelcome = getWelcomeMessage(activeConfig.AVATAR_NAME, activeConfig.USER_NAME);
  appendMessageBubble("bot", botWelcome, activeConfig.AVATAR_NAME);
}

// Append a message bubble to the chat container
function appendMessageBubble(sender, text, senderName) {
  const msgWrapper = document.createElement("div");
  msgWrapper.className = `message ${sender}`;
  
  const displayName = sender === "bot" 
    ? (senderName || activeConfig.AVATAR_NAME) 
    : "동료 (Visitor)";
    
  msgWrapper.innerHTML = `
    <span class="message-sender">${displayName}</span>
    <div class="message-bubble">${markdownToHtml(text)}</div>
  `;
  
  chatMessagesFeed.appendChild(msgWrapper);
  chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
}

// Super simple client-side markdown formatting helper
function markdownToHtml(text) {
  let html = escapeHtml(text);
  
  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet points
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
  
  // Inline Code `code`
  html = html.replace(/`(.*?)`/g, '<code class="font-mono" style="background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-size: 0.85em; border: 1px solid var(--border-light);">$1</code>');
  
  // Headers # title
  html = html.replace(/^#\s+(.*?)$/gm, '<h3 style="font-size: 1.1rem; margin-top: 15px; margin-bottom: 8px; color: hsl(230, 85%, 85%);">$1</h3>');
  html = html.replace(/^##\s+(.*?)$/gm, '<h4 style="font-size: 0.95rem; margin-top: 12px; margin-bottom: 6px; border-bottom: 1px solid var(--border-light); padding-bottom: 2px;">$1</h4>');
  
  return html;
}

// Show bouncing typing indicator
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "message bot typing-indicator-bubble";
  indicator.id = "typing-indicator";
  indicator.innerHTML = `
    <span class="message-sender">${activeConfig.AVATAR_NAME}</span>
    <div class="message-bubble" style="padding: 10px 16px;">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatMessagesFeed.appendChild(indicator);
  chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
}

// Remove bouncing typing indicator
function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

// Submit forms in visitor chat view
chatInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = chatUserInput.value.trim();
  if (!input) return;
  
  handleUserSubmit(input);
  chatUserInput.value = "";
});

// Main orchestrator for handling user questions
async function handleUserSubmit(text) {
  // Prevent duplicate double inputs if processing
  if (document.getElementById("typing-indicator")) return;

  // Append user bubble
  appendMessageBubble("user", text, "동료");
  
  // Add to AI history
  chatHistory.push({ role: "user", parts: [{ text: text }] });

  // Start AI thinking
  showTypingIndicator();

  // Validate API key
  if (!geminiApiKey || geminiApiKey.trim() === "") {
    await sleep(800); // Simulate network latency for visual completeness
    removeTypingIndicator();
    appendMessageBubble("bot", "🚨 **Gemini API Key가 등록되지 않았습니다.**\n\n상단의 **[관리자 설정]** 탭으로 이동하셔서 API Key를 입력 및 저장하신 후 이용해 주세요. (로컬에만 안전하게 보관됩니다)", activeConfig.AVATAR_NAME);
    return;
  }

  try {
    const aiResponse = await getGeminiResponse(text);
    removeTypingIndicator();
    appendMessageBubble("bot", aiResponse, activeConfig.AVATAR_NAME);
    chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
  } catch (error) {
    console.error("Gemini API 호출에 실패했습니다:", error);
    removeTypingIndicator();
    appendMessageBubble(
      "bot", 
      `❌ **아바타 작동 중 네트워크 오류가 발생했습니다.**
      
보통 다음과 같은 이유로 발생합니다:
1. 입력하신 **API Key가 유효하지 않거나 만료**되었습니다. ([관리자 설정]에서 키를 다시 확인해 주세요.)
2. 일시적인 인터넷 네트워크 장애가 있습니다.
      
*에러 상세 정보: ${error.message}*`, 
      activeConfig.AVATAR_NAME
    );
  }
}

// Utility delay timer
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 6. GEMINI API DIRECT FETCH ENGINE (OPTION A PERSONA)

async function getGeminiResponse(userQuestion) {
  // System Prompt for Strict Mode Option A & Tone Management
  const systemPrompt = `당신은 ${activeConfig.USER_NAME}님의 공식 업무 대행 아바타 봇인 '${activeConfig.AVATAR_NAME}'입니다.
당신의 역할은 ${activeConfig.USER_NAME}님의 직장 동료가 업무에 대해 물어봤을 때, 아래 기재된 [업무 지식 데이터베이스] 및 [자주 묻는 질문 FAQ] 정보를 기반으로 ${activeConfig.USER_NAME}님을 완벽하게 대변하여 답변하는 것입니다.

[말투 및 성격 프리셋: ${activeConfig.TONE || 'friendly'}]
- 'friendly' (친절함): 친숙하고 다정하며 이모지(😊, ✨, 👍)를 섞어서 존댓말로 조곤조곤 얘기해 줍니다. 동료의 피로를 풀어줄 정도로 싹싹하게 도움을 주는 느낌입니다.
- 'professional' (전문적): 격식 있고 단정하게 존댓말을 구사하며, 과도한 이모지를 삼가고 신뢰감 있는 명확한 표현을 사용합니다.
- 'concise' (간결함): 군더더기 서술을 없애고 묻는 내용의 핵심 팩트만 정중하되 아주 짧고 굵게 한두 문장 혹은 항목화로 단답합니다.
- 당신은 ${activeConfig.USER_NAME}님 본인이 아니며, ${activeConfig.USER_NAME}님을 대행하는 AI 비서/아바타라는 정체성을 확실히 기억하고 어조를 맞춰주세요.

[★매우 중요 - 엄격한 필터링 규칙 (옵션 A)★]
- 오직 ${activeConfig.USER_NAME}님의 담당 업무, 프로젝트, 규칙, 일정, 연락처, FAQ에 적힌 업무 관련 질문에만 답변하세요.
- 제공된 정보에 명시되지 않은 사적인 지식이나, 일반 지식 질문(예: "오늘 서울 날씨 어때?", "파이썬으로 웹 서버 띄우는 코드 짜줘", "아이언맨 주연 배우가 누구야?", "농담 하나만 해줘")은 **정중하지만 단호하게 거절**해야 합니다.
- 거절 시 정형화된 거절 멘트를 쓰되, 사용자 설정 톤에 어울리도록 부드럽게 변형하세요. 
  (거절 뼈대 예: "죄송합니다. 저는 ${activeConfig.USER_NAME}님의 업무 아바타 봇이기에 영우님의 업무/프로젝트 범위 이외의 질문이나 일반 코딩 관련 문제에는 대답할 수 없습니다. 업무 관련하여 도움드릴 내용이 있다면 말씀해 주세요!")

[제공된 자주 묻는 질문 FAQ]
${JSON.stringify(activeConfig.FAQS || [], null, 2)}

[업무 지식 데이터베이스 (Knowledge Base)]
${activeConfig.KNOWLEDGE_BASE}
`;

  // We construct the contents array for Gemini GenerateContent API.
  // We place the massive system instructions as the very first system_instruction parameter or embedded in a system instruction block.
  // Since some versions of beta endpoints support systemInstruction, we'll send it as part of the structured request.
  
  const requestBody = {
    contents: [
      // Inject system instructions as the first prompt context to guarantee obedience
      {
        role: "user",
        parts: [{ text: `[SYSTEM INSTRUCTIONS - 반드시 본 규칙을 100% 지키고, 이에 부합하지 않는 질문은 거절 규칙에 의거해 칼같이 대답을 거절하십시오]\n${systemPrompt}\n\n[USER QUESTION]\n${userQuestion}` }]
      }
    ],
    generationConfig: {
      temperature: 0.25, // Low temperature for high factual accuracy and adherence to the guide
      maxOutputTokens: 800,
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("올바른 응답 데이터를 받지 못했습니다.");
  }
}

// 7. INITIALIZATION START
window.addEventListener("DOMContentLoaded", initAppState);
