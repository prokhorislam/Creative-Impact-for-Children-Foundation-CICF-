// Creative Impact for Children Foundation — shared site behaviour
(function(){
  // ---- Creative Store link (update this one line to change the URL everywhere) ----
  var CREATIVE_STORE_URL = 'https://store.creativeimpactbd.com'; // TODO: replace with your live Creative Store URL
  document.querySelectorAll('[data-store-link]').forEach(function(a){ a.href = CREATIVE_STORE_URL; });

  // ---- Language switcher ----
  function setLang(lang){
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('cicf-lang', lang);
    document.querySelectorAll('.lang-switch button').forEach(function(b){
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }
  var savedLang = localStorage.getItem('cicf-lang') || 'en';
  setLang(savedLang);
  document.querySelectorAll('.lang-switch button').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.lang); });
  });

  // ---- Mobile nav ----
  var menuToggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if(menuToggle && mobileNav){
    menuToggle.addEventListener('click', function(){ mobileNav.classList.add('open'); });
    mobileNav.addEventListener('click', function(e){
      if(e.target === mobileNav) mobileNav.classList.remove('open');
    });
    var closeBtn = document.querySelector('.mobile-nav-close');
    if(closeBtn) closeBtn.addEventListener('click', function(){ mobileNav.classList.remove('open'); });
  }

  // ---- Accessibility: text size toggle ----
  var a11yBtn = document.querySelector('.a11y-textsize');
  if(a11yBtn){
    if(localStorage.getItem('cicf-textlg') === '1') document.body.classList.add('text-lg');
    a11yBtn.addEventListener('click', function(){
      document.body.classList.toggle('text-lg');
      localStorage.setItem('cicf-textlg', document.body.classList.contains('text-lg') ? '1':'0');
    });
  }

  // ---- Form handling: validation, honeypot/time-trap spam protection, Formspree AJAX ----
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var BD_PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

  function fieldError(field, msgEn, msgBn){
    field.classList.add('invalid');
    return { field: field, en: msgEn, bn: msgBn };
  }

  function clearFieldStates(form){
    form.querySelectorAll('.invalid').forEach(function(el){ el.classList.remove('invalid'); });
  }

  function validateForm(form){
    clearFieldStates(form);
    var errors = [];

    // Required fields (skip the honeypot and hidden fields)
    form.querySelectorAll('[required]').forEach(function(field){
      if(field.type === 'checkbox'){
        if(!field.checked){
          errors.push(fieldError(field, 'Please check the consent box to continue.', 'চালিয়ে যেতে অনুগ্রহ করে সম্মতি বক্সে টিক দিন।'));
        }
        return;
      }
      if(!field.value || !field.value.trim()){
        errors.push(fieldError(field, 'This field is required.', 'এই তথ্যটি আবশ্যক।'));
      }
    });

    // Email format (only if filled in)
    var emailField = form.querySelector('[data-validate="email"]');
    if(emailField && emailField.value.trim() && !EMAIL_RE.test(emailField.value.trim())){
      errors.push(fieldError(emailField, 'Please enter a valid email address.', 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।'));
    }

    // Phone format
    var phoneField = form.querySelector('[data-validate="phone"]');
    if(phoneField && phoneField.value.trim() && !BD_PHONE_RE.test(phoneField.value.trim().replace(/[\s-]/g,''))){
      errors.push(fieldError(phoneField, 'Please enter a valid phone number (e.g. 01XXXXXXXXX).', 'অনুগ্রহ করে সঠিক ফোন নম্বর দিন (যেমন ০১XXXXXXXXX)।'));
    }

    return errors;
  }

  function showFormError(errorEl, msgEn, msgBn){
    if(!errorEl) return;
    errorEl.innerHTML = '<span data-en>'+msgEn+'</span><span data-bn>'+msgBn+'</span>';
    errorEl.classList.add('show');
  }

  document.querySelectorAll('form[data-cicf-form]').forEach(function(form){
    var loadTime = Date.now();
    var successEl = form.parentElement.querySelector('.form-success');
    var errorEl = form.querySelector('.form-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitBtnOriginal = submitBtn ? submitBtn.innerHTML : '';
    var replytoTarget = form.querySelector('[data-replyto-target]');
    var timestampTarget = form.querySelector('[data-timestamp-target]');
    var emailField = form.querySelector('[data-validate="email"]');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(errorEl){ errorEl.classList.remove('show'); errorEl.innerHTML = ''; }

      // Honeypot: bots fill every field, humans never see this one
      var honeypot = form.querySelector('input[name="_gotcha"]');
      if(honeypot && honeypot.value){
        // Silently pretend success without sending anywhere
        form.style.display = 'none';
        if(successEl) successEl.classList.add('show');
        return;
      }

      // Time-trap: a submission faster than 3s almost certainly isn't a human filling a long form
      if(Date.now() - loadTime < 3000){
        showFormError(errorEl, 'Please take a moment to review the form before submitting.', 'জমা দেওয়ার আগে অনুগ্রহ করে ফর্মটি একটু দেখে নিন।');
        return;
      }

      var errors = validateForm(form);
      if(errors.length){
        showFormError(errorEl, 'Please check the highlighted fields and try again.', 'অনুগ্রহ করে চিহ্নিত ঘরগুলো পরীক্ষা করে আবার চেষ্টা করুন।');
        errors[0].field.focus();
        return;
      }

      var endpoint = form.dataset.formspreeUrl;
      if(!endpoint){
        // No backend configured for this form yet — show confirmation locally
        form.style.display = 'none';
        if(successEl) successEl.classList.add('show');
        return;
      }

      if(replytoTarget && emailField){ replytoTarget.value = emailField.value.trim(); }
      if(timestampTarget){
        timestampTarget.value = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }) + ' (Asia/Dhaka)';
      }

      if(submitBtn){
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span data-en>Submitting…</span><span data-bn>জমা হচ্ছে...</span>';
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      }).then(function(response){
        if(response.ok){
          form.style.display = 'none';
          if(successEl) successEl.classList.add('show');
        } else {
          return response.json().then(function(data){
            var detail = (data && data.errors && data.errors.length) ? data.errors.map(function(er){ return er.message; }).join(', ') : '';
            throw new Error(detail);
          }).catch(function(){
            throw new Error('server-error');
          });
        }
      }).catch(function(){
        showFormError(errorEl,
          'Something went wrong and your request could not be sent. Please check your internet connection and try again, or call us directly at 01706027127.',
          'কিছু একটা সমস্যা হয়েছে এবং আপনার অনুরোধ পাঠানো যায়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন, অথবা সরাসরি ০১৭০৬০২৭১২৭ নম্বরে কল করুন।'
        );
      }).finally(function(){
        if(submitBtn){
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtnOriginal;
        }
      });
    });

    // Clear the invalid state as the person fixes a field
    form.querySelectorAll('input, textarea').forEach(function(field){
      field.addEventListener('input', function(){ field.classList.remove('invalid'); });
    });
  });

  // ---- Tabs (Services page) ----
  document.querySelectorAll('.tab-bar').forEach(function(bar){
    var group = bar.dataset.group;
    bar.querySelectorAll('.tab-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        bar.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel[data-group="'+group+'"]').forEach(function(p){
          p.classList.toggle('active', p.dataset.tab === btn.dataset.tab);
        });
      });
    });
  });

  // ---- Resource filter chips + search ----
  var chips = document.querySelectorAll('.filter-chips .chip');
  var searchInput = document.querySelector('.search-box input');
  function applyResourceFilter(){
    var activeChip = document.querySelector('.filter-chips .chip.active');
    var cat = activeChip ? activeChip.dataset.cat : 'all';
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    document.querySelectorAll('.article-card').forEach(function(card){
      var matchesCat = (cat === 'all') || (card.dataset.cat === cat);
      var text = card.textContent.toLowerCase();
      var matchesSearch = !q || text.indexOf(q) !== -1;
      card.style.display = (matchesCat && matchesSearch) ? '' : 'none';
    });
  }
  if(chips.length){
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        applyResourceFilter();
      });
    });
  }
  if(searchInput){ searchInput.addEventListener('input', applyResourceFilter); }

  // ---- Gallery category filter ----
  var galleryChips = document.querySelectorAll('.gallery-chips .chip');
  if(galleryChips.length){
    galleryChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        galleryChips.forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        var cat = chip.dataset.cat;
        document.querySelectorAll('.gallery-item').forEach(function(item){
          item.style.display = (cat==='all' || item.dataset.cat===cat) ? '' : 'none';
        });
      });
    });
  }

  // ---- Announcement bar dismiss ----
  var announceClose = document.querySelector('.announce-close');
  var announceBar = document.querySelector('.announce');
  if(announceClose && announceBar){
    if(sessionStorage.getItem('cicf-announce-dismissed')){ announceBar.style.display='none'; }
    announceClose.addEventListener('click', function(){
      announceBar.style.display = 'none';
      sessionStorage.setItem('cicf-announce-dismissed','1');
    });
  }
})();

