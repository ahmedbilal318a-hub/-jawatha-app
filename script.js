// ==============================
// منصة جواثا - الطالب يسأل والمعلم يجيب
// متصلة بـ Supabase
// ==============================

const STORAGE_KEYS = {
    CURRENT_TEACHER: 'jawatha_current_teacher'
};

// ============ Supabase Helpers ============
async function getTeachers() {
    const { data, error } = await supabaseClient.rpc('get_teachers');
    if (error) { console.error('getTeachers:', error); return []; }
    return data || [];
}

async function getQuestions() {
    const { data, error } = await supabaseClient
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('getQuestions:', error); return []; }
    return (data || []).map(q => ({
        id: q.id,
        studentName: q.student_name,
        studentGrade: q.student_grade,
        teacherUsername: q.teacher_username,
        teacherName: q.teacher_name,
        teacherSubject: q.teacher_subject,
        subject: q.subject,
        question: q.question,
        answer: q.answer,
        answeredAt: q.answered_at,
        createdAt: q.created_at,
        status: q.status,
        questionAttachmentUrl: q.question_attachment_url,
        questionAttachmentName: q.question_attachment_name,
        answerAttachmentUrl: q.answer_attachment_url,
        answerAttachmentName: q.answer_attachment_name
    }));
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function uploadAttachment(file) {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) {
        showToast('⚠️ حجم الملف كبير جداً (الحد الأقصى 10 ميجا)', 'error');
        return null;
    }
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error } = await supabaseClient.storage
        .from('attachments')
        .upload(safeName, file, { cacheControl: '3600', upsert: false });
    if (error) {
        console.error('upload:', error);
        showToast('❌ فشل رفع الملف: ' + error.message, 'error');
        return null;
    }
    const { data } = supabaseClient.storage.from('attachments').getPublicUrl(safeName);
    return { url: data.publicUrl, name: file.name };
}

function isImageUrl(url, name) {
    const s = (name || url || '').toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(s);
}

function renderAttachment(url, name, label = '📎 المرفق') {
    if (!url) return '';
    const safeName = escapeHTML(name || 'ملف مرفق');
    const safeUrl = escapeHTML(url);
    if (isImageUrl(url, name)) {
        return `
            <div class="attachment-card">
                <div class="attachment-label">${label}</div>
                <a href="${safeUrl}" target="_blank" rel="noopener">
                    <img src="${safeUrl}" alt="${safeName}" class="attachment-img">
                </a>
                <div class="attachment-name">${safeName}</div>
            </div>`;
    }
    return `
        <div class="attachment-card">
            <div class="attachment-label">${label}</div>
            <a href="${safeUrl}" target="_blank" rel="noopener" class="attachment-link">
                📄 ${safeName}
            </a>
        </div>`;
}

function setupFilePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast('⚠️ حجم الملف كبير جداً (الحد الأقصى 10 ميجا)', 'error');
            input.value = '';
            preview.classList.add('hidden');
            return;
        }
        const sizeKB = (file.size / 1024).toFixed(1);
        preview.classList.remove('hidden');
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            preview.innerHTML = `
                <img src="${url}" alt="معاينة" class="preview-img">
                <div class="preview-info">📷 ${escapeHTML(file.name)} (${sizeKB} KB)</div>
            `;
        } else {
            preview.innerHTML = `
                <div class="preview-info">📄 ${escapeHTML(file.name)} (${sizeKB} KB)</div>
            `;
        }
    });
}

async function loginTeacher(username, password) {
    const { data, error } = await supabaseClient.rpc('login_teacher', {
        p_username: username,
        p_password: password
    });
    if (error) { console.error('loginTeacher:', error); return null; }
    if (!data || data.length === 0) return null;
    return data[0];
}

// ============ Session ============
function getCurrentTeacher() {
    const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER);
    return data ? JSON.parse(data) : null;
}

function setCurrentTeacher(teacher) {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
}

function clearCurrentTeacher() {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_TEACHER);
}

// ============ Utilities ============
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate(isoDate) {
    const d = new Date(isoDate);
    return d.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });
}

// ============ صفحة الطالب ============
let cachedTeachers = [];

async function initStudentPage() {
    setupTabs();
    await setupTeacherSearch();
    setupAskForm();
    setupSearchQuestions();
    setupFilePreview('questionFile', 'questionFilePreview');
}

