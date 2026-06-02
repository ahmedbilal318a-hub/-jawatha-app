// ==============================
// مساعد جواثا الذكي — واجهة الشات
// يتصل بـ Supabase Edge Function (ai-chat) التي تخفي مفتاح Gemini
// ==============================

// SUPABASE_URL و SUPABASE_KEY معرّفان في supabase-init.js
const AI_ENDPOINT = SUPABASE_URL + '/functions/v1/ai-chat';

// سجل المحادثة (يُرسل للنموذج للحفاظ على السياق)
const aiHistory = [];

const messagesEl = document.getElementById('aiMessages');
const formEl = document.getElementById('aiForm');
const inputEl = document.getElementById('aiInput');
const sendBtn = document.getElementById('aiSend');

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// تحويل نص بسيط (أسطر + **عريض**) إلى HTML آمن
function formatReply(text) {
    let safe = escapeHTML(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, html) {
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot');

    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = role === 'user' ? '🧑‍🎓' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.innerHTML = html;

    if (role === 'user') {
        wrap.appendChild(bubble);
        wrap.appendChild(avatar);
    } else {
        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
    }
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return bubble;
}

function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg ai-msg-bot';
    wrap.id = 'aiTyping';
    wrap.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-bubble ai-typing"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(wrap);
    scrollToBottom();
}

function removeTyping() {
    const t = document.getElementById('aiTyping');
    if (t) t.remove();
}

async function sendMessage(text) {
    const question = text.trim();
    if (!question) return;

    // إزالة الاقتراحات بعد أول سؤال
    const sugg = document.querySelector('.ai-suggestions');
    if (sugg) sugg.remove();

    addMessage('user', escapeHTML(question));
    aiHistory.push({ role: 'user', text: question });

    inputEl.value = '';
    inputEl.style.height = 'auto';
    inputEl.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    try {
        const res = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
            },
            body: JSON.stringify({ messages: aiHistory }),
        });

        removeTyping();
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.error) {
            addMessage('bot', '⚠️ ' + escapeHTML(data.error || 'حدث خطأ. حاول مرة أخرى بعد قليل.'));
        } else {
            const reply = data.reply || 'لم أفهم سؤالك، حاول إعادة صياغته.';
            addMessage('bot', formatReply(reply));
            aiHistory.push({ role: 'model', text: reply });
        }
    } catch (e) {
        removeTyping();
        addMessage('bot', '⚠️ تعذّر الاتصال بالمساعد. تأكد من اتصالك بالإنترنت وحاول مجدداً.');
    } finally {
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
    }
}

// إرسال النموذج
formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(inputEl.value);
});

// Enter للإرسال، Shift+Enter لسطر جديد
inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputEl.value);
    }
});

// تكبير حقل الكتابة تلقائياً
inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
});

// أزرار الاقتراحات الجاهزة
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ai-suggestion')) {
        sendMessage(e.target.textContent);
    }
});

inputEl.focus();