// ---- Floating chat widget (demo UI — rule-based canned replies, no backend) ----
(function(){
  var widget = document.querySelector('.chat-widget');
  if(!widget) return;

  var toggle = document.getElementById('chatToggle');
  var closeBtn = document.getElementById('chatClose');
  var panel = document.getElementById('chatPanel');
  var messages = document.getElementById('chatMessages');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var badge = document.getElementById('chatBadge');

  function currentLang(){
    return document.documentElement.getAttribute('data-lang') || 'en';
  }

  function openChat(){
    widget.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    if(badge) badge.style.display = 'none';
    setTimeout(function(){ input.focus(); }, 200);
    scrollToBottom();
  }
  function closeChat(){
    widget.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', function(){
    widget.classList.contains('open') ? closeChat() : openChat();
  });
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && widget.classList.contains('open')) closeChat();
  });

  function scrollToBottom(){
    messages.scrollTop = messages.scrollHeight;
  }

  function addBubble(text, who){
    var el = document.createElement('div');
    el.className = 'chat-bubble ' + who;
    el.textContent = text;
    messages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function showTyping(){
    var el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chatTypingIndicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    scrollToBottom();
  }
  function removeTyping(){
    var el = document.getElementById('chatTypingIndicator');
    if(el) el.remove();
  }

  // Very small keyword-based canned-reply set, bilingual, for demo/testing purposes only
  const REPLIES = [
  {
    intent: "greeting",
    priority: 10,
    keys: [
      "hello", "hi", "hey", "good morning", "good afternoon",
      "assalamu alaikum", "assalamualaikum", "assalamu", "salam",
      "হ্যালো", "হাই", "আসসালামু আলাইকুম", "সালাম"
    ],
    en: "Hello! Welcome to Creative Impact for Children Foundation. How may I help you with our services, assessment, admission, fees, or visiting hours?",
    bn: "হ্যালো! ক্রিয়েটিভ ইমপ্যাক্ট ফর চিলড্রেন ফাউন্ডেশনে আপনাকে স্বাগতম। আমাদের সেবা, এসেসমেন্ট, ভর্তি, ফি অথবা খোলার সময় সম্পর্কে কী জানতে চান?"
  },

  {
    intent: "services",
    priority: 7,
    keys: [
      "service", "services", "therapy", "support", "what do you provide",
      "what services", "সেবা", "সেবাসমূহ", "থেরাপি", "কি কি সেবা",
      "কী কী সেবা", "কি সেবা দেন"
    ],
    en: "We provide Special Education, Speech and Language Therapy, Occupational Therapy, Sensory Support, Developmental Therapy, ECD and Pre-Schooling, Day Care, Behavioural Support, Parent Guidance, School Readiness, Social Skills Development, and Vocational Activities.",
    bn: "আমরা বিশেষ শিক্ষা, স্পিচ অ্যান্ড ল্যাঙ্গুয়েজ থেরাপি, অকুপেশনাল থেরাপি, সেন্সরি সাপোর্ট, ডেভেলপমেন্টাল থেরাপি, ECD ও প্রি-স্কুলিং, ডে কেয়ার, আচরণগত সহায়তা, অভিভাবক নির্দেশনা, স্কুল রেডিনেস, সামাজিক দক্ষতা বিকাশ এবং ভোকেশনাল কার্যক্রম প্রদান করি।",
    link: "services.html",
    linkEn: "View All Services",
    linkBn: "সকল সেবা দেখুন"
  },

  {
    intent: "hours",
    priority: 8,
    keys: [
      "hour", "hours", "time", "timing", "open", "close", "closed",
      "friday", "working day", "office time", "visiting time",
      "সময়", "সময়", "খোলা", "বন্ধ", "শুক্রবার", "অফিস টাইম",
      "কয়টা থেকে", "কয়টা থেকে", "কখন আসবো", "ভিজিটিং টাইম"
    ],
    en: "We are open Saturday to Thursday from 10:00 AM to 6:00 PM. We are closed on Friday. Please contact us before visiting to confirm your appointment.",
    bn: "আমরা শনিবার থেকে বৃহস্পতিবার সকাল ১০টা থেকে সন্ধ্যা ৬টা পর্যন্ত খোলা থাকি। শুক্রবার বন্ধ। আসার আগে আপনার সময় নিশ্চিত করতে আমাদের সঙ্গে যোগাযোগ করুন।"
  },

  {
    intent: "assessment",
    priority: 10,
    keys: [
      "assessment", "assess", "evaluation", "book assessment",
      "appointment", "book appointment", "child assessment", "rnda",
      "এসেসমেন্ট", "অ্যাসেসমেন্ট", "মূল্যায়ন", "মূল্যায়ন",
      "অ্যাপয়েন্টমেন্ট", "বুকিং", "আরএনডিএ", "RNDA"
    ],
    en: "The first step is a professional assessment of your child. Based on the assessment findings, our team recommends the most appropriate services and intervention plan. You can request an appointment online or call 01706027127.",
    bn: "প্রথম ধাপে শিশুর পেশাগত এসেসমেন্ট করা হয়। এসেসমেন্টের ফলাফল অনুযায়ী আমাদের টিম শিশুর জন্য উপযুক্ত সেবা ও ইন্টারভেনশন পরিকল্পনা নির্ধারণ করে। অনলাইনে অ্যাপয়েন্টমেন্ট নিতে পারেন অথবা ০১৭০৬০২৭১২৭ নম্বরে কল করুন।",
    link: "assessment.html",
    linkEn: "Book an Assessment",
    linkBn: "এসেসমেন্ট বুক করুন"
  },

  {
    intent: "admission",
    priority: 9,
    keys: [
      "admission", "enrol", "enroll", "registration", "join",
      "admission process", "how to admit", "ভর্তি", "রেজিস্ট্রেশন",
      "কিভাবে ভর্তি", "কীভাবে ভর্তি", "ভর্তি প্রক্রিয়া"
    ],
    en: "Admission begins with an assessment. After reviewing your child’s strengths and needs, our professionals discuss the recommended service plan, schedule, and applicable fees with you.",
    bn: "ভর্তির প্রক্রিয়া শিশুর এসেসমেন্টের মাধ্যমে শুরু হয়। শিশুর সক্ষমতা ও প্রয়োজন মূল্যায়নের পর আমাদের পেশাজীবীরা আপনার সঙ্গে উপযুক্ত সেবা পরিকল্পনা, সময়সূচি এবং প্রযোজ্য ফি নিয়ে আলোচনা করেন।",
    link: "admission.html",
    linkEn: "View Admission Process",
    linkBn: "ভর্তি প্রক্রিয়া দেখুন"
  },

  {
    intent: "fees",
    priority: 9,
    keys: [
      "fee", "fees", "cost", "price", "payment", "monthly fee",
      "therapy cost", "admission fee", "charge", "ফি", "খরচ",
      "মূল্য", "চার্জ", "মাসিক বেতন", "থেরাপি ফি", "ভর্তি ফি"
    ],
    en: "Fees vary depending on the child’s assessed needs, selected service, session frequency, and service plan. Please call 01706027127 or contact us for current pricing information.",
    bn: "শিশুর মূল্যায়িত প্রয়োজন, নির্বাচিত সেবা, সেশনের সংখ্যা এবং সেবা পরিকল্পনা অনুযায়ী ফি ভিন্ন হতে পারে। বর্তমান ফি জানতে ০১৭০৬০২৭১২৭ নম্বরে কল করুন অথবা আমাদের সঙ্গে যোগাযোগ করুন।",
    link: "contact.html",
    linkEn: "Contact Us",
    linkBn: "যোগাযোগ করুন"
  },

  {
    intent: "specialEducation",
    priority: 8,
    keys: [
      "special education", "special school", "learning difficulty",
      "academic support", "individual education", "iep",
      "বিশেষ শিক্ষা", "স্পেশাল স্কুল", "শেখার সমস্যা",
      "একাডেমিক সাপোর্ট", "আইইপি"
    ],
    en: "Our Special Education programme provides individualized, assessment-based educational support addressing each child’s learning, communication, behavioural, developmental, and functional needs.",
    bn: "আমাদের বিশেষ শিক্ষা কার্যক্রমে প্রতিটি শিশুর শেখা, যোগাযোগ, আচরণগত, বিকাশগত এবং দৈনন্দিন কার্যকর দক্ষতার প্রয়োজন অনুযায়ী মূল্যায়নভিত্তিক ব্যক্তিকেন্দ্রিক সহায়তা প্রদান করা হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "speech",
    priority: 9,
    keys: [
      "speech", "language therapy", "speech delay", "late talking",
      "non verbal", "nonverbal", "communication problem",
      "pronunciation", "talking", "not talking",
      "স্পিচ", "কথা বলে না", "কথা বলতে দেরি", "স্পিচ ডিলে",
      "নন ভার্বাল", "নন-ভার্বাল", "ভাষার সমস্যা",
      "যোগাযোগ সমস্যা", "উচ্চারণ"
    ],
    en: "Speech and Language Therapy supports children with speech delay, language difficulties, unclear pronunciation, limited vocabulary, comprehension challenges, and functional communication needs.",
    bn: "স্পিচ অ্যান্ড ল্যাঙ্গুয়েজ থেরাপি শিশুদের কথা বলতে বিলম্ব, ভাষাগত সমস্যা, অস্পষ্ট উচ্চারণ, সীমিত শব্দভাণ্ডার, বুঝতে অসুবিধা এবং কার্যকর যোগাযোগ দক্ষতা উন্নয়নে সহায়তা করে।",
    link: "services.html",
    linkEn: "View Therapy Details",
    linkBn: "থেরাপির বিস্তারিত দেখুন"
  },

  {
    intent: "occupationalTherapy",
    priority: 9,
    keys: [
      "occupational therapy", "occupational", "fine motor",
      "gross motor", "motor skill", "handwriting", "self care",
      "daily living", "coordination", "ot therapy",
      "অকুপেশনাল থেরাপি", "ফাইন মোটর", "গ্রস মোটর",
      "মোটর দক্ষতা", "হাতের কাজ", "লেখার সমস্যা",
      "নিজের কাজ", "সমন্বয়"
    ],
    en: "Occupational Therapy supports fine and gross motor development, coordination, attention, handwriting readiness, self-care skills, independence, and participation in everyday activities.",
    bn: "অকুপেশনাল থেরাপি শিশুর সূক্ষ্ম ও বৃহৎ মোটর দক্ষতা, শারীরিক সমন্বয়, মনোযোগ, লেখার প্রস্তুতি, আত্মপরিচর্যা, স্বনির্ভরতা এবং দৈনন্দিন কাজে অংশগ্রহণের সক্ষমতা উন্নয়নে সহায়তা করে।",
    link: "services.html",
    linkEn: "View Therapy Details",
    linkBn: "থেরাপির বিস্তারিত দেখুন"
  },

  {
    intent: "sensory",
    priority: 9,
    keys: [
      "sensory", "sensory issue", "sensory support",
      "sound sensitivity", "touch sensitivity", "light sensitivity",
      "texture", "movement", "sensory processing",
      "সেন্সরি", "শব্দে সমস্যা", "স্পর্শে সমস্যা",
      "আলোতে সমস্যা", "টেক্সচার", "সেন্সরি সমস্যা"
    ],
    en: "Sensory Support helps children respond more effectively to sound, touch, movement, light, texture, and other sensory experiences. Support is planned according to each child’s individual sensory profile.",
    bn: "সেন্সরি সাপোর্ট শিশুকে শব্দ, স্পর্শ, নড়াচড়া, আলো, টেক্সচার এবং অন্যান্য সংবেদনশীল অভিজ্ঞতার সঙ্গে কার্যকরভাবে মানিয়ে নিতে সহায়তা করে। প্রতিটি শিশুর স্বতন্ত্র সেন্সরি প্রোফাইল অনুযায়ী সহায়তা পরিকল্পনা করা হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "developmentalTherapy",
    priority: 8,
    keys: [
      "developmental therapy", "development delay",
      "developmental delay", "milestone", "cognitive development",
      "child development", "ডেভেলপমেন্টাল থেরাপি",
      "বিকাশে দেরি", "বিকাশগত সমস্যা", "মাইলস্টোন",
      "শিশুর বিকাশ"
    ],
    en: "Developmental Therapy uses structured and play-based activities to support cognitive, communication, motor, social, emotional, and adaptive development.",
    bn: "ডেভেলপমেন্টাল থেরাপিতে পরিকল্পিত ও খেলাভিত্তিক কার্যক্রমের মাধ্যমে শিশুর জ্ঞানীয়, যোগাযোগ, মোটর, সামাজিক, আবেগীয় এবং অভিযোজনমূলক বিকাশে সহায়তা করা হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "ecdPreschool",
    priority: 8,
    keys: [
      "ecd", "pre school", "preschool", "pre-schooling",
      "early childhood", "play class", "nursery preparation",
      "ইসিডি", "প্রি স্কুল", "প্রি-স্কুলিং", "প্রি স্কুলিং",
      "প্লে ক্লাস", "স্কুলের প্রস্তুতি"
    ],
    en: "Our ECD and Pre-Schooling programme supports children aged five years or below through age-appropriate learning, communication, motor, social, emotional, and classroom-readiness activities.",
    bn: "আমাদের ECD ও প্রি-স্কুলিং কার্যক্রমে পাঁচ বছর বা তার কম বয়সী শিশুদের জন্য বয়সোপযোগী শিক্ষা, যোগাযোগ, মোটর, সামাজিক, আবেগীয় এবং শ্রেণিকক্ষের প্রস্তুতিমূলক কার্যক্রম পরিচালনা করা হয়।",
    link: "services.html",
    linkEn: "View Programme Details",
    linkBn: "প্রোগ্রামের বিস্তারিত দেখুন"
  },

  {
    intent: "dayCare",
    priority: 8,
    keys: [
      "day care", "daycare", "day-care", "child care",
      "full day care", "ডে কেয়ার", "ডে-কেয়ার",
      "ডে কেয়ার", "শিশু যত্ন"
    ],
    en: "Our Day Care welcomes both children with additional needs and typically developing children. We provide safe supervision, developmental activities, play-based learning, social interaction, and daily care.",
    bn: "আমাদের ডে কেয়ারে বিশেষ চাহিদাসম্পন্ন এবং সাধারণ বিকাশধারার উভয় শিশুকে সেবা প্রদান করা হয়। এখানে নিরাপদ তত্ত্বাবধান, বিকাশমূলক কার্যক্রম, খেলাভিত্তিক শিক্ষা, সামাজিক মিথস্ক্রিয়া এবং দৈনন্দিন যত্ন নিশ্চিত করা হয়।",
    link: "services.html",
    linkEn: "View Day Care Details",
    linkBn: "ডে কেয়ারের বিস্তারিত দেখুন"
  },

  {
    intent: "behaviour",
    priority: 9,
    keys: [
      "behaviour", "behavior", "behavioural", "behavioral",
      "hyperactive", "hyperactivity", "tantrum", "aggressive",
      "hitting", "biting", "pinching", "challenging behaviour",
      "আচরণ", "হাইপার", "হাইপারঅ্যাকটিভ", "রাগ",
      "মারে", "কামড় দেয়", "চিমটি কাটে", "জেদ",
      "আচরণগত সমস্যা"
    ],
    en: "Behavioural Support focuses on understanding the reasons behind a child’s behaviour, building positive skills, reducing challenging behaviour, improving emotional regulation, and increasing functional independence.",
    bn: "আচরণগত সহায়তায় শিশুর আচরণের কারণ বোঝা, ইতিবাচক দক্ষতা তৈরি, চ্যালেঞ্জিং আচরণ কমানো, আবেগ নিয়ন্ত্রণ এবং কার্যকর স্বনির্ভরতা বৃদ্ধির ওপর গুরুত্ব দেওয়া হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "parentGuidance",
    priority: 7,
    keys: [
      "parent guidance", "parent counselling", "parent counseling",
      "home programme", "home program", "parents support",
      "অভিভাবক নির্দেশনা", "অভিভাবক পরামর্শ",
      "বাসায় কী করব", "বাড়িতে কী করব", "হোম প্রোগ্রাম"
    ],
    en: "Our professionals guide parents with practical strategies to support communication, learning, behaviour, self-care, and developmental progress at home.",
    bn: "আমাদের পেশাজীবীরা ঘরে শিশুর যোগাযোগ, শেখা, আচরণ, আত্মপরিচর্যা এবং বিকাশগত অগ্রগতিতে সহায়তার জন্য অভিভাবকদের ব্যবহারিক কৌশল ও নির্দেশনা প্রদান করেন।",
    link: "resources.html",
    linkEn: "View Parent Resources",
    linkBn: "অভিভাবক সহায়িকা দেখুন"
  },

  {
    intent: "schoolReadiness",
    priority: 8,
    keys: [
      "school readiness", "ready for school", "classroom readiness",
      "school preparation", "স্কুল রেডিনেস", "স্কুলের জন্য প্রস্তুতি",
      "ক্লাসের প্রস্তুতি", "স্কুলে ভর্তি প্রস্তুতি"
    ],
    en: "School Readiness develops attention, communication, classroom behaviour, early academic skills, social interaction, following instructions, and self-help abilities needed for school participation.",
    bn: "স্কুল রেডিনেস কার্যক্রমে বিদ্যালয়ে অংশগ্রহণের জন্য প্রয়োজনীয় মনোযোগ, যোগাযোগ, শ্রেণিকক্ষের আচরণ, প্রাথমিক একাডেমিক দক্ষতা, সামাজিক যোগাযোগ, নির্দেশনা অনুসরণ এবং আত্মসহায়ক দক্ষতা গড়ে তোলা হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "socialSkills",
    priority: 7,
    keys: [
      "social skill", "social skills", "interaction",
      "sharing", "turn taking", "friendship", "eye contact",
      "সামাজিক দক্ষতা", "মেলামেশা", "শেয়ারিং",
      "পালা করে", "বন্ধুত্ব", "চোখে চোখ রাখা"
    ],
    en: "Social Skills Development supports interaction, turn-taking, sharing, cooperation, emotional understanding, friendship skills, and appropriate behaviour in social situations.",
    bn: "সামাজিক দক্ষতা বিকাশ কার্যক্রমে পারস্পরিক যোগাযোগ, পালাক্রমে কাজ করা, ভাগাভাগি, সহযোগিতা, আবেগ বোঝা, বন্ধুত্ব তৈরি এবং সামাজিক পরিস্থিতিতে উপযুক্ত আচরণ শেখানো হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "vocational",
    priority: 7,
    keys: [
      "vocational", "vocational activity", "work skill",
      "life skill", "independent living", "job skill",
      "ভোকেশনাল", "কর্মমুখী", "জীবন দক্ষতা",
      "কাজ শেখানো", "স্বনির্ভরতা"
    ],
    en: "Vocational Activities provide practical, skill-based learning to develop independence, responsibility, creativity, work habits, functional abilities, and future vocational readiness.",
    bn: "ভোকেশনাল কার্যক্রমে ব্যবহারিক ও দক্ষতাভিত্তিক শিক্ষার মাধ্যমে আত্মনির্ভরতা, দায়িত্ববোধ, সৃজনশীলতা, কাজের অভ্যাস, কার্যকর দক্ষতা এবং ভবিষ্যৎ কর্মমুখী প্রস্তুতি গড়ে তোলা হয়।",
    link: "services.html",
    linkEn: "Learn More",
    linkBn: "বিস্তারিত জানুন"
  },

  {
    intent: "age",
    priority: 7,
    keys: [
      "age", "age limit", "how old", "child age",
      "what age", "বয়স", "বয়স", "কত বছরের",
      "বয়স সীমা", "কোন বয়স"
    ],
    en: "The appropriate programme depends on your child’s age, developmental level, assessment findings, and individual needs. Please share your child’s age so we can guide you more accurately.",
    bn: "উপযুক্ত প্রোগ্রাম শিশুর বয়স, বিকাশের স্তর, এসেসমেন্টের ফলাফল এবং ব্যক্তিগত প্রয়োজনের ওপর নির্ভর করে। সঠিক নির্দেশনার জন্য শিশুর বয়স জানাতে পারেন।"
  },

  {
    intent: "contact",
    priority: 8,
    keys: [
      "contact", "address", "location", "phone", "mobile",
      "call", "email", "map", "where are you", "how to reach",
      "যোগাযোগ", "ঠিকানা", "লোকেশন", "ফোন", "মোবাইল",
      "ইমেইল", "ম্যাপ", "কোথায়", "কোথায়"
    ],
    en: "You can call us at 01706027127 or email creativedevelopmentalschool@gmail.com. We are located at House 36, Road Shekhertek-12, Adabor, Dhaka-1207.",
    bn: "আপনি ০১৭০৬০২৭১২৭ নম্বরে কল করতে পারেন অথবা creativedevelopmentalschool@gmail.com-এ ইমেইল করতে পারেন। আমাদের ঠিকানা: হাউস ৩৬, রোড শেখেরটেক-১২, আদাবর, ঢাকা-১২০৭।",
    link: "contact.html",
    linkEn: "View Contact Details",
    linkBn: "যোগাযোগের বিস্তারিত দেখুন"
  },

  {
    intent: "thanks",
    priority: 8,
    keys: [
      "thank", "thanks", "thank you", "okay thanks",
      "ধন্যবাদ", "থ্যাংকস", "অনেক ধন্যবাদ"
    ],
    en: "You’re welcome! Please feel free to ask about our services, assessment, admission, fees, or visiting hours.",
    bn: "স্বাগতম! আমাদের সেবা, এসেসমেন্ট, ভর্তি, ফি অথবা খোলার সময় সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।"
  },

  {
    intent: "goodbye",
    priority: 7,
    keys: [
      "bye", "goodbye", "allah hafiz", "allah hafez",
      "see you", "বিদায়", "বিদায়", "আল্লাহ হাফেজ"
    ],
    en: "Thank you for contacting Creative Impact for Children Foundation. Take care!",
    bn: "ক্রিয়েটিভ ইমপ্যাক্ট ফর চিলড্রেন ফাউন্ডেশনের সঙ্গে যোগাযোগ করার জন্য ধন্যবাদ। ভালো থাকবেন!"
  }
];
  var FALLBACK = {
    en: "Thanks for your message! This is a demo chat, so I can only give simple sample answers. For a real reply, please call 01706027127 or use the Contact page.",
    bn: "আপনার বার্তার জন্য ধন্যবাদ! এটি একটি ডেমো চ্যাট, তাই আমি শুধু সহজ নমুনা উত্তর দিতে পারি। প্রকৃত উত্তরের জন্য ০১৭০৬০২৭১২৭ নম্বরে কল করুন অথবা যোগাযোগ পাতা ব্যবহার করুন।" };

  function findReply(userText){
    var t = userText.toLowerCase();
    for(var i=0;i<REPLIES.length;i++){
      var r = REPLIES[i];
      for(var j=0;j<r.keys.length;j++){
        if(t.indexOf(r.keys[j]) !== -1) return r;
      }
    }
    return null;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var text = input.value.trim();
    if(!text) return;
    addBubble(text, 'user');
    input.value = '';

    var match = findReply(text);
    var lang = currentLang();
    var replyText = match ? (lang === 'bn' ? match.bn : match.en) : (lang === 'bn' ? FALLBACK.bn : FALLBACK.en);

    showTyping();
    setTimeout(function(){
      removeTyping();
      addBubble(replyText, 'bot');
    }, 650 + Math.random()*500);
  });
})();