function normalizeArabic(str) {
    return (str || '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْ]/g, '')
        .toLowerCase()
        .trim();
}

async function setupTeacherSearch() {
    const searchInput = document.getElementById('teacherSearch');
    const hiddenInput = document.getElementById('teacherSelect');
    const dropdown = document.getElementById('teacherDropdown');
    const badge = document.getElementById('selectedTeacherBadge');
    const wrapper = document.getElementById('teacherSearchWrapper');
    if (!searchInput || !dropdown) return;

    cachedTeachers = await getTeachers();

    const renderResults = (query) => {
        const q = normalizeArabic(query);
        const list = q === ''
            ? cachedTeachers
            : cachedTeachers.filter(t => normalizeArabic(t.name).includes(q));

        if (list.length === 0) {
            dropdown.innerHTML = '<div class="search-empty">لا يوجد معلم بهذا الاسم</div>';
        } else {
            dropdown.innerHTML = list.map(t => `
                <div class="search-item" data-username="${escapeHTML(t.username)}" data-name="${escapeHTML(t.name)}">
                    ${escapeHTML(t.name)}
                </div>
            `).join('');
        }
        dropdown.classList.remove('hidden');
    };

    const selectTeacher = (username, name) => {
        hiddenInput.value = username;
        searchInput.value = name;
        badge.textContent = '✅ تم اختيار المعلم: ' + name;
        badge.classList.remove('hidden');
        dropdown.classList.add('hidden');
    };

    searchInput.addEventListener('focus', () => renderResults(searchInput.value));
    searchInput.addEventListener('input', () => {
        hiddenInput.value = '';
        badge.classList.add('hidden');
        renderResults(searchInput.value);
    });

    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (!item) return;
        selectTeacher(item.dataset.username, item.dataset.name);
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function setupAskForm() {
    const form = document.getElementById('askForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const teacherUsername = document.getElementById('teacherSelect').value;
        const teachers = cachedTeachers.length ? cachedTeachers : await getTeachers();
        const teacher = teachers.find(t => t.username === teacherUsername);

        if (!teacher) {
            showToast('⚠️ يرجى اختيار معلم من قائمة البحث', 'error');
            return;
        }

        const newQuestion = {
            student_name: document.getElementById('studentName').value.trim(),
            student_grade: document.getElementById('studentGrade').value,
            teacher_username: teacherUsername,
            teacher_name: teacher.name,
            teacher_subject: teacher.subject,
            subject: document.getElementById('subject').value.trim(),
            question: document.getElementById('questionText').value.trim(),
            status: 'pending'
        };

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ جاري الإرسال...';

        const fileInput = document.getElementById('questionFile');
        const file = fileInput && fileInput.files[0];
        if (file) {
            submitBtn.textContent = '⏳ جاري رفع المرفق...';
            const att = await uploadAttachment(file);
            if (att) {
                newQuestion.question_attachment_url = att.url;
                newQuestion.question_attachment_name = att.name;
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            submitBtn.textContent = '⏳ جاري الإرسال...';
        }

        const { error } = await supabaseClient.from('questions').insert(newQuestion);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (error) {
            console.error('insert question:', error);
            showToast('❌ حدث خطأ في إرسال السؤال', 'error');
            return;
        }

        showToast('✅ تم إرسال سؤالك بنجاح للمعلم ' + teacher.name, 'success');
        form.reset();
        document.getElementById('teacherSearch').value = '';
        document.getElementById('teacherSelect').value = '';
        const badge = document.getElementById('selectedTeacherBadge');
        if (badge) badge.classList.add('hidden');
        const preview = document.getElementById('questionFilePreview');
        if (preview) { preview.classList.add('hidden'); preview.innerHTML = ''; }
    });
}

function setupSearchQuestions() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchStudent');
    if (!searchBtn) return;

    const performSearch = async () => {
        const name = searchInput.value.trim();
        const list = document.getElementById('myQuestionsList');
        if (!name) {
            list.innerHTML = '<p class="empty-state">اكتب اسمك في خانة البحث لعرض أسئلتك وإجاباتها</p>';
            return;
        }
        list.innerHTML = '<p class="empty-state">⏳ جاري البحث...</p>';
        const allQuestions = await getQuestions();
        const questions = allQuestions.filter(q =>
            q.studentName.toLowerCase().includes(name.toLowerCase())
        );
        renderStudentQuestions(questions, list);
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

function renderStudentQuestions(questions, container) {
    if (questions.length === 0) {
        container.innerHTML = '<p class="empty-state">لا توجد أسئلة باسم هذا الطالب</p>';
        return;
    }

    container.innerHTML = questions.map(q => `
        <div class="question-card ${q.status === 'answered' ? 'answered' : ''}">
            <div class="question-header">
                <div class="question-meta">
                    <span class="tag tag-grade">${escapeHTML(q.studentGrade)}</span>
                    <span class="tag tag-teacher">${escapeHTML(q.teacherName)} - ${escapeHTML(q.teacherSubject)}</span>
                    <span class="tag tag-date">${formatDate(q.createdAt)}</span>
                    <span class="tag ${q.status === 'answered' ? 'tag-status-answered' : 'tag-status-pending'}">
                        ${q.status === 'answered' ? '✅ تمت الإجابة' : '⏳ بانتظار الإجابة'}
                    </span>
                </div>
            </div>
            <div class="question-title">📌 ${escapeHTML(q.subject)}</div>
            <div class="question-text">${escapeHTML(q.question)}</div>
            ${renderAttachment(q.questionAttachmentUrl, q.questionAttachmentName, '📎 مرفق السؤال')}
            ${q.answer ? `
                <div class="answer-section">
                    <h4>💬 إجابة المعلم:</h4>
                    <div class="answer-text">${escapeHTML(q.answer)}</div>
                    ${renderAttachment(q.answerAttachmentUrl, q.answerAttachmentName, '📎 مرفق الإجابة')}
                    <div class="answer-meta">تمت الإجابة في: ${formatDate(q.answeredAt)}</div>
                </div>
            ` : '<p style="color: var(--text-light); font-style: italic; margin-top:10px;">⏳ في انتظار رد المعلم...</p>'}
        </div>
    `).join('');
}

// ============ صفحة تسجيل دخول المعلم ============
async function initLoginPage() {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('loginError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        errorMsg.textContent = '⏳ جاري التحقق...';
        const teacher = await loginTeacher(username, password);

        if (teacher) {
            setCurrentTeacher(teacher);
            errorMsg.textContent = '';
            window.location.href = 'teacher.html';
        } else {
            errorMsg.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    });

    // عرض أسماء المستخدمين (بدون كلمات المرور) للمعلمين لو نسوا
    const showBtn = document.getElementById('showCredentialsBtn');
    const credList = document.getElementById('credentialsList');
    const credContent = document.getElementById('credentialsContent');

    if (showBtn) {
        showBtn.addEventListener('click', async () => {
            credList.classList.toggle('hidden');
            if (!credList.classList.contains('hidden')) {
                const teachers = await getTeachers();
                credContent.innerHTML = teachers.map(t => `
                    <div class="credential-item">
                        <strong>${escapeHTML(t.name)}</strong> - ${escapeHTML(t.subject)}<br>
                        اسم المستخدم: <code>${escapeHTML(t.username)}</code>
                    </div>
                `).join('');
            }
        });
    }
}

// ============ صفحة المعلم ============
async function initTeacherPage() {
    const teacher = getCurrentTeacher();
    if (!teacher) {
        window.location.href = 'teacher-login.html';
        return;
    }

    document.getElementById('teacherWelcome').textContent = 'مرحباً ' + teacher.name;
    document.getElementById('teacherSubject').textContent = '📖 معلم: ' + teacher.subject;

    setupTabs();
    setupLogout();
    setupFilePreview('answerFile', 'answerFilePreview');
    await renderTeacherQuestions();
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            clearCurrentTeacher();
            window.location.href = 'index.html';
        }
    });
}

async function renderTeacherQuestions() {
    const teacher = getCurrentTeacher();
    if (!teacher) return;

    const allQuestions = (await getQuestions()).filter(q => q.teacherUsername === teacher.username);
    const pending = allQuestions.filter(q => q.status === 'pending');
    const answered = allQuestions.filter(q => q.status === 'answered');

    document.getElementById('totalQuestions').textContent = allQuestions.length;
    document.getElementById('pendingQuestions').textContent = pending.length;
    document.getElementById('answeredQuestions').textContent = answered.length;

    const pendingList = document.getElementById('pendingList');
    if (pending.length === 0) {
        pendingList.innerHTML = '<p class="empty-state">🎉 رائع! لا توجد أسئلة بانتظار الإجابة حالياً</p>';
    } else {
        pendingList.innerHTML = pending.map(q => `
            <div class="question-card">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="tag tag-student">👤 ${escapeHTML(q.studentName)}</span>
                        <span class="tag tag-grade">${escapeHTML(q.studentGrade)}</span>
                        <span class="tag tag-date">${formatDate(q.createdAt)}</span>
                    </div>
                </div>
                <div class="question-title">📌 ${escapeHTML(q.subject)}</div>
                <div class="question-text">${escapeHTML(q.question)}</div>
                ${renderAttachment(q.questionAttachmentUrl, q.questionAttachmentName, '📎 مرفق السؤال')}
                <button class="answer-btn" onclick="openAnswerModal('${q.id}')">✍️ كتابة الإجابة</button>
            </div>
        `).join('');
    }

    const answeredList = document.getElementById('answeredList');
    if (answered.length === 0) {
        answeredList.innerHTML = '<p class="empty-state">لم تتم الإجابة على أي سؤال بعد</p>';
    } else {
        answeredList.innerHTML = answered.map(q => `
            <div class="question-card answered">
                <div class="question-header">
                    <div class="question-meta">
                        <span class="tag tag-student">👤 ${escapeHTML(q.studentName)}</span>
                        <span class="tag tag-grade">${escapeHTML(q.studentGrade)}</span>
                        <span class="tag tag-date">${formatDate(q.createdAt)}</span>
                        <span class="tag tag-status-answered">✅ تمت الإجابة</span>
                    </div>
                </div>
                <div class="question-title">📌 ${escapeHTML(q.subject)}</div>
                <div class="question-text">${escapeHTML(q.question)}</div>
                ${renderAttachment(q.questionAttachmentUrl, q.questionAttachmentName, '📎 مرفق السؤال')}
                <div class="answer-section">
                    <h4>💬 إجابتك:</h4>
                    <div class="answer-text">${escapeHTML(q.answer)}</div>
                    ${renderAttachment(q.answerAttachmentUrl, q.answerAttachmentName, '📎 مرفق الإجابة')}
                    <div class="answer-meta">تاريخ الإجابة: ${formatDate(q.answeredAt)}</div>
                </div>
                <button class="answer-btn" onclick="openAnswerModal('${q.id}', true)">✏️ تعديل الإجابة</button>
            </div>
        `).join('');
    }
}

// ============ نافذة كتابة الإجابة ============
let currentQuestionId = null;

async function openAnswerModal(questionId, isEdit = false) {
    currentQuestionId = questionId;
    const questions = await getQuestions();
    const q = questions.find(qq => qq.id === questionId);
    if (!q) return;

    document.getElementById('modalQuestionInfo').innerHTML = `
        <h4>سؤال من: ${escapeHTML(q.studentName)} (${escapeHTML(q.studentGrade)})</h4>
        <p><strong>${escapeHTML(q.subject)}</strong></p>
        <p style="margin-top:10px;">${escapeHTML(q.question)}</p>
        ${renderAttachment(q.questionAttachmentUrl, q.questionAttachmentName, '📎 مرفق السؤال')}
    `;
    document.getElementById('answerText').value = q.answer || '';
    const answerFile = document.getElementById('answerFile');
    if (answerFile) answerFile.value = '';
    const answerPreview = document.getElementById('answerFilePreview');
    if (answerPreview) { answerPreview.classList.add('hidden'); answerPreview.innerHTML = ''; }
    const modal = document.getElementById('answerModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeAnswerModal() {
    const modal = document.getElementById('answerModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    currentQuestionId = null;
}

async function submitAnswer() {
    const answerText = document.getElementById('answerText').value.trim();
    if (!answerText) {
        showToast('⚠️ يرجى كتابة الإجابة أولاً', 'error');
        return;
    }
    if (!currentQuestionId) return;

    const sendBtn = document.querySelector('#answerModal .submit-btn');
    sendBtn.disabled = true;
    const original = sendBtn.textContent;
    sendBtn.textContent = '⏳ جاري الإرسال...';

    const update = {
        answer: answerText,
        answered_at: new Date().toISOString(),
        status: 'answered'
    };

    const fileInput = document.getElementById('answerFile');
    const file = fileInput && fileInput.files[0];
    if (file) {
        sendBtn.textContent = '⏳ جاري رفع المرفق...';
        const att = await uploadAttachment(file);
        if (att) {
            update.answer_attachment_url = att.url;
            update.answer_attachment_name = att.name;
        } else {
            sendBtn.disabled = false;
            sendBtn.textContent = original;
            return;
        }
        sendBtn.textContent = '⏳ جاري الإرسال...';
    }

    const { error } = await supabaseClient.from('questions').update(update).eq('id', currentQuestionId);

    sendBtn.disabled = false;
    sendBtn.textContent = original;

    if (error) {
        console.error('update answer:', error);
        showToast('❌ حدث خطأ في إرسال الإجابة', 'error');
        return;
    }

    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('answerFilePreview');
    if (preview) { preview.classList.add('hidden'); preview.innerHTML = ''; }

    closeAnswerModal();
    await renderTeacherQuestions();
    showToast('✅ تم إرسال الإجابة للطالب', 'success');
}

// كشف الدوال للاستدعاء من HTML
window.openAnswerModal = openAnswerModal;
window.closeAnswerModal = closeAnswerModal;
window.submitAnswer = submitAnswer;
