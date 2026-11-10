/**
 * Visteria InsightPulse AI — Enterprise Multilingual & Localization Engine (I18n)
 * Provides dynamic language switching, RTL layout management, company-specific language filtering,
 * full interface translation, and question translation with English fallback.
 */

(function (window, document) {
    'use strict';

    // 1. Supported System Languages Registry
    const SYSTEM_LANGUAGES = [
        { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', flag: '🇮🇳' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
        { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
        { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵' }
    ];

    // 2. Comprehensive Enterprise UI Translations Catalog
    const TRANSLATIONS = {
        en: {
            // Header & Navigation
            'brand.company': 'VISTERIA CONSULTING SERVICES PRIVATE LIMITED',
            'brand.tagline': 'Vision Changes Everything.',
            'nav.about_survey': 'About Survey',
            'nav.admin_portal': 'Admin Portal',
            'nav.enterprise_secured': 'ENTERPRISE SECURED',
            'nav.survey_active': 'SURVEY PORTAL ACTIVE',
            'nav.logout': 'Sign Out',
            'nav.back_to_portal': 'Back to Portal',

            // Auth & Landing
            'auth.title_signin': 'Sign In',
            'auth.subtitle_signin': 'Access your survey dashboard',
            'auth.title_signup': 'Create Account',
            'auth.subtitle_signup': 'Register your employee profile with your organization.',
            'auth.tab_signin': 'Sign In',
            'auth.tab_signup': 'Register',
            'auth.tab_forgot': 'Forgot Password',
            'auth.email': 'EMAIL OR EMPLOYEE ID',
            'auth.email_placeholder': 'Enter your email or employee ID',
            'auth.password': 'PASSWORD',
            'auth.password_placeholder': 'Enter your password',
            'auth.fullname': 'Full Name',
            'auth.fullname_placeholder': 'Enter your full name',
            'auth.employee_id': 'Employee ID / Code',
            'auth.employee_id_placeholder': 'e.g. EMP1024',
            'auth.department': 'Department',
            'auth.department_placeholder': 'Select Department',
            'auth.company': 'Organization / Company',
            'auth.company_placeholder': 'Select Your Organization',
            'auth.phone': 'Phone Number',
            'auth.phone_placeholder': 'e.g. +1 555-0199',
            'auth.remember_me': 'Remember me',
            'auth.forgot_password_link': 'Forgot Password?',
            'auth.btn_signin': 'Sign In',
            'auth.btn_signup': 'Create Employee Account',
            'auth.btn_send_reset': 'Send Reset Link',
            'auth.btn_reset': 'Update Password & Sign In',
            'auth.btn_suggest': 'Suggest',
            'auth.back_to_signin': 'Back to Sign In',
            'auth.already_account': 'Already registered?',
            'auth.no_account': "Don't have an account?",
            'auth.register_here': 'Register here →',
            'auth.signin_here': 'Sign in here →',
            'auth.confidential_badge': '100% Confidential & Secure Feedback',
            'brand.card1_title': 'Your Voice, Your Privacy',
            'brand.card1_desc': 'Share honest feedback in a secure environment where your workplace concerns can be heard.',
            'brand.card2_title': 'Insights That Drive Change',
            'brand.card2_desc': 'Turn employee feedback into clear insights that help leaders make better decisions and improve the workplace.',
            'brand.card3_title': 'A Better Workplace, Every Day',
            'brand.card3_desc': 'Help build a healthier, more supportive workplace where people and teams can grow together.',
            'brand.product_title': 'People & Process Excellence',
            'brand.desc': 'Empowering organizational growth through authentic employee feedback, intelligent operational synthesis, and leadership excellence.',
            'auth.email_label': 'Email Address',
            'auth.password_label': 'Password',
            'auth.new_to_visteria': 'New to Visteria Survey AI?',
            'auth.signup_action': 'Sign Up',

            // Welcome & Dashboard
            'welcome.badge': 'PEOPLE & PROCESS EXCELLENCE',
            'welcome.hero_title_1': 'PEOPLE & PROCESS',
            'welcome.hero_title_2': 'EXCELLENCE',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria Consulting Services Private Limited welcomes you to your confidential workplace survey. Your honest feedback guides meaningful organizational improvements.',
            'welcome.tagline': 'Vision Changes Everything. • Empowering People, Elevating Organizations.',
            'welcome.org_conducting': 'ORGANIZATION CONDUCTING SURVEY',
            'welcome.official_program': 'Official Organization Survey Program',
            'welcome.survey_categories': 'Survey Categories',
            'welcome.categories_subtitle': 'Select any assigned category to complete your survey assessment.',
            'welcome.anonymous_notice': 'Your responses are encrypted, aggregated, and strictly anonymous.',

            // Profile Fields
            'profile.emp_name': 'Employee Name',
            'profile.emp_id': 'Employee ID',
            'profile.department': 'Department',
            'profile.survey_status': 'Survey Status',

            // Status Values
            'status.not_started': 'Not Started',
            'status.in_progress': 'In Progress',
            'status.completed': 'Completed',
            'status.assigned': 'Assigned',

            // Actions & Buttons
            'action.start_survey': 'Start Survey',
            'action.resume_survey': 'Resume Survey',
            'action.view_summary': 'View Summary',
            'action.all_completed': '✓ All Surveys Completed',
            'action.previous': 'Previous',
            'action.next': 'Next Question',
            'action.save_exit': 'Save & Exit',
            'action.submit_survey': 'Submit Survey',
            'action.cancel': 'Cancel',
            'action.confirm_submit': 'Yes, Submit Final Answers',
            'action.close': 'Close',

            // Survey Questions & Assessment Flow
            'survey.header_title': 'PEOPLE & PROCESS EXCELLENCE',
            'survey.confidential_badge': 'Confidential Workplace Assessment',
            'survey.question_counter': 'Question {current} of {total}',
            'survey.completion_pct': '{percent}% Completed',
            'survey.assessment_badge': 'OPERATIONAL ASSESSMENT',
            'survey.hint_default': 'Reflect on your personal day-to-day workplace experience.',
            'survey.validation_required': 'Please select an answer to continue to the next question.',
            'survey.confirm_modal_title': 'Submit Survey Assessment?',
            'survey.confirm_modal_desc': 'Are you sure you want to finalize your submission? Once submitted, your answers cannot be modified and will be compiled into the organization report.',
            'survey.progress_saved_toast': 'Progress saved successfully.',

            // Standard 5-point Likert Scale
            'likert.strongly_disagree': 'Strongly Disagree',
            'likert.disagree': 'Disagree',
            'likert.neutral': 'Neutral',
            'likert.agree': 'Agree',
            'likert.strongly_agree': 'Strongly Agree',

            // Feedback Page
            'feedback.title': 'Confidential Open Feedback',
            'feedback.subtitle': 'Share your observations, suggestions, or ideas to help improve the workplace culture.',
            'feedback.textarea_placeholder': 'Share your detailed feedback, ideas, or observations (Optional)...',
            'feedback.char_counter': '{count} characters (Optional)',
            'feedback.submit_btn': 'Submit Survey & Feedback',
            'feedback.anonymity_reminder': 'Your feedback is entirely anonymous and protected by enterprise security.',

            // Confirmation Page
            'confirmation.badge': 'SURVEY COMPLETED',
            'confirmation.title': 'Thank You for Your Feedback!',
            'confirmation.subtitle': 'Your responses have been securely recorded and encrypted.',
            'confirmation.desc': 'Your honest insights empower leadership to build a more supportive, collaborative, and people-first workplace.',
            'confirmation.reference_id': 'Reference ID',
            'confirmation.btn_home': 'Back to Employee Portal',

            // Eagle AI Assistant
            'eagle.title': 'Eagle AI Assistant',
            'eagle.subtitle': 'Confidential Survey Companion',
            'eagle.placeholder': 'Ask Eagle about this survey or questions...',
            'eagle.send': 'Send',
            'eagle.greeting': "Hello! I'm Eagle, your confidential survey AI guide. How can I assist you with this assessment?",
            'eagle.chip_confidential': 'Is my feedback confidential?',
            'eagle.chip_time': 'How long does this survey take?',
            'eagle.chip_why': 'Why is this survey important?',

            // Language Selector
            'lang.select_label': 'Language',
            'lang.switch_prompt': 'Select Language'
        },

        ar: {
            // Header & Navigation
            'brand.company': 'فيستيريا لخدمات الاستشارات ش.ذ.م.م',
            'brand.tagline': 'الرؤية تغيّر كل شيء.',
            'nav.about_survey': 'حول الاستبيان',
            'nav.admin_portal': 'بوابة الإدارة',
            'nav.enterprise_secured': 'مؤمّن للشركات',
            'nav.survey_active': 'بوابة الاستبيان نشطة',
            'nav.logout': 'تسجيل الخروج',
            'nav.back_to_portal': 'العودة للبوابة',

            // Auth & Landing
            'auth.title_signin': 'مرحباً بعودتك',
            'auth.subtitle_signin': 'سجّل الدخول للوصول إلى استبيان بيئة العمل السري.',
            'auth.title_signup': 'إنشاء حساب جديد',
            'auth.subtitle_signup': 'سجّل ملف الموظف الخاص بك مع مؤسستك.',
            'auth.tab_signin': 'تسجيل الدخول',
            'auth.tab_signup': 'تسجيل جديد',
            'auth.tab_forgot': 'نسيت كلمة المرور',
            'auth.tab_reset': 'إعادة تعيين كلمة المرور',
            'auth.email': 'البريد الإلكتروني',
            'auth.email_placeholder': 'أدخل بريدك الإلكتروني المؤسسي',
            'auth.password': 'كلمة المرور',
            'auth.password_placeholder': 'أدخل كلمة المرور الخاصة بك',
            'auth.fullname': 'الاسم الكامل',
            'auth.fullname_placeholder': 'أدخل اسمك الكامل',
            'auth.employee_id': 'الرقم الوظيفي',
            'auth.employee_id_placeholder': 'مثال: EMP1024',
            'auth.department': 'القسم / الإدارة',
            'auth.department_placeholder': 'اختر القسم',
            'auth.company': 'الشركة / المؤسسة',
            'auth.company_placeholder': 'اختر مؤسستك',
            'auth.phone': 'رقم الهاتف',
            'auth.phone_placeholder': 'مثال: 0501234567',
            'auth.remember_me': 'تذكر هذا الجهاز',
            'auth.forgot_password_link': 'نسيت كلمة المرور؟',
            'auth.btn_signin': 'الدخول إلى الاستبيان',
            'auth.btn_signup': 'إنشاء حساب موظف',
            'auth.btn_send_reset': 'إرسال رابط إعادة التعيين',
            'auth.btn_reset': 'تحديث كلمة المرور والدخول',
            'auth.btn_suggest': 'اقتراح',
            'auth.back_to_signin': 'العودة إلى تسجيل الدخول',
            'auth.already_account': 'لديك حساب بالفعل؟',
            'auth.no_account': 'ليس لديك حساب بعد؟',
            'auth.register_here': 'سجّل هنا ←',
            'auth.signin_here': 'سجّل الدخول هنا ←',
            'auth.confidential_badge': 'ملاحظات سرية وآمنة بنسبة 100%',

            // Welcome & Dashboard
            'welcome.badge': 'التميز في الأفراد والعمليات',
            'welcome.hero_title_1': 'التميز في الأفراد',
            'welcome.hero_title_2': 'والعمليات',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'ترحب بكم شركة فيستيريا لخدمات الاستشارات للمشاركة في استبيان بيئة العمل السري. آراؤكم الصادقة تصنع التغيير الإيجابي.',
            'welcome.tagline': 'الرؤية تغيّر كل شيء. • تمكين الكفاءات، والارتقاء بالمؤسسات.',
            'welcome.org_conducting': 'المؤسسة القائمة على الاستبيان',
            'welcome.official_program': 'البرنامج الرسمي للاستبيان المؤسسي',
            'welcome.survey_categories': 'أقسام الاستبيان',
            'welcome.categories_subtitle': 'اختر أي فئة مخصصة لإكمال تقييم الاستبيان الخاص بك.',
            'welcome.anonymous_notice': 'إجاباتك مشفرة ومجمعة وسرية بالكامل دون الكشف عن الهوية.',

            // Profile Fields
            'profile.emp_name': 'اسم الموظف',
            'profile.emp_id': 'الرقم الوظيفي',
            'profile.department': 'القسم',
            'profile.survey_status': 'حالة الاستبيان',

            // Status Values
            'status.not_started': 'لم يبدأ',
            'status.in_progress': 'قيد التقدم',
            'status.completed': 'مكتمل',
            'status.assigned': 'مُعيّن',

            // Actions & Buttons
            'action.start_survey': 'بدء الاستبيان',
            'action.resume_survey': 'متابعة الاستبيان',
            'action.view_summary': 'عرض الملخص',
            'action.all_completed': '✓ اكتملت جميع الاستبيانات',
            'action.previous': 'السابق',
            'action.next': 'السؤال التالي',
            'action.save_exit': 'حفظ وخروج',
            'action.submit_survey': 'إرسال الاستبيان',
            'action.cancel': 'إلغاء',
            'action.confirm_submit': 'نعم، إرسال الإجابات النهائية',
            'action.close': 'إغلاق',

            // Survey Questions & Assessment Flow
            'survey.header_title': 'التميز في الأفراد والعمليات',
            'survey.confidential_badge': 'تقييم سري ومحمي لبيئة العمل',
            'survey.question_counter': 'السؤال {current} من {total}',
            'survey.completion_pct': 'تم إنجاز {percent}%',
            'survey.assessment_badge': 'تقييم تشغيلي ومؤسسي',
            'survey.hint_default': 'شاركنا تجربتك اليومية الحقيقية في بيئة العمل.',
            'survey.validation_required': 'يرجى اختيار إجابة للمتابعة إلى السؤال التالي.',
            'survey.confirm_modal_title': 'هل تريد إرسال تقييم الاستبيان؟',
            'survey.confirm_modal_desc': 'هل أنت متأكد من رغبتك في إنهاء التقديم؟ بمجرد الإرسال، لا يمكن تعديل الإجابات وسيتم تضمينها في التقرير التحليلي للمؤسسة.',
            'survey.progress_saved_toast': 'تم حفظ التقدم بنجاح.',

            // Standard 5-point Likert Scale
            'likert.strongly_disagree': 'غير موافق بشدة',
            'likert.disagree': 'غير موافق',
            'likert.neutral': 'محايد',
            'likert.agree': 'موافق',
            'likert.strongly_agree': 'موافق بشدة',

            // Feedback Page
            'feedback.title': 'ملاحظات وآراء سرية مفتوحة',
            'feedback.subtitle': 'شارك ملاحظاتك واقتراحاتك وأفكارك للمساهمة في تطوير بيئة العمل.',
            'feedback.textarea_placeholder': 'شاركنا ملاحظاتك أو أفكارك أو مقترحاتك بالتفصيل (اختياري)...',
            'feedback.char_counter': '{count} حرف (اختياري)',
            'feedback.submit_btn': 'إرسال الاستبيان والملاحظات',
            'feedback.anonymity_reminder': 'ملاحظاتك سرية تماماً ومحمية بأعلى معايير الأمان المؤسسي.',

            // Confirmation Page
            'confirmation.badge': 'تم إكمال الاستبيان بنجاح',
            'confirmation.title': 'شكراً جزيلاً على مشاركتك القيمة!',
            'confirmation.subtitle': 'تم تسجيل إجاباتك وتشفيرها بنجاح وأمان تام.',
            'confirmation.desc': 'رأيك الصادق يساعد الإدارة في بناء بيئة عمل داعمة ومتعاونة تضع الإنسان دائماً في المقام الأول.',
            'confirmation.reference_id': 'الرقم المرجعي',
            'confirmation.btn_home': 'العودة إلى بوابة الموظف',

            // Eagle AI Assistant
            'eagle.title': 'المساعد الذكي إيجل',
            'eagle.subtitle': 'دليلك الذكي للاستبيان السري',
            'eagle.placeholder': 'اسأل إيجل عن هذا الاستبيان أو الأسئلة...',
            'eagle.send': 'إرسال',
            'eagle.greeting': 'مرحباً! أنا إيجل، دليلك الذكي للاستبيان. كيف يمكنني مساعدتك في هذا التقييم؟',
            'eagle.chip_confidential': 'هل إجاباتي سرية حقاً؟',
            'eagle.chip_time': 'كم يستغرق الاستبيان من الوقت؟',
            'eagle.chip_why': 'ما أهمية هذا الاستبيان؟',

            // Language Selector
            'lang.select_label': 'اللغة',
            'lang.switch_prompt': 'اختر اللغة'
        },

        ta: {
            'brand.company': 'விஸ்டீரியா கன்சல்டிங் சர்வீசஸ் பிரைவேட் லிமிடெட்',
            'brand.tagline': 'பார்வை அனைத்தையும் மாற்றுகிறது.',
            'nav.about_survey': 'கணிப்பு பற்றி',
            'nav.admin_portal': 'நிர்வாக தளம்',
            'nav.enterprise_secured': 'நிறுவன பாதுகாப்புடன்',
            'nav.survey_active': 'கணிப்பு தளம் செயலில் உள்ளது',
            'nav.logout': 'வெளியேறு',
            'nav.back_to_portal': 'முகப்பிற்கு செல்க',

            'auth.title_signin': 'மீண்டும் வருக',
            'auth.subtitle_signin': 'உங்கள் ரகசிய பணியிட கணிப்பில் பங்கேற்க உள்நுழையவும்.',
            'auth.title_signup': 'புதிய கணக்கு உருவாக்கு',
            'auth.subtitle_signup': 'உங்கள் பணியாளர் சுயவிவரத்தை பதிவு செய்யவும்.',
            'auth.tab_signin': 'உள்நுழைவு',
            'auth.tab_signup': 'பதிவு செய்',
            'auth.tab_forgot': 'கடவுச்சொல் மறந்ததா',
            'auth.tab_reset': 'கடவுச்சொல் மாற்று',
            'auth.email': 'மின்னஞ்சல் முகவரி',
            'auth.email_placeholder': 'உங்கள் அலுவலக மின்னஞ்சலை உள்ளிடவும்',
            'auth.password': 'கடவுச்சொல்',
            'auth.password_placeholder': 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
            'auth.fullname': 'முழு பெயர்',
            'auth.fullname_placeholder': 'உங்கள் முழு பெயரை உள்ளிடவும்',
            'auth.employee_id': 'பணியாளர் எண்',
            'auth.employee_id_placeholder': 'எ.கா: EMP1024',
            'auth.department': 'துறை',
            'auth.department_placeholder': 'துறையை தேர்ந்தெடுக்கவும்',
            'auth.company': 'நிறுவனம்',
            'auth.company_placeholder': 'உங்கள் நிறுவனத்தை தேர்ந்தெடுக்கவும்',
            'auth.phone': 'தொலைபேசி எண்',
            'auth.phone_placeholder': 'எ.கா: +91 9876543210',
            'auth.remember_me': 'நினைவில் வைத்துக்கொள்',
            'auth.forgot_password_link': 'கடவுச்சொல் மறந்ததா?',
            'auth.btn_signin': 'கணிப்பில் உள்நுழைக',
            'auth.btn_signup': 'கணக்கை உருவாக்கு',
            'auth.btn_send_reset': 'இணைப்பு அனுப்புக',
            'auth.btn_reset': 'கடவுச்சொல் மாற்றி உள்நுழைக',
            'auth.btn_suggest': 'பரிந்துரை',
            'auth.back_to_signin': 'உள்நுழைவிற்கு செல்க',
            'auth.already_account': 'ஏற்கனவே கணக்கு உள்ளதா?',
            'auth.no_account': 'கணக்கு இல்லையா?',
            'auth.register_here': 'இங்கே பதிவு செய்க →',
            'auth.signin_here': 'இங்கே உள்நுழைக →',
            'auth.confidential_badge': '100% ரகசியமானது மற்றும் பாதுகாப்பானது',

            'welcome.badge': 'மனிதவளம் மற்றும் செயல்முறை சிறப்பு',
            'welcome.hero_title_1': 'மனிதவளம் மற்றும்',
            'welcome.hero_title_2': 'செயல்முறை சிறப்பு',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'விஸ்டீரியா நிறுவனம் உங்களை ரகசிய பணியிட கணிப்பிற்கு வரவேற்கிறது. உங்கள் உண்மையான கருத்துக்கள் நிறுவன முன்னேற்றத்திற்கு வழிவகுக்கும்.',
            'welcome.tagline': 'பார்வை அனைத்தையும் மாற்றுகிறது. • மனிதர்களை மேம்படுத்தி, அமைப்புகளை உயர்த்துகிறோம்.',
            'welcome.org_conducting': 'கணிப்பு நடத்தும் நிறுவனம்',
            'welcome.official_program': 'அதிகாரப்பூர்வ நிறுவன கணிப்பு திட்டம்',
            'welcome.survey_categories': 'கணிப்பு பிரிவுகள்',
            'welcome.categories_subtitle': 'உங்கள் கணிப்பை முடிக்க ஒதுக்கப்பட்ட பிரிவை தேர்ந்தெடுக்கவும்.',
            'welcome.anonymous_notice': 'உங்கள் பதில்கள் முழுமையாக குறியாக்கம் செய்யப்பட்டு, முற்றிலும் ரகசியமாக வைக்கப்படும்.',

            'profile.emp_name': 'பணியாளர் பெயர்',
            'profile.emp_id': 'பணியாளர் எண்',
            'profile.department': 'துறை',
            'profile.survey_status': 'கணிப்பு நிலை',

            'status.not_started': 'தொடங்கவில்லை',
            'status.in_progress': 'நடைபெறுகிறது',
            'status.completed': 'முடிவடைந்தது',
            'status.assigned': 'ஒதுக்கப்பட்டது',

            'action.start_survey': 'கணிப்பை தொடங்கு',
            'action.resume_survey': 'தொடர்ந்து மேற்கொள்',
            'action.view_summary': 'சுருக்கம் காண்க',
            'action.all_completed': '✓ அனைத்து கணிப்புகளும் முடிவடைந்தன',
            'action.previous': 'முந்தையது',
            'action.next': 'அடுத்த கேள்வி',
            'action.save_exit': 'சேமித்து வெளியேறு',
            'action.submit_survey': 'சமர்ப்பிக்கவும்',
            'action.cancel': 'ரத்து செய்',
            'action.confirm_submit': 'ஆம், சமர்ப்பிக்கவும்',
            'action.close': 'மூடு',

            'survey.header_title': 'மனிதவளம் மற்றும் செயல்முறை சிறப்பு',
            'survey.confidential_badge': 'ரகசிய மதிப்பீடு',
            'survey.question_counter': 'கேள்வி {current} / {total}',
            'survey.completion_pct': '{percent}% முடிந்தது',
            'survey.assessment_badge': 'செயல்பாட்டு மதிப்பீடு',
            'survey.hint_default': 'உங்கள் அன்றாட பணி அனுபவத்தை பிரதிபலிக்கவும்.',
            'survey.validation_required': 'அடுத்த கேள்விக்கு செல்ல பதிலை தேர்ந்தெடுக்கவும்.',
            'survey.confirm_modal_title': 'கணிப்பை சமர்ப்பிக்க விரும்புகிறீர்களா?',
            'survey.confirm_modal_desc': 'இறுதியாக சமர்ப்பிக்க உறுதி செய்கிறீர்களா? சமர்ப்பித்த பிறகு பதில்களை மாற்ற இயலாது.',
            'survey.progress_saved_toast': 'முன்னேற்றம் சேமிக்கப்பட்டது.',

            'likert.strongly_disagree': 'முற்றிலும் உடன்படவில்லை',
            'likert.disagree': 'உடன்படவில்லை',
            'likert.neutral': 'நடுநிலை',
            'likert.agree': 'உடன்படுகிறேன்',
            'likert.strongly_agree': 'முற்றிலும் உடன்படுகிறேன்',

            'feedback.title': 'ரகசிய கூடுதல் கருத்துக்கள்',
            'feedback.subtitle': 'பணியிடத்தை மேம்படுத்த உங்கள் மேலான ஆலோசனைகளை பகிர்ந்து கொள்ளுங்கள்.',
            'feedback.textarea_placeholder': 'உங்கள் கருத்துக்கள் அல்லது யோசனைகளை எழுதவும் (விருப்பத்தேர்வு)...',
            'feedback.char_counter': '{count} எழுத்துக்கள் (விருப்பத்தேர்வு)',
            'feedback.submit_btn': 'முழு கணிப்பை சமர்ப்பிக்கவும்',
            'feedback.anonymity_reminder': 'உங்கள் கருத்துக்கள் முற்றிலும் ரகசியமாக வைக்கப்படும்.',

            'confirmation.badge': 'கணிப்பு முடிந்தது',
            'confirmation.title': 'உங்கள் கருத்திற்கு மிக்க நன்றி!',
            'confirmation.subtitle': 'உங்கள் பதில்கள் பாதுகாப்பாக பதிவு செய்யப்பட்டுள்ளன.',
            'confirmation.desc': 'உங்கள் உண்மையான கருத்துக்கள் ஒரு சிறந்த பணியிடத்தை உருவாக்க உதவும்.',
            'confirmation.reference_id': 'குறிப்பு எண்',
            'confirmation.btn_home': 'பணியாளர் தளத்திற்கு செல்க',

            'eagle.title': 'ஈகிள் AI உதவியாளர்',
            'eagle.subtitle': 'ரகசிய கணிப்பு வழிகாட்டி',
            'eagle.placeholder': 'கேள்விகளை கேட்கவும்...',
            'eagle.send': 'அனுப்பு',
            'eagle.greeting': 'வணக்கம்! நான் உங்கள் ஈகிள் AI உதவியாளர். நான் எவ்வாறு உதவ முடியும்?',
            'eagle.chip_confidential': 'என் கருத்துக்கள் ரகசியமானவையா?',
            'eagle.chip_time': 'இதற்கு எவ்வளவு நேரம் ஆகும்?',
            'eagle.chip_why': 'இந்த கணிப்பின் நோக்கம் என்ன?',

            'lang.select_label': 'மொழி',
            'lang.switch_prompt': 'மொழியை தேர்வு செய்க'
        },

        hi: {
            'brand.company': 'विस्टीरिया कंसल्टिंग सर्विसेज प्राइवेट लिमिटेड',
            'brand.tagline': 'दृष्टिकोण सब कुछ बदल देता है।',
            'nav.about_survey': 'सर्वेक्षण के बारे में',
            'nav.admin_portal': 'व्यवस्थापक पोर्टल',
            'nav.enterprise_secured': 'एंटरप्राइज सुरक्षित',
            'nav.survey_active': 'सर्वेक्षण पोर्टल सक्रिय',
            'nav.logout': 'लॉग आउट',
            'nav.back_to_portal': 'पोर्टल पर लौटें',

            'auth.title_signin': 'वापसी पर स्वागत है',
            'auth.subtitle_signin': 'अपने गोपनीय कार्यस्थल सर्वेक्षण में भाग लेने के लिए साइन इन करें।',
            'auth.title_signup': 'नया खाता बनाएं',
            'auth.subtitle_signup': 'अपने संगठन के साथ अपनी प्रोफ़ाइल पंजीकृत करें।',
            'auth.tab_signin': 'साइन इन',
            'auth.tab_signup': 'पंजीकरण',
            'auth.tab_forgot': 'पासवर्ड भूल गए',
            'auth.tab_reset': 'पासवर्ड रीसेट',
            'auth.email': 'ईमेल पता',
            'auth.email_placeholder': 'अपना आधिकारिक कार्य ईमेल दर्ज करें',
            'auth.password': 'पासवर्ड',
            'auth.password_placeholder': 'अपना सुरक्षित पासवर्ड दर्ज करें',
            'auth.fullname': 'पूरा नाम',
            'auth.fullname_placeholder': 'अपना पूरा नाम दर्ज करें',
            'auth.employee_id': 'कर्मचारी आईडी',
            'auth.employee_id_placeholder': 'उदा. EMP1024',
            'auth.department': 'विभाग',
            'auth.department_placeholder': 'विभाग चुनें',
            'auth.company': 'संगठन / कंपनी',
            'auth.company_placeholder': 'अपनी कंपनी चुनें',
            'auth.phone': 'फोन नंबर',
            'auth.phone_placeholder': 'उदा. +91 9876543210',
            'auth.remember_me': 'मुझे याद रखें',
            'auth.forgot_password_link': 'पासवर्ड भूल गए?',
            'auth.btn_signin': 'सर्वेक्षण में प्रवेश करें',
            'auth.btn_signup': 'खाता बनाएं',
            'auth.btn_send_reset': 'रीसेट लिंक भेजें',
            'auth.btn_reset': 'पासवर्ड अपडेट कर साइन इन करें',
            'auth.btn_suggest': 'सुझाव दें',
            'auth.back_to_signin': 'साइन इन पर वापस जाएं',
            'auth.already_account': 'पहले से पंजीकृत हैं?',
            'auth.no_account': 'खाता नहीं है?',
            'auth.register_here': 'यहाँ पंजीकरण करें →',
            'auth.signin_here': 'यहाँ साइन इन करें →',
            'auth.confidential_badge': '100% गोपनीय और सुरक्षित प्रतिक्रिया',

            'welcome.badge': 'व्यक्ति एवं प्रक्रिया उत्कृष्टता',
            'welcome.hero_title_1': 'व्यक्ति एवं',
            'welcome.hero_title_2': 'प्रक्रिया उत्कृष्टता',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'विस्टीरिया कंसल्टिंग सर्विसेज में आपका स्वागत है। आपकी सच्ची प्रतिक्रिया कार्यस्थल में सकारात्मक सुधार लाती है।',
            'welcome.tagline': 'दृष्टिकोण सब कुछ बदल देता है। • लोगों का सशक्तिकरण, संगठनों का उत्थान।',
            'welcome.org_conducting': 'सर्वेक्षण आयोजित करने वाला संगठन',
            'welcome.official_program': 'आधिकारिक संगठनात्मक सर्वेक्षण कार्यक्रम',
            'welcome.survey_categories': 'सर्वेक्षण श्रेणियां',
            'welcome.categories_subtitle': 'अपना मूल्यांकन पूरा करने के लिए निर्दिष्ट श्रेणी चुनें।',
            'welcome.anonymous_notice': 'आपके उत्तर एन्क्रिप्टेड और पूरी तरह से अनाम हैं।',

            'profile.emp_name': 'कर्मचारी का नाम',
            'profile.emp_id': 'कर्मचारी आईडी',
            'profile.department': 'विभाग',
            'profile.survey_status': 'सर्वेक्षण स्थिति',

            'status.not_started': 'शुरू नहीं हुआ',
            'status.in_progress': 'प्रगति पर है',
            'status.completed': 'पूर्ण',
            'status.assigned': 'आवंटित',

            'action.start_survey': 'सर्वेक्षण शुरू करें',
            'action.resume_survey': 'सर्वेक्षण जारी रखें',
            'action.view_summary': 'सारांश देखें',
            'action.all_completed': '✓ सभी सर्वेक्षण पूर्ण हुए',
            'action.previous': 'पिछला',
            'action.next': 'अगला प्रश्न',
            'action.save_exit': 'सहेजें और बाहर निकलें',
            'action.submit_survey': 'सर्वेक्षण जमा करें',
            'action.cancel': 'रद्द करें',
            'action.confirm_submit': 'हाँ, अंतिम उत्तर जमा करें',
            'action.close': 'बंद करें',

            'survey.header_title': 'व्यक्ति एवं प्रक्रिया उत्कृष्टता',
            'survey.confidential_badge': 'गोपनीय कार्यस्थल मूल्यांकन',
            'survey.question_counter': 'प्रश्न {current} / {total}',
            'survey.completion_pct': '{percent}% पूर्ण',
            'survey.assessment_badge': 'परिचालन मूल्यांकन',
            'survey.hint_default': 'अपने दैनिक कार्य अनुभव के आधार पर उत्तर दें।',
            'survey.validation_required': 'आगे बढ़ने के लिए कृपया एक उत्तर चुनें।',
            'survey.confirm_modal_title': 'सर्वेक्षण जमा करना चाहते हैं?',
            'survey.confirm_modal_desc': 'क्या आप इसे अंतिम रूप से जमा करना चाहते हैं? जमा करने के बाद उत्तर बदले नहीं जा सकते।',
            'survey.progress_saved_toast': 'प्रगति सफलतापूर्वक सहेजी गई।',

            'likert.strongly_disagree': 'दृढ़ता से असहमत',
            'likert.disagree': 'असहमत',
            'likert.neutral': 'तटस्थ',
            'likert.agree': 'सहमत',
            'likert.strongly_agree': 'दृढ़ता से सहमत',

            'feedback.title': 'गोपनीय मुक्त प्रतिक्रिया',
            'feedback.subtitle': 'कार्यस्थल संस्कृति को बेहतर बनाने के लिए अपने सुझाव साझा करें।',
            'feedback.textarea_placeholder': 'अपने विस्तृत सुझाव या विचार साझा करें (वैकल्पिक)...',
            'feedback.char_counter': '{count} अक्षर (वैकल्पिक)',
            'feedback.submit_btn': 'सर्वेक्षण और सुझाव जमा करें',
            'feedback.anonymity_reminder': 'आपकी प्रतिक्रिया पूरी तरह गोपनीय और सुरक्षित है।',

            'confirmation.badge': 'सर्वेक्षण पूरा हुआ',
            'confirmation.title': 'आपकी भागीदारी के लिए धन्यवाद!',
            'confirmation.subtitle': 'आपके उत्तर सुरक्षित रूप से दर्ज कर लिए गए हैं।',
            'confirmation.desc': 'आपकी ईमानदार राय एक बेहतर कार्यस्थल के निर्माण में मदद करती है।',
            'confirmation.reference_id': 'संदर्भ संख्या',
            'confirmation.btn_home': 'कर्मचारी पोर्टल पर वापस जाएं',

            'eagle.title': 'ईगल AI सहायक',
            'eagle.subtitle': 'गोपनीय सर्वेक्षण मार्गदर्शक',
            'eagle.placeholder': 'ईगल से कुछ भी पूछें...',
            'eagle.send': 'भेजें',
            'eagle.greeting': 'नमस्ते! मैं ईगल हूँ, आपका सर्वेक्षण AI सहायक। मैं आपकी क्या मदद कर सकता हूँ?',
            'eagle.chip_confidential': 'क्या मेरी प्रतिक्रिया गोपनीय है?',
            'eagle.chip_time': 'इसमें कितना समय लगेगा?',
            'eagle.chip_why': 'यह सर्वेक्षण क्यों महत्वपूर्ण है?',

            'lang.select_label': 'भाषा',
            'lang.switch_prompt': 'भाषा चुनें'
        },

        es: {
            'brand.company': 'VISTERIA CONSULTING SERVICES PRIVATE LIMITED',
            'brand.tagline': 'La visión lo cambia todo.',
            'nav.about_survey': 'Acerca de la encuesta',
            'nav.admin_portal': 'Portal de administración',
            'nav.enterprise_secured': 'SEGURIDAD EMPRESARIAL',
            'nav.survey_active': 'PORTAL ACTIVO',
            'nav.logout': 'Cerrar sesión',
            'nav.back_to_portal': 'Volver al portal',

            'auth.title_signin': 'Bienvenido de nuevo',
            'auth.subtitle_signin': 'Inicie sesión para acceder a su encuesta laboral confidencial.',
            'auth.title_signup': 'Crear una cuenta',
            'auth.subtitle_signup': 'Registre su perfil de empleado con su organización.',
            'auth.tab_signin': 'Iniciar sesión',
            'auth.tab_signup': 'Registrarse',
            'auth.tab_forgot': '¿Olvidó su contraseña?',
            'auth.tab_reset': 'Restablecer contraseña',
            'auth.email': 'Correo electrónico',
            'auth.email_placeholder': 'Ingrese su correo corporativo',
            'auth.password': 'Contraseña',
            'auth.password_placeholder': 'Ingrese su contraseña segura',
            'auth.fullname': 'Nombre completo',
            'auth.fullname_placeholder': 'Ingrese su nombre completo',
            'auth.employee_id': 'Código de empleado',
            'auth.employee_id_placeholder': 'ej. EMP1024',
            'auth.department': 'Departamento',
            'auth.department_placeholder': 'Seleccione departamento',
            'auth.company': 'Organización / Empresa',
            'auth.company_placeholder': 'Seleccione su organización',
            'auth.phone': 'Teléfono',
            'auth.phone_placeholder': 'ej. +34 600 000 000',
            'auth.remember_me': 'Recordar este dispositivo',
            'auth.forgot_password_link': '¿Olvidó su contraseña?',
            'auth.btn_signin': 'Entrar a la encuesta',
            'auth.btn_signup': 'Crear cuenta de empleado',
            'auth.btn_send_reset': 'Enviar enlace de recuperación',
            'auth.btn_reset': 'Actualizar contraseña e ingresar',
            'auth.btn_suggest': 'Sugerir',
            'auth.back_to_signin': 'Volver a iniciar sesión',
            'auth.already_account': '¿Ya tiene una cuenta?',
            'auth.no_account': '¿No tiene una cuenta?',
            'auth.register_here': 'Regístrese aquí →',
            'auth.signin_here': 'Inicie sesión aquí →',
            'auth.confidential_badge': 'Comentarios 100% confidenciales y seguros',

            'welcome.badge': 'EXCELENCIA EN PERSONAS Y PROCESOS',
            'welcome.hero_title_1': 'EXCELENCIA EN PERSONAS',
            'welcome.hero_title_2': 'Y PROCESOS',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria Consulting Services le da la bienvenida a su encuesta laboral confidencial. Sus opiniones honestas guían mejoras significativas.',
            'welcome.tagline': 'La visión lo cambia todo. • Empoderando a las personas, elevando a las organizaciones.',
            'welcome.org_conducting': 'ORGANIZACIÓN QUE REALIZA LA ENCUESTA',
            'welcome.official_program': 'Programa oficial de encuesta organizacional',
            'welcome.survey_categories': 'Categorías de encuesta',
            'welcome.categories_subtitle': 'Seleccione cualquier categoría asignada para completar su evaluación.',
            'welcome.anonymous_notice': 'Sus respuestas están encriptadas y son estrictamente anónimas.',

            'profile.emp_name': 'Nombre del empleado',
            'profile.emp_id': 'ID de empleado',
            'profile.department': 'Departamento',
            'profile.survey_status': 'Estado de la encuesta',

            'status.not_started': 'No iniciada',
            'status.in_progress': 'En progreso',
            'status.completed': 'Completada',
            'status.assigned': 'Asignada',

            'action.start_survey': 'Iniciar encuesta',
            'action.resume_survey': 'Continuar encuesta',
            'action.view_summary': 'Ver resumen',
            'action.all_completed': '✓ Todas las encuestas completadas',
            'action.previous': 'Anterior',
            'action.next': 'Siguiente pregunta',
            'action.save_exit': 'Guardar y salir',
            'action.submit_survey': 'Enviar encuesta',
            'action.cancel': 'Cancelar',
            'action.confirm_submit': 'Sí, enviar respuestas finales',
            'action.close': 'Cerrar',

            'survey.header_title': 'EXCELENCIA EN PERSONAS Y PROCESOS',
            'survey.confidential_badge': 'Evaluación confidencial del lugar de trabajo',
            'survey.question_counter': 'Pregunta {current} de {total}',
            'survey.completion_pct': '{percent}% completado',
            'survey.assessment_badge': 'EVALUACIÓN OPERACIONAL',
            'survey.hint_default': 'Reflexione sobre su experiencia laboral cotidiana.',
            'survey.validation_required': 'Por favor seleccione una respuesta para continuar.',
            'survey.confirm_modal_title': '¿Enviar la evaluación de la encuesta?',
            'survey.confirm_modal_desc': '¿Está seguro de enviar sus respuestas finales? Una vez enviadas, no se podrán modificar.',
            'survey.progress_saved_toast': 'Progreso guardado correctamente.',

            'likert.strongly_disagree': 'Totalmente en desacuerdo',
            'likert.disagree': 'En desacuerdo',
            'likert.neutral': 'Neutral',
            'likert.agree': 'De acuerdo',
            'likert.strongly_agree': 'Totalmente de acuerdo',

            'feedback.title': 'Comentarios abiertos confidenciales',
            'feedback.subtitle': 'Comparta sus observaciones o sugerencias para mejorar la cultura laboral.',
            'feedback.textarea_placeholder': 'Comparta sus comentarios detallados (Opcional)...',
            'feedback.char_counter': '{count} caracteres (Opcional)',
            'feedback.submit_btn': 'Enviar encuesta y comentarios',
            'feedback.anonymity_reminder': 'Sus comentarios son totalmente anónimos y seguros.',

            'confirmation.badge': 'ENCUESTA COMPLETADA',
            'confirmation.title': '¡Muchas gracias por su participación!',
            'confirmation.subtitle': 'Sus respuestas han sido registradas y encriptadas con total seguridad.',
            'confirmation.desc': 'Sus ideas ayudan al liderazgo a construir un mejor entorno laboral centrado en las personas.',
            'confirmation.reference_id': 'Número de referencia',
            'confirmation.btn_home': 'Volver al portal del empleado',

            'eagle.title': 'Asistente Eagle AI',
            'eagle.subtitle': 'Guía confidencial de encuesta',
            'eagle.placeholder': 'Pregunte a Eagle sobre esta encuesta...',
            'eagle.send': 'Enviar',
            'eagle.greeting': '¡Hola! Soy Eagle, su asistente de IA para la encuesta. ¿En qué puedo ayudarle hoy?',
            'eagle.chip_confidential': '¿Son confidenciales mis respuestas?',
            'eagle.chip_time': '¿Cuánto tiempo toma la encuesta?',
            'eagle.chip_why': '¿Por qué es importante esta encuesta?',

            'lang.select_label': 'Idioma',
            'lang.switch_prompt': 'Seleccionar idioma'
        },

        fr: {
            'brand.company': 'VISTERIA CONSULTING SERVICES PRIVATE LIMITED',
            'brand.tagline': 'La vision change tout.',
            'nav.about_survey': 'À propos de l’enquête',
            'nav.admin_portal': 'Portail administrateur',
            'nav.enterprise_secured': 'SÉCURISÉ POUR L’ENTREPRISE',
            'nav.survey_active': 'PORTAIL ACTIF',
            'nav.logout': 'Déconnexion',
            'nav.back_to_portal': 'Retour au portail',

            'auth.title_signin': 'Bon retour',
            'auth.subtitle_signin': 'Connectez-vous pour accéder à votre enquête professionnelle confidentielle.',
            'auth.title_signup': 'Créer un compte',
            'auth.subtitle_signup': 'Enregistrez votre profil d’employé auprès de votre organisation.',
            'auth.tab_signin': 'Connexion',
            'auth.tab_signup': 'S’inscrire',
            'auth.tab_forgot': 'Mot de passe oublié',
            'auth.tab_reset': 'Réinitialiser le mot de passe',
            'auth.email': 'Adresse e-mail',
            'auth.email_placeholder': 'Entrez votre e-mail professionnel',
            'auth.password': 'Mot de passe',
            'auth.password_placeholder': 'Entrez votre mot de passe sécurisé',
            'auth.fullname': 'Nom complet',
            'auth.fullname_placeholder': 'Entrez votre nom complet',
            'auth.employee_id': 'Identifiant employé',
            'auth.employee_id_placeholder': 'ex. EMP1024',
            'auth.department': 'Département',
            'auth.department_placeholder': 'Sélectionnez un département',
            'auth.company': 'Organisation / Entreprise',
            'auth.company_placeholder': 'Sélectionnez votre organisation',
            'auth.phone': 'Numéro de téléphone',
            'auth.phone_placeholder': 'ex. +33 6 00 00 00 00',
            'auth.remember_me': 'Se souvenir de cet appareil',
            'auth.forgot_password_link': 'Mot de passe oublié ?',
            'auth.btn_signin': 'Accéder à l’enquête',
            'auth.btn_signup': 'Créer mon compte employé',
            'auth.btn_send_reset': 'Envoyer le lien de réinitialisation',
            'auth.btn_reset': 'Mettre à jour et se connecter',
            'auth.btn_suggest': 'Suggérer',
            'auth.back_to_signin': 'Retour à la connexion',
            'auth.already_account': 'Déjà inscrit ?',
            'auth.no_account': 'Pas encore de compte ?',
            'auth.register_here': 'Inscrivez-vous ici →',
            'auth.signin_here': 'Connectez-vous ici →',
            'auth.confidential_badge': 'Commentaires 100% confidentiels et sécurisés',

            'welcome.badge': 'EXCELLENCE DES PERSONNES ET DES PROCESSUS',
            'welcome.hero_title_1': 'EXCELLENCE DES PERSONNES',
            'welcome.hero_title_2': 'ET DES PROCESSUS',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria Consulting Services vous souhaite la bienvenue dans votre enquête confidentielle. Vos retours guident des améliorations concrètes.',
            'welcome.tagline': 'La vision change tout. • Renforcer les personnes, élever les organisations.',
            'welcome.org_conducting': 'ORGANISATION RÉALISANT L’ENQUÊTE',
            'welcome.official_program': 'Programme officiel d’enquête organisationnelle',
            'welcome.survey_categories': 'Catégories d’enquête',
            'welcome.categories_subtitle': 'Sélectionnez une catégorie assignée pour compléter votre évaluation.',
            'welcome.anonymous_notice': 'Vos réponses sont cryptées, regroupées et rigoureusement anonymes.',

            'profile.emp_name': 'Nom de l’employé',
            'profile.emp_id': 'ID Employé',
            'profile.department': 'Département',
            'profile.survey_status': 'Statut de l’enquête',

            'status.not_started': 'Non commencée',
            'status.in_progress': 'En cours',
            'status.completed': 'Terminée',
            'status.assigned': 'Assignée',

            'action.start_survey': 'Commencer l’enquête',
            'action.resume_survey': 'Reprendre l’enquête',
            'action.view_summary': 'Voir le résumé',
            'action.all_completed': '✓ Toutes les enquêtes sont terminées',
            'action.previous': 'Précédent',
            'action.next': 'Question suivante',
            'action.save_exit': 'Enregistrer et quitter',
            'action.submit_survey': 'Soumettre l’enquête',
            'action.cancel': 'Annuler',
            'action.confirm_submit': 'Oui, soumettre mes réponses',
            'action.close': 'Fermer',

            'survey.header_title': 'EXCELLENCE DES PERSONNES ET DES PROCESSUS',
            'survey.confidential_badge': 'Évaluation confidentielle du lieu de travail',
            'survey.question_counter': 'Question {current} sur {total}',
            'survey.completion_pct': '{percent}% complété',
            'survey.assessment_badge': 'ÉVALUATION OPÉRATIONNELLE',
            'survey.hint_default': 'Réfléchissez à votre expérience professionnelle quotidienne.',
            'survey.validation_required': 'Veuillez sélectionner une réponse pour continuer.',
            'survey.confirm_modal_title': 'Soumettre votre évaluation ?',
            'survey.confirm_modal_desc': 'Êtes-vous sûr de vouloir finaliser votre soumission ? Une fois soumises, vos réponses ne pourront plus être modifiées.',
            'survey.progress_saved_toast': 'Progression enregistrée avec succès.',

            'likert.strongly_disagree': 'Pas du tout d’accord',
            'likert.disagree': 'Pas d’accord',
            'likert.neutral': 'Neutre',
            'likert.agree': 'D’accord',
            'likert.strongly_agree': 'Tout à fait d’accord',

            'feedback.title': 'Commentaires libres et confidentiels',
            'feedback.subtitle': 'Partagez vos idées ou suggestions pour enrichir la culture d’entreprise.',
            'feedback.textarea_placeholder': 'Partagez vos remarques ou suggestions détaillées (Facultatif)...',
            'feedback.char_counter': '{count} caractères (Facultatif)',
            'feedback.submit_btn': 'Soumettre l’enquête et les retours',
            'feedback.anonymity_reminder': 'Vos retours sont totalement anonymes et protégés.',

            'confirmation.badge': 'ENQUÊTE TERMINÉE',
            'confirmation.title': 'Merci pour votre contribution !',
            'confirmation.subtitle': 'Vos réponses ont été enregistrées et chiffrées en toute sécurité.',
            'confirmation.desc': 'Vos observations permettent de construire une organisation plus collaborative et humaine.',
            'confirmation.reference_id': 'Identifiant de référence',
            'confirmation.btn_home': 'Retour au portail employé',

            'eagle.title': 'Assistant Eagle IA',
            'eagle.subtitle': 'Compagnon d’enquête confidentiel',
            'eagle.placeholder': 'Posez une question à Eagle...',
            'eagle.send': 'Envoyer',
            'eagle.greeting': 'Bonjour ! Je suis Eagle, votre assistant d’enquête IA. Comment puis-je vous aider ?',
            'eagle.chip_confidential': 'Mes réponses sont-elles confidentielles ?',
            'eagle.chip_time': 'Combien de temps prend cette enquête ?',
            'eagle.chip_why': 'Pourquoi cette enquête est-elle importante ?',

            'lang.select_label': 'Langue',
            'lang.switch_prompt': 'Choisir la langue'
        },

        de: {
            'brand.company': 'VISTERIA CONSULTING SERVICES PRIVATE LIMITED',
            'brand.tagline': 'Vision verändert alles.',
            'nav.about_survey': 'Über die Umfrage',
            'nav.admin_portal': 'Admin-Portal',
            'nav.enterprise_secured': 'UNTERNEHMENSSICHERHEIT',
            'nav.survey_active': 'UMFRAGE-PORTAL AKTIV',
            'nav.logout': 'Abmelden',
            'nav.back_to_portal': 'Zurück zum Portal',

            'auth.title_signin': 'Willkommen zurück',
            'auth.subtitle_signin': 'Melden Sie sich an, um an Ihrer vertraulichen Arbeitsplatzumfrage teilzunehmen.',
            'auth.title_signup': 'Konto erstellen',
            'auth.subtitle_signup': 'Registrieren Sie Ihr Mitarbeiterprofil bei Ihrem Unternehmen.',
            'auth.tab_signin': 'Anmelden',
            'auth.tab_signup': 'Registrieren',
            'auth.tab_forgot': 'Passwort vergessen',
            'auth.tab_reset': 'Passwort zurücksetzen',
            'auth.email': 'E-Mail-Adresse',
            'auth.email_placeholder': 'Geben Sie Ihre geschäftliche E-Mail ein',
            'auth.password': 'Passwort',
            'auth.password_placeholder': 'Geben Sie Ihr sicheres Passwort ein',
            'auth.fullname': 'Vollständiger Name',
            'auth.fullname_placeholder': 'Geben Sie Ihren Namen ein',
            'auth.employee_id': 'Mitarbeiter-ID',
            'auth.employee_id_placeholder': 'z.B. EMP1024',
            'auth.department': 'Abteilung',
            'auth.department_placeholder': 'Abteilung auswählen',
            'auth.company': 'Unternehmen',
            'auth.company_placeholder': 'Wählen Sie Ihr Unternehmen',
            'auth.phone': 'Telefonnummer',
            'auth.phone_placeholder': 'z.B. +49 170 0000000',
            'auth.remember_me': 'Dieses Gerät merken',
            'auth.forgot_password_link': 'Passwort vergessen?',
            'auth.btn_signin': 'Zur Umfrage anmelden',
            'auth.btn_signup': 'Mitarbeiterkonto erstellen',
            'auth.btn_send_reset': 'Link anfordern',
            'auth.btn_reset': 'Passwort aktualisieren & anmelden',
            'auth.btn_suggest': 'Vorschlagen',
            'auth.back_to_signin': 'Zurück zur Anmeldung',
            'auth.already_account': 'Bereits registriert?',
            'auth.no_account': 'Noch kein Konto?',
            'auth.register_here': 'Hier registrieren →',
            'auth.signin_here': 'Hier anmelden →',
            'auth.confidential_badge': '100% vertrauliches & sicheres Feedback',

            'welcome.badge': 'MENSCH & PROZESS EXZELLENZ',
            'welcome.hero_title_1': 'MENSCH & PROZESS',
            'welcome.hero_title_2': 'EXZELLENZ',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria Consulting Services heißt Sie zu Ihrer vertraulichen Mitarbeiterbefragung willkommen.',
            'welcome.tagline': 'Vision verändert alles. • Menschen stärken, Organisationen voranbringen.',
            'welcome.org_conducting': 'DURCHFÜHRENDE ORGANISATION',
            'welcome.official_program': 'Offizielles Befragungsprogramm',
            'welcome.survey_categories': 'Umfragekategorien',
            'welcome.categories_subtitle': 'Wählen Sie eine Kategorie, um Ihre Bewertung abzuschließen.',
            'welcome.anonymous_notice': 'Ihre Antworten sind verschlüsselt und absolut anonym.',

            'profile.emp_name': 'Mitarbeitername',
            'profile.emp_id': 'Mitarbeiter-ID',
            'profile.department': 'Abteilung',
            'profile.survey_status': 'Umfragestatus',

            'status.not_started': 'Nicht begonnen',
            'status.in_progress': 'In Bearbeitung',
            'status.completed': 'Abgeschlossen',
            'status.assigned': 'Zugewiesen',

            'action.start_survey': 'Umfrage starten',
            'action.resume_survey': 'Umfrage fortsetzen',
            'action.view_summary': 'Übersicht anzeigen',
            'action.all_completed': '✓ Alle Umfragen abgeschlossen',
            'action.previous': 'Zurück',
            'action.next': 'Nächste Frage',
            'action.save_exit': 'Speichern & Verlassen',
            'action.submit_survey': 'Umfrage einreichen',
            'action.cancel': 'Abbrechen',
            'action.confirm_submit': 'Ja, Antworten jetzt einreichen',
            'action.close': 'Schließen',

            'survey.header_title': 'MENSCH & PROZESS EXZELLENZ',
            'survey.confidential_badge': 'Vertrauliche Arbeitsplatzbewertung',
            'survey.question_counter': 'Frage {current} von {total}',
            'survey.completion_pct': '{percent}% abgeschlossen',
            'survey.assessment_badge': 'OPERATIVE BEWERTUNG',
            'survey.hint_default': 'Reflektieren Sie über Ihre tägliche Arbeitserfahrung.',
            'survey.validation_required': 'Bitte wählen Sie eine Antwort, um fortzufahren.',
            'survey.confirm_modal_title': 'Umfrage einreichen?',
            'survey.confirm_modal_desc': 'Sind Sie sicher, dass Sie Ihre Antworten final übermitteln möchten?',
            'survey.progress_saved_toast': 'Fortschritt erfolgreich gespeichert.',

            'likert.strongly_disagree': 'Stimme überhaupt nicht zu',
            'likert.disagree': 'Stimme nicht zu',
            'likert.neutral': 'Neutral',
            'likert.agree': 'Stimme zu',
            'likert.strongly_agree': 'Stimme voll und ganz zu',

            'feedback.title': 'Vertrauliches freies Feedback',
            'feedback.subtitle': 'Teilen Sie Anregungen oder Ideen zur Verbesserung der Arbeitskultur.',
            'feedback.textarea_placeholder': 'Ihre Beobachtungen oder Ideen (Optional)...',
            'feedback.char_counter': '{count} Zeichen (Optional)',
            'feedback.submit_btn': 'Umfrage & Feedback einreichen',
            'feedback.anonymity_reminder': 'Ihr Feedback ist absolut anonym.',

            'confirmation.badge': 'UMFRAGE ABGESCHLOSSEN',
            'confirmation.title': 'Vielen Dank für Ihre Teilnahme!',
            'confirmation.subtitle': 'Ihre Antworten wurden sicher verschlüsselt gespeichert.',
            'confirmation.desc': 'Ihre offenen Einsichten helfen uns, eine menschlichere Arbeitswelt zu gestalten.',
            'confirmation.reference_id': 'Referenz-ID',
            'confirmation.btn_home': 'Zurück zum Portal',

            'eagle.title': 'Eagle KI-Assistent',
            'eagle.subtitle': 'Vertraulicher Umfragebegleiter',
            'eagle.placeholder': 'Fragen Sie Eagle...',
            'eagle.send': 'Senden',
            'eagle.greeting': 'Hallo! Ich bin Eagle, Ihr KI-Assistent. Wie kann ich Ihnen helfen?',
            'eagle.chip_confidential': 'Sind meine Antworten vertraulich?',
            'eagle.chip_time': 'Wie lange dauert die Umfrage?',
            'eagle.chip_why': 'Warum ist diese Umfrage wichtig?',

            'lang.select_label': 'Sprache',
            'lang.switch_prompt': 'Sprache wählen'
        },

        zh: {
            'brand.company': 'VISTERIA 咨询服务私人有限公司',
            'brand.tagline': '远见改变一切。',
            'nav.about_survey': '关于调研',
            'nav.admin_portal': '管理后台',
            'nav.enterprise_secured': '企业级安全防护',
            'nav.survey_active': '调研系统运行中',
            'nav.logout': '退出登录',
            'nav.back_to_portal': '返回门户',

            'auth.title_signin': '欢迎回来',
            'auth.subtitle_signin': '登录以参与您的机密职场调研。',
            'auth.title_signup': '创建账户',
            'auth.subtitle_signup': '在您的机构中注册员工档案。',
            'auth.tab_signin': '登录',
            'auth.tab_signup': '注册',
            'auth.tab_forgot': '忘记密码',
            'auth.tab_reset': '重置密码',
            'auth.email': '电子邮箱',
            'auth.email_placeholder': '输入您的企业办公邮箱',
            'auth.password': '密码',
            'auth.password_placeholder': '输入您的安全密码',
            'auth.fullname': '姓名',
            'auth.fullname_placeholder': '输入您的真实姓名',
            'auth.employee_id': '员工编号',
            'auth.employee_id_placeholder': '如：EMP1024',
            'auth.department': '部门',
            'auth.department_placeholder': '选择所在部门',
            'auth.company': '所属企业/机构',
            'auth.company_placeholder': '选择您的企业',
            'auth.phone': '联系电话',
            'auth.phone_placeholder': '如：+86 13800000000',
            'auth.remember_me': '记住此设备',
            'auth.forgot_password_link': '忘记密码？',
            'auth.btn_signin': '登录并参与调研',
            'auth.btn_signup': '创建员工账户',
            'auth.btn_send_reset': '发送重置链接',
            'auth.btn_reset': '更新密码并登录',
            'auth.btn_suggest': '自动建议',
            'auth.back_to_signin': '返回登录',
            'auth.already_account': '已有账户？',
            'auth.no_account': '还没有账户？',
            'auth.register_here': '在此注册 →',
            'auth.signin_here': '在此登录 →',
            'auth.confidential_badge': '100% 严格机密与安全保障',

            'welcome.badge': '卓越人才与流程',
            'welcome.hero_title_1': '卓越人才与',
            'welcome.hero_title_2': '卓越流程',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria 咨询服务诚邀您参与机密职场满意度调研。您的真实心声将推动团队环境的持续改善。',
            'welcome.tagline': '远见改变一切。 • 赋能员工，升华组织。',
            'welcome.org_conducting': '发起调研的机构',
            'welcome.official_program': '官方企业组织发展调研项目',
            'welcome.survey_categories': '调研模块分类',
            'welcome.categories_subtitle': '选择任意指定分类即可开始或继续作答。',
            'welcome.anonymous_notice': '所有回答均经端到端加密与聚合统计，绝不公开个人身份。',

            'profile.emp_name': '员工姓名',
            'profile.emp_id': '员工编号',
            'profile.department': '所属部门',
            'profile.survey_status': '调研进度状态',

            'status.not_started': '未开始',
            'status.in_progress': '进行中',
            'status.completed': '已完成',
            'status.assigned': '已指派',

            'action.start_survey': '开始调研',
            'action.resume_survey': '继续作答',
            'action.view_summary': '查看概览',
            'action.all_completed': '✓ 全部调研已完成',
            'action.previous': '上一题',
            'action.next': '下一题',
            'action.save_exit': '保存并退出',
            'action.submit_survey': '提交调研',
            'action.cancel': '取消',
            'action.confirm_submit': '确认提交最终答案',
            'action.close': '关闭',

            'survey.header_title': '卓越人才与流程',
            'survey.confidential_badge': '机密职场评估',
            'survey.question_counter': '第 {current} 题 / 共 {total} 题',
            'survey.completion_pct': '已完成 {percent}%',
            'survey.assessment_badge': '运营与环境评估',
            'survey.hint_default': '请根据您日常真实的工作体验作答。',
            'survey.validation_required': '请先选择一个选项后再进入下一题。',
            'survey.confirm_modal_title': '确认提交调研？',
            'survey.confirm_modal_desc': '您确定要提交所有回答吗？提交后将无法修改，并将汇总计入组织综合报告。',
            'survey.progress_saved_toast': '进度已成功自动保存。',

            'likert.strongly_disagree': '非常不同意',
            'likert.disagree': '不同意',
            'likert.neutral': '中立',
            'likert.agree': '同意',
            'likert.strongly_agree': '非常同意',

            'feedback.title': '机密开放式建议',
            'feedback.subtitle': '分享您的观察与建议，共同打造更卓越的职场文化。',
            'feedback.textarea_placeholder': '写下您的具体观察或建议（选填）...',
            'feedback.char_counter': '{count} 个字符（选填）',
            'feedback.submit_btn': '提交问卷与反馈',
            'feedback.anonymity_reminder': '您的反馈完全匿名，受到企业级最高安全保护。',

            'confirmation.badge': '调研圆满完成',
            'confirmation.title': '非常感谢您的宝贵反馈！',
            'confirmation.subtitle': '您的作答已完成端到端安全加密存储。',
            'confirmation.desc': '您的真知灼见将协助管理层构建更具凝聚力与关怀的职场环境。',
            'confirmation.reference_id': '参考凭证号',
            'confirmation.btn_home': '返回员工门户',

            'eagle.title': 'Eagle AI 助手',
            'eagle.subtitle': '机密调研智能向导',
            'eagle.placeholder': '向 Eagle 咨询有关调研的问题...',
            'eagle.send': '发送',
            'eagle.greeting': '您好！我是 Eagle 智能向导，请问在本次调研中有什么可以协助您的？',
            'eagle.chip_confidential': '我的回答真的保密吗？',
            'eagle.chip_time': '完成调研需要多长时间？',
            'eagle.chip_why': '这次调研的目的与意义是什么？',

            'lang.select_label': '界面语言',
            'lang.switch_prompt': '切换语言'
        },

        ja: {
            'brand.company': 'VISTERIA コンサルティングサービス株式会社',
            'brand.tagline': 'ビジョンがすべてを変える。',
            'nav.about_survey': '調査について',
            'nav.admin_portal': '管理者ポータル',
            'nav.enterprise_secured': 'エンタープライズセキュリティ',
            'nav.survey_active': 'アンケート稼働中',
            'nav.logout': 'ログアウト',
            'nav.back_to_portal': 'ポータルへ戻る',

            'auth.title_signin': 'おかえりなさい',
            'auth.subtitle_signin': '職場の機密意識調査に参加するにはサインインしてください。',
            'auth.title_signup': 'アカウント作成',
            'auth.subtitle_signup': '所属組織に社員プロフィールを登録します。',
            'auth.tab_signin': 'サインイン',
            'auth.tab_signup': '新規登録',
            'auth.tab_forgot': 'パスワード再設定',
            'auth.tab_reset': 'パスワード更新',
            'auth.email': 'メールアドレス',
            'auth.email_placeholder': '社用メールアドレスを入力',
            'auth.password': 'パスワード',
            'auth.password_placeholder': '安全なパスワードを入力',
            'auth.fullname': '氏名',
            'auth.fullname_placeholder': '氏名を入力',
            'auth.employee_id': '社員番号',
            'auth.employee_id_placeholder': '例: EMP1024',
            'auth.department': '部署',
            'auth.department_placeholder': '部署を選択',
            'auth.company': '所属組織・企業',
            'auth.company_placeholder': '組織を選択',
            'auth.phone': '電話番号',
            'auth.phone_placeholder': '例: 090-0000-0000',
            'auth.remember_me': 'この端末を記憶する',
            'auth.forgot_password_link': 'パスワードをお忘れですか？',
            'auth.btn_signin': 'サインインして開始',
            'auth.btn_signup': '社員アカウント作成',
            'auth.btn_send_reset': '再設定リンクを送信',
            'auth.btn_reset': 'パスワード更新してサインイン',
            'auth.btn_suggest': '自動生成',
            'auth.back_to_signin': 'サインインに戻る',
            'auth.already_account': '登録済みですか？',
            'auth.no_account': 'アカウントをお持ちでないですか？',
            'auth.register_here': '新規登録はこちら →',
            'auth.signin_here': 'サインインはこちら →',
            'auth.confidential_badge': '100% 完全匿名＆機密保護',

            'welcome.badge': 'ピープル＆プロセス・エクセレンス',
            'welcome.hero_title_1': 'ピープル＆プロセス',
            'welcome.hero_title_2': 'エクセレンス',
            'welcome.hero_title_3': '',
            'welcome.hero_desc': 'Visteria コンサルティングサービスへようこそ。皆様の率直な意見が組織の職場環境をより良く改善します。',
            'welcome.tagline': 'ビジョンがすべてを変える。 • 人を活かし、組織を高める。',
            'welcome.org_conducting': '調査実施組織',
            'welcome.official_program': '公式組織調査プログラム',
            'welcome.survey_categories': '調査カテゴリー',
            'welcome.categories_subtitle': '割り当てられたカテゴリーを選択して回答を進めてください。',
            'welcome.anonymous_notice': '回答内容は暗号化・統計化され、完全な匿名性が保証されます。',

            'profile.emp_name': '社員氏名',
            'profile.emp_id': '社員番号',
            'profile.department': '所属部署',
            'profile.survey_status': '回答状況',

            'status.not_started': '未着手',
            'status.in_progress': '回答中',
            'status.completed': '完了',
            'status.assigned': '割当済',

            'action.start_survey': 'アンケート開始',
            'action.resume_survey': '回答を再開',
            'action.view_summary': '概要を見る',
            'action.all_completed': '✓ すべての調査が完了しました',
            'action.previous': '前の質問',
            'action.next': '次の質問',
            'action.save_exit': '保存して中断',
            'action.submit_survey': 'アンケートを送信',
            'action.cancel': 'キャンセル',
            'action.confirm_submit': 'はい、回答を送信します',
            'action.close': '閉じる',

            'survey.header_title': 'ピープル＆プロセス・エクセレンス',
            'survey.confidential_badge': '機密職場アセスメント',
            'survey.question_counter': '設問 {current} / {total}',
            'survey.completion_pct': '{percent}% 完了',
            'survey.assessment_badge': '職場運用アセスメント',
            'survey.hint_default': '日々の職場での率直な体験をお聞かせください。',
            'survey.validation_required': '次の設問へ進む前に回答を選択してください。',
            'survey.confirm_modal_title': 'アンケートを送信しますか？',
            'survey.confirm_modal_desc': '回答を確定して送信しますか？送信後は回答を変更できません。',
            'survey.progress_saved_toast': '進捗が正常に保存されました。',

            'likert.strongly_disagree': '全くそう思わない',
            'likert.disagree': 'そう思わない',
            'likert.neutral': 'どちらとも言えない',
            'likert.agree': 'そう思う',
            'likert.strongly_agree': '非常にそう思う',

            'feedback.title': '自由記述フィードバック（機密）',
            'feedback.subtitle': '職場環境をより良くするためのご意見・改善提案をお聞かせください。',
            'feedback.textarea_placeholder': '具体的な気づきや提案をご記入ください（任意）...',
            'feedback.char_counter': '{count} 文字（任意）',
            'feedback.submit_btn': 'アンケートと意見を送信',
            'feedback.anonymity_reminder': 'フィードバックは完全匿名で安全に保護されます。',

            'confirmation.badge': '調査完了',
            'confirmation.title': 'ご協力ありがとうございました！',
            'confirmation.subtitle': '回答は安全に暗号化されて記録されました。',
            'confirmation.desc': '皆様からの貴重な洞察が、より働きやすい職場環境の構築に役立てられます。',
            'confirmation.reference_id': '参照受付番号',
            'confirmation.btn_home': '社員ポータルへ戻る',

            'eagle.title': 'Eagle AI アシスタント',
            'eagle.subtitle': '機密調査コンパニオン',
            'eagle.placeholder': 'Eagleに質問する...',
            'eagle.send': '送信',
            'eagle.greeting': 'こんにちは！AIアシスタントのEagleです。ご質問はありますか？',
            'eagle.chip_confidential': '回答の匿名性は守られますか？',
            'eagle.chip_time': '所要時間はどれくらいですか？',
            'eagle.chip_why': 'この調査を行う理由は何ですか？',

            'lang.select_label': '言語',
            'lang.switch_prompt': '言語を選択'
        }
    };

    // 2.1 Enterprise UI Extensions for all 9 supported languages
    const ENTERPRISE_EXTENSIONS = {
        en: {
            'brand.product_title': 'PEOPLE & PROCESS EXCELLENCE',
            'brand.desc': 'Empowering organizational growth through authentic employee feedback, intelligent operational synthesis, and leadership excellence.',
            'brand.pillar1_title': 'Confidential Feedback',
            'brand.pillar1_desc': 'Encouraging authentic workplace voices in an encrypted, privacy-first environment.',
            'brand.pillar2_title': 'Actionable Intelligence',
            'brand.pillar2_desc': 'Transforming sentiment and assessment data into clear organizational priorities.',
            'brand.pillar3_title': 'Sustainable Growth',
            'brand.pillar3_desc': 'Fostering psychological safety, operational resilience, and cross-team alignment.',
            'auth.email_or_empid': 'Email or Employee ID',
            'auth.email_or_empid_placeholder': 'Enter your Email or Employee ID',
            'auth.confirm_password': 'Confirm Password',
            'auth.confirm_password_placeholder': 'Confirm password',
            'auth.password_create_placeholder': 'Create password',
            'auth.autogen_badge': 'AUTO-GENERATED',
            'auth.autogen_placeholder': 'Assigned on registration',
            'auth.company_select_default': 'Select your company',
            'auth.dept_select_default': 'Select your department',
            'auth.other_option': 'Other',
            'auth.specify_company': 'Specify Company Name',
            'auth.specify_company_placeholder': 'Enter company name',
            'auth.specify_dept': 'Specify Department',
            'auth.specify_dept_placeholder': 'e.g. Legal, R&D, Support',
            'auth.terms_agreement': 'I agree to survey guidelines and enterprise confidentiality terms.',
            'auth.already_registered_title': 'Registration Already Completed',
            'auth.already_registered_desc': 'You have already created an account with Employee ID',
            'auth.already_registered_signin': 'Proceed to Sign In →',
            'auth.success_title': 'Welcome! Account Created',
            'auth.success_subtitle': 'Your employee account has been registered successfully.',
            'auth.success_empid_eyebrow': 'YOUR UNIQUE EMPLOYEE ID',
            'auth.success_empid_hint': 'Save this ID. You will use this ID + your password to sign in.',
            'auth.success_guideline': '🔒 Registration is one-time only. You do not need to register again.',
            'auth.continue_to_signin': 'CONTINUE TO SIGN IN',
            'auth.forgot_title': 'Password Recovery',
            'auth.forgot_desc': 'Enter your registered work email to receive a reset link.',
            'auth.forgot_remember': 'Remember your password?',
            'auth.reset_title': 'Reset Password',
            'auth.reset_desc': 'Create a new secure password for your account.',
            'auth.reset_new_password': 'New Password',
            'auth.reset_new_password_placeholder': 'Create new password',
            'auth.reset_confirm_password': 'Confirm New Password',
            'auth.reset_confirm_password_placeholder': 'Confirm new password',
            'auth.reset_back_signin': 'Back to Sign In',
            'footer.confidential': 'Confidential & Encrypted',
            'footer.wellbeing': 'Organizational Well-being',
            'footer.rights': 'All rights reserved.'
        },
        ar: {
            'brand.product_title': 'التميز في الأفراد والعمليات',
            'brand.desc': 'تمكين النمو المؤسسي من خلال آراء الموظفين الصادقة، والتحليل الذكي للعمليات، والتميز القيادي.',
            'brand.pillar1_title': 'ملاحظات سرية وآمنة',
            'brand.pillar1_desc': 'تشجيع أصوات الموظفين الحقيقية في بيئة مشفرة تضع الخصوصية أولاً.',
            'brand.pillar2_title': 'تحليلات قابلة للتنفيذ',
            'brand.pillar2_desc': 'تحويل مشاعر وبيانات التقييم إلى أولويات مؤسسية واضحة ومحددة.',
            'brand.pillar3_title': 'نمو تنظيمي مستدام',
            'brand.pillar3_desc': 'تعزيز الأمان النفسي، والمرونة التشغيلية، والتوافق بين فرق العمل.',
            'auth.email_or_empid': 'البريد الإلكتروني أو الرقم الوظيفي',
            'auth.email_or_empid_placeholder': 'أدخل بريدك الإلكتروني أو رقمك الوظيفي',
            'auth.confirm_password': 'تأكيد كلمة المرور',
            'auth.confirm_password_placeholder': 'أعد إدخال كلمة المرور',
            'auth.password_create_placeholder': 'أنشئ كلمة مرور قوية',
            'auth.autogen_badge': 'توليد تلقائي',
            'auth.autogen_placeholder': 'يتم تعيينه تلقائياً عند التسجيل',
            'auth.company_select_default': 'اختر مؤسستك',
            'auth.dept_select_default': 'اختر القسم',
            'auth.other_option': 'أخرى',
            'auth.specify_company': 'حدد اسم المؤسسة',
            'auth.specify_company_placeholder': 'أدخل اسم المؤسسة',
            'auth.specify_dept': 'حدد اسم القسم',
            'auth.specify_dept_placeholder': 'مثال: الشؤون القانونية، الدعم الفني',
            'auth.terms_agreement': 'أوافق على إرشادات الاستبيان وشروط السرية المؤسسية.',
            'auth.already_registered_title': 'تم التسجيل مسبقاً',
            'auth.already_registered_desc': 'لقد قمت بإنشاء حساب بالفعل برقم وظيفي',
            'auth.already_registered_signin': 'الانتقال إلى تسجيل الدخول ←',
            'auth.success_title': 'مرحباً بك! تم إنشاء الحساب',
            'auth.success_subtitle': 'تم تسجيل حساب الموظف الخاص بك بنجاح تام.',
            'auth.success_empid_eyebrow': 'رقمك الوظيفي الفريد',
            'auth.success_empid_hint': 'احفظ هذا الرقم. ستستخدمه مع كلمة المرور لتسجيل الدخول.',
            'auth.success_guideline': '🔒 التسجيل يتم لمرة واحدة فقط. لا حاجة لإعادة التسجيل مجدداً.',
            'auth.continue_to_signin': 'المتابعة لتسجيل الدخول',
            'auth.forgot_title': 'استعادة كلمة المرور',
            'auth.forgot_desc': 'أدخل بريدك الإلكتروني المسجل لاستلام رابط إعادة التعيين.',
            'auth.forgot_remember': 'تذكرت كلمة المرور؟',
            'auth.reset_title': 'إعادة تعيين كلمة المرور',
            'auth.reset_desc': 'أنشئ كلمة مرور جديدة وآمنة لحسابك.',
            'auth.reset_new_password': 'كلمة المرور الجديدة',
            'auth.reset_new_password_placeholder': 'أدخل كلمة المرور الجديدة',
            'auth.reset_confirm_password': 'تأكيد كلمة المرور الجديدة',
            'auth.reset_confirm_password_placeholder': 'أعد إدخال كلمة المرور الجديدة',
            'auth.reset_back_signin': 'العودة لتسجيل الدخول',
            'footer.confidential': 'سري ومشفر للشركات',
            'footer.wellbeing': 'السلامة المهنية والتنظيمية',
            'footer.rights': 'جميع الحقوق محفوظة.'
        },
        ta: {
            'brand.product_title': 'மனிதவளம் மற்றும் செயல்முறை சிறப்பு',
            'brand.desc': 'நேர்மையான பணியாளர் கருத்துக்கள், அறிவார்ந்த செயல்முறை பகுப்பாய்வு மற்றும் தலைமைத்துவ சிறப்பு மூலம் நிறுவன வளர்ச்சியை மேம்படுத்துகிறது.',
            'brand.pillar1_title': 'ரகசியமான கருத்துப் பதிவு',
            'brand.pillar1_desc': 'மறைகுறியாக்கப்பட்ட, தனியுரிமை சார்ந்த சூழலில் நம்பகமான பணியாளர் குரல்களை ஊக்குவித்தல்.',
            'brand.pillar2_title': 'செயல்படுத்தக்கூடிய நுண்ணறிவு',
            'brand.pillar2_desc': 'கருத்துக்கள் மற்றும் மதிப்பீட்டுத் தரவை தெளிவான நிறுவன முன்னுரிமைகளாக மாற்றுதல்.',
            'brand.pillar3_title': 'நிலையான வளர்ச்சி',
            'brand.pillar3_desc': 'உளவியல் பாதுகாப்பு, செயல்பாட்டு உறுதித்தன்மை மற்றும் குழு ஒருங்கிணைப்பை வளர்த்தல்.',
            'auth.email_or_empid': 'மின்னஞ்சல் அல்லது பணியாளர் எண்',
            'auth.email_or_empid_placeholder': 'உங்கள் மின்னஞ்சல் அல்லது பணியாளர் எண்ணை உள்ளிடவும்',
            'auth.confirm_password': 'கடவுச்சொல்லை உறுதிப்படுத்துக',
            'auth.confirm_password_placeholder': 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
            'auth.password_create_placeholder': 'புதிய கடவுச்சொல்லை உருவாக்கவும்',
            'auth.autogen_badge': 'தானியங்கி உருவாக்கம்',
            'auth.autogen_placeholder': 'பதிவின் போது ஒதுக்கப்படும்',
            'auth.company_select_default': 'உங்கள் நிறுவனத்தை தேர்ந்தெடுக்கவும்',
            'auth.dept_select_default': 'உங்கள் துறையை தேர்ந்தெடுக்கவும்',
            'auth.other_option': 'மற்றவை',
            'auth.specify_company': 'நிறுவனத்தின் பெயரை குறிப்பிடவும்',
            'auth.specify_company_placeholder': 'நிறுவன பெயரை உள்ளிடவும்',
            'auth.specify_dept': 'துறையை குறிப்பிடவும்',
            'auth.specify_dept_placeholder': 'எ.கா: சட்டம், ஆராய்ச்சி, ஆதரவு',
            'auth.terms_agreement': 'கணிப்பு வழிகாட்டுதல்கள் மற்றும் நிறுவன ரகசியத்தன்மை விதிமுறைகளை ஒப்புக்கொள்கிறேன்.',
            'auth.already_registered_title': 'பதிவு ஏற்கனவே முடிந்தது',
            'auth.already_registered_desc': 'நீங்கள் ஏற்கனவே பணியாளர் எண்ணுடன் கணக்கை உருவாக்கியுள்ளீர்கள்',
            'auth.already_registered_signin': 'உள்நுழைவிற்கு செல்க →',
            'auth.success_title': 'வரவேற்கிறோம்! கணக்கு உருவாக்கப்பட்டது',
            'auth.success_subtitle': 'உங்கள் பணியாளர் கணக்கு வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.',
            'auth.success_empid_eyebrow': 'உங்கள் தனிப்பட்ட பணியாளர் எண்',
            'auth.success_empid_hint': 'இந்த எண்ணை குறித்துக்கொள்ளவும். உள்நுழைய இதுவே தேவைப்படும்.',
            'auth.success_guideline': '🔒 பதிவு ஒருமுறை மட்டுமே. மீண்டும் பதிவு செய்ய தேவையில்லை.',
            'auth.continue_to_signin': 'உள்நுழைவிற்கு தொடர்க',
            'auth.forgot_title': 'கடவுச்சொல் மீட்பு',
            'auth.forgot_desc': 'இணைப்பு பெற உங்கள் பதிவுசெய்த மின்னஞ்சலை உள்ளிடவும்.',
            'auth.forgot_remember': 'கடவுச்சொல் நினைவிருக்கிறதா?',
            'auth.reset_title': 'கடவுச்சொல் மாற்றுதல்',
            'auth.reset_desc': 'உங்கள் கணக்கிற்கு புதிய பாதுகாப்பான கடவுச்சொல்லை உருவாக்கவும்.',
            'auth.reset_new_password': 'புதிய கடவுச்சொல்',
            'auth.reset_new_password_placeholder': 'புதிய கடவுச்சொல்லை உள்ளிடவும்',
            'auth.reset_confirm_password': 'புதிய கடவுச்சொல்லை உறுதிப்படுத்துக',
            'auth.reset_confirm_password_placeholder': 'புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
            'auth.reset_back_signin': 'உள்நுழைவிற்கு திரும்புக',
            'footer.confidential': 'ரகசியமானது மற்றும் பாதுகாப்பானது',
            'footer.wellbeing': 'நிறுவன நல்வாழ்வு',
            'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
        },
        hi: {
            'brand.product_title': 'व्यक्ति एवं प्रक्रिया उत्कृष्टता',
            'brand.desc': 'सच्ची कर्मचारी प्रतिक्रिया, बुद्धिमान परिचालन विश्लेषण और नेतृत्व उत्कृष्टता के माध्यम से संगठनात्मक विकास को सशक्त बनाना।',
            'brand.pillar1_title': 'गोपनीय प्रतिक्रिया',
            'brand.pillar1_desc': 'एन्क्रिप्टेड और गोपनीयता-प्रथम परिवेश में प्रामाणिक कार्यस्थल आवाज़ों को प्रोत्साहित करना।',
            'brand.pillar2_title': 'कार्रवाई योग्य अंतर्दृष्टि',
            'brand.pillar2_desc': 'कर्मचारी भावनाओं और मूल्यांकन डेटा को स्पष्ट संगठनात्मक प्राथमिकताओं में बदलना।',
            'brand.pillar3_title': 'सतत संगठनात्मक विकास',
            'brand.pillar3_desc': 'मनोवैज्ञानिक सुरक्षा, परिचालन लचीलापन और टीम समन्वय को बढ़ावा देना।',
            'auth.email_or_empid': 'ईमेल या कर्मचारी आईडी',
            'auth.email_or_empid_placeholder': 'अपना ईमेल या कर्मचारी आईडी दर्ज करें',
            'auth.confirm_password': 'पासवर्ड की पुष्टि करें',
            'auth.confirm_password_placeholder': 'पासवर्ड दोबारा दर्ज करें',
            'auth.password_create_placeholder': 'नया पासवर्ड बनाएं',
            'auth.autogen_badge': 'स्वतः जनरेटेड',
            'auth.autogen_placeholder': 'पंजीकरण पर आवंटित',
            'auth.company_select_default': 'अपनी कंपनी चुनें',
            'auth.dept_select_default': 'अपना विभाग चुनें',
            'auth.other_option': 'अन्य',
            'auth.specify_company': 'कंपनी का नाम निर्दिष्ट करें',
            'auth.specify_company_placeholder': 'कंपनी का नाम दर्ज करें',
            'auth.specify_dept': 'विभाग निर्दिष्ट करें',
            'auth.specify_dept_placeholder': 'उदा. कानूनी, अनुसंधान, सहायता',
            'auth.terms_agreement': 'मैं सर्वेक्षण दिशानिर्देशों और गोपनीयता शर्तों से सहमत हूं।',
            'auth.already_registered_title': 'पंजीकरण पहले ही पूर्ण हो चुका है',
            'auth.already_registered_desc': 'आपने पहले ही कर्मचारी आईडी के साथ खाता बना लिया है',
            'auth.already_registered_signin': 'साइन इन पर जाएं →',
            'auth.success_title': 'स्वागत है! खाता बना दिया गया',
            'auth.success_subtitle': 'आपका कर्मचारी खाता सफलतापूर्वक पंजीकृत हो गया है।',
            'auth.success_empid_eyebrow': 'आपकी विशिष्ट कर्मचारी आईडी',
            'auth.success_empid_hint': 'इस आईडी को सुरक्षित रखें। साइन इन करने के लिए इसकी आवश्यकता होगी।',
            'auth.success_guideline': '🔒 पंजीकरण केवल एक बार होता है। दोबारा पंजीकरण की आवश्यकता नहीं है।',
            'auth.continue_to_signin': 'साइन इन के लिए आगे बढ़ें',
            'auth.forgot_title': 'पासवर्ड पुनर्प्राप्ति',
            'auth.forgot_desc': 'रीसेट लिंक प्राप्त करने के लिए अपना पंजीकृत ईमेल दर्ज करें।',
            'auth.forgot_remember': 'अपना पासवर्ड याद है?',
            'auth.reset_title': 'पासवर्ड रीसेट करें',
            'auth.reset_desc': 'अपने खाते के लिए एक नया सुरक्षित पासवर्ड बनाएं।',
            'auth.reset_new_password': 'नया पासवर्ड',
            'auth.reset_new_password_placeholder': 'नया पासवर्ड दर्ज करें',
            'auth.reset_confirm_password': 'नए पासवर्ड की पुष्टि करें',
            'auth.reset_confirm_password_placeholder': 'नया पासवर्ड दोबारा दर्ज करें',
            'auth.reset_back_signin': 'साइन इन पर वापस जाएं',
            'footer.confidential': 'गोपनीय एवं एन्क्रिप्टेड',
            'footer.wellbeing': 'संगठनात्मक कल्याण',
            'footer.rights': 'सर्वाधिकार सुरक्षित।',
        },
        es: {
            'brand.product_title': 'EXCELENCIA EN PERSONAS Y PROCESOS',
            'brand.desc': 'Potenciando el crecimiento organizacional mediante retroalimentación auténtica, síntesis operativa inteligente y excelencia en liderazgo.',
            'brand.pillar1_title': 'Retroalimentación Confidencial',
            'brand.pillar1_desc': 'Fomentando opiniones laborales auténticas en un entorno cifrado y enfocado en la privacidad.',
            'brand.pillar2_title': 'Inteligencia Accionable',
            'brand.pillar2_desc': 'Transformando percepciones y datos de evaluación en prioridades operativas claras.',
            'brand.pillar3_title': 'Crecimiento Sostenible',
            'brand.pillar3_desc': 'Fomentando la seguridad psicológica, resiliencia operativa y alineación de equipos.',
            'auth.email_or_empid': 'Correo electrónico o ID de empleado',
            'auth.email_or_empid_placeholder': 'Ingrese su correo o ID de empleado',
            'auth.confirm_password': 'Confirmar contraseña',
            'auth.confirm_password_placeholder': 'Confirme su contraseña',
            'auth.password_create_placeholder': 'Cree una contraseña',
            'auth.autogen_badge': 'AUTOGENERADO',
            'auth.autogen_placeholder': 'Asignado en el registro',
            'auth.company_select_default': 'Seleccione su empresa',
            'auth.dept_select_default': 'Seleccione su departamento',
            'auth.other_option': 'Otro',
            'auth.specify_company': 'Especifique el nombre de la empresa',
            'auth.specify_company_placeholder': 'Ingrese el nombre de la empresa',
            'auth.specify_dept': 'Especifique el departamento',
            'auth.specify_dept_placeholder': 'ej. Legal, I+D, Soporte',
            'auth.terms_agreement': 'Acepto las directrices de la encuesta y los términos de confidencialidad.',
            'auth.already_registered_title': 'Registro ya completado',
            'auth.already_registered_desc': 'Ya ha creado una cuenta con el ID de empleado',
            'auth.already_registered_signin': 'Ir a Iniciar Sesión →',
            'auth.success_title': '¡Bienvenido! Cuenta creada',
            'auth.success_subtitle': 'Su cuenta de empleado ha sido registrada con éxito.',
            'auth.success_empid_eyebrow': 'SU ID ÚNICO DE EMPLEADO',
            'auth.success_empid_hint': 'Guarde este ID. Lo utilizará junto con su contraseña para iniciar sesión.',
            'auth.success_guideline': '🔒 El registro es de una sola vez. No necesita registrarse de nuevo.',
            'auth.continue_to_signin': 'CONTINUAR A INICIAR SESIÓN',
            'auth.forgot_title': 'Recuperación de contraseña',
            'auth.forgot_desc': 'Ingrese su correo registrado para recibir un enlace de restablecimiento.',
            'auth.forgot_remember': '¿Recuerda su contraseña?',
            'auth.reset_title': 'Restablecer contraseña',
            'auth.reset_desc': 'Cree una nueva contraseña segura para su cuenta.',
            'auth.reset_new_password': 'Nueva contraseña',
            'auth.reset_new_password_placeholder': 'Cree una nueva contraseña',
            'auth.reset_confirm_password': 'Confirmar nueva contraseña',
            'auth.reset_confirm_password_placeholder': 'Confirme la nueva contraseña',
            'auth.reset_back_signin': 'Volver a Iniciar Sesión',
            'footer.confidential': 'Confidencial y Cifrado',
            'footer.wellbeing': 'Bienestar Organizacional',
            'footer.rights': 'Todos los derechos reservados.'
        },
        fr: {
            'brand.product_title': 'EXCELLENCE DES PERSONNES ET DES PROCESSUS',
            'brand.desc': 'Favoriser la croissance organisationnelle grâce aux retours authentiques, à la synthèse opérationnelle intelligente et à l\'excellence managériale.',
            'brand.pillar1_title': 'Commentaires Confidentiels',
            'brand.pillar1_desc': 'Encourager une parole authentique dans un environnement chiffré et respectueux de la confidentialité.',
            'brand.pillar2_title': 'Renseignements Exploitables',
            'brand.pillar2_desc': 'Transformer les données d\'évaluation en priorités organisationnelles claires.',
            'brand.pillar3_title': 'Croissance Durable',
            'brand.pillar3_desc': 'Favoriser la sécurité psychologique, la résilience opérationnelle et la cohésion d\'équipe.',
            'auth.email_or_empid': 'E-mail ou ID employé',
            'auth.email_or_empid_placeholder': 'Entrez votre e-mail ou ID employé',
            'auth.confirm_password': 'Confirmer le mot de passe',
            'auth.confirm_password_placeholder': 'Confirmez le mot de passe',
            'auth.password_create_placeholder': 'Créez un mot de passe',
            'auth.autogen_badge': 'AUTO-GÉNÉRÉ',
            'auth.autogen_placeholder': 'Attribué à l\'inscription',
            'auth.company_select_default': 'Sélectionnez votre entreprise',
            'auth.dept_select_default': 'Sélectionnez votre département',
            'auth.other_option': 'Autre',
            'auth.specify_company': 'Précisez le nom de l\'entreprise',
            'auth.specify_company_placeholder': 'Entrez le nom de l\'entreprise',
            'auth.specify_dept': 'Précisez le département',
            'auth.specify_dept_placeholder': 'ex. Juridique, R&D, Support',
            'auth.terms_agreement': 'J\'accepte les directives du sondage et les termes de confidentialité.',
            'auth.already_registered_title': 'Inscription déjà effectuée',
            'auth.already_registered_desc': 'Vous avez déjà créé un compte avec l\'ID employé',
            'auth.already_registered_signin': 'Passer à la connexion →',
            'auth.success_title': 'Bienvenue ! Compte créé',
            'auth.success_subtitle': 'Votre compte employé a été enregistré avec succès.',
            'auth.success_empid_eyebrow': 'VOTRE ID EMPLOYÉ UNIQUE',
            'auth.success_empid_hint': 'Conservez cet identifiant. Vous l\'utiliserez pour vous connecter.',
            'auth.success_guideline': '🔒 L\'inscription est unique. Vous n\'avez pas besoin de vous réinscrire.',
            'auth.continue_to_signin': 'CONTINUER VERS LA CONNEXION',
            'auth.forgot_title': 'Récupération de mot de passe',
            'auth.forgot_desc': 'Entrez votre e-mail professionnel pour recevoir un lien de réinitialisation.',
            'auth.forgot_remember': 'Vous vous souvenez de votre mot de passe ?',
            'auth.reset_title': 'Réinitialiser le mot de passe',
            'auth.reset_desc': 'Créez un nouveau mot de passe sécurisé pour votre compte.',
            'auth.reset_new_password': 'Nouveau mot de passe',
            'auth.reset_new_password_placeholder': 'Entrez le nouveau mot de passe',
            'auth.reset_confirm_password': 'Confirmer le nouveau mot de passe',
            'auth.reset_confirm_password_placeholder': 'Confirmez le nouveau mot de passe',
            'auth.reset_back_signin': 'Retour à la connexion',
            'footer.confidential': 'Confidentiel et Chiffré',
            'footer.wellbeing': 'Bien-être Organisationnel',
            'footer.rights': 'Tous droits réservés.'
        },
        de: {
            'brand.product_title': 'MENSCH & PROZESS EXZELLENZ',
            'brand.desc': 'Förderung des Unternehmenswachstums durch authentisches Mitarbeiterfeedback, intelligente Prozessanalyse und Führungsqualität.',
            'brand.pillar1_title': 'Vertrauliches Feedback',
            'brand.pillar1_desc': 'Ermutigung zu offenen Meinungen in einer verschlüsselten, datenschutzorientierten Umgebung.',
            'brand.pillar2_title': 'Handlungsorientierte Erkenntnisse',
            'brand.pillar2_desc': 'Umwandlung von Feedback-Daten in klare Unternehmensprioritäten.',
            'brand.pillar3_title': 'Nachhaltiges Wachstum',
            'brand.pillar3_desc': 'Förderung von psychologischer Sicherheit, Belastbarkeit und Teamabstimmung.',
            'auth.email_or_empid': 'E-Mail oder Mitarbeiter-ID',
            'auth.email_or_empid_placeholder': 'E-Mail oder Mitarbeiter-ID eingeben',
            'auth.confirm_password': 'Passwort bestätigen',
            'auth.confirm_password_placeholder': 'Passwort bestätigen',
            'auth.password_create_placeholder': 'Passwort erstellen',
            'auth.autogen_badge': 'AUTOMATISCH GENERIERT',
            'auth.autogen_placeholder': 'Wird bei Registrierung zugewiesen',
            'auth.company_select_default': 'Wählen Sie Ihr Unternehmen',
            'auth.dept_select_default': 'Wählen Sie Ihre Abteilung',
            'auth.other_option': 'Andere',
            'auth.specify_company': 'Unternehmensname angeben',
            'auth.specify_company_placeholder': 'Unternehmensname eingeben',
            'auth.specify_dept': 'Abteilung angeben',
            'auth.specify_dept_placeholder': 'z.B. Recht, F&E, Support',
            'auth.terms_agreement': 'Ich stimme den Umfragerichtlinien und Vertraulichkeitsbedingungen zu.',
            'auth.already_registered_title': 'Registrierung bereits abgeschlossen',
            'auth.already_registered_desc': 'Sie haben bereits ein Konto mit der Mitarbeiter-ID erstellt',
            'auth.already_registered_signin': 'Weiter zur Anmeldung →',
            'auth.success_title': 'Willkommen! Konto erstellt',
            'auth.success_subtitle': 'Ihr Mitarbeiterkonto wurde erfolgreich registriert.',
            'auth.success_empid_eyebrow': 'IHRE EINDEUTIGE MITARBEITER-ID',
            'auth.success_empid_hint': 'Speichern Sie diese ID. Sie benötigen sie für die Anmeldung.',
            'auth.success_guideline': '🔒 Die Registrierung ist einmalig. Eine erneute Registrierung ist nicht erforderlich.',
            'auth.continue_to_signin': 'WEITER ZUR ANMELDUNG',
            'auth.forgot_title': 'Passwort-Wiederherstellung',
            'auth.forgot_desc': 'Geben Sie Ihre Arbeits-E-Mail-Adresse ein, um einen Link zu erhalten.',
            'auth.forgot_remember': 'Passwort wieder eingefallen?',
            'auth.reset_title': 'Passwort zurücksetzen',
            'auth.reset_desc': 'Erstellen Sie ein neues sicheres Passwort für Ihr Konto.',
            'auth.reset_new_password': 'Neues Passwort',
            'auth.reset_new_password_placeholder': 'Neues Passwort eingeben',
            'auth.reset_confirm_password': 'Neues Passwort bestätigen',
            'auth.reset_confirm_password_placeholder': 'Neues Passwort bestätigen',
            'auth.reset_back_signin': 'Zurück zur Anmeldung',
            'footer.confidential': 'Vertraulich & Verschlüsselt',
            'footer.wellbeing': 'Organisatorisches Wohlbefinden',
            'footer.rights': 'Alle Rechte vorbehalten.'
        },
        zh: {
            'brand.product_title': '卓越人才与流程',
            'brand.desc': '通过真实的员工反馈、智能的运营综合分析与卓越的领导力推动组织成长。',
            'brand.pillar1_title': '完全保密反馈',
            'brand.pillar1_desc': '在加密且注重隐私的环境中鼓励真实的职场心声。',
            'brand.pillar2_title': '可落地的洞察',
            'brand.pillar2_desc': '将反馈和评估数据转化为清晰的组织优先事项。',
            'brand.pillar3_title': '持续健康发展',
            'brand.pillar3_desc': '培养心理安全感、运营韧性与跨团队协同。',
            'auth.email_or_empid': '电子邮箱或员工工号',
            'auth.email_or_empid_placeholder': '输入您的电子邮箱或员工工号',
            'auth.confirm_password': '确认密码',
            'auth.confirm_password_placeholder': '请再次输入密码',
            'auth.password_create_placeholder': '创建安全密码',
            'auth.autogen_badge': '自动生成',
            'auth.autogen_placeholder': '注册时自动分配',
            'auth.company_select_default': '选择您的公司',
            'auth.dept_select_default': '选择您的部门',
            'auth.other_option': '其他',
            'auth.specify_company': '注明公司名称',
            'auth.specify_company_placeholder': '输入公司名称',
            'auth.specify_dept': '注明部门名称',
            'auth.specify_dept_placeholder': '例如：法务、研发、客服',
            'auth.terms_agreement': '我同意调查指引与企业保密条款。',
            'auth.already_registered_title': '已完成注册',
            'auth.already_registered_desc': '您已创建员工工号为以下信息的账户',
            'auth.already_registered_signin': '前往登录 →',
            'auth.success_title': '欢迎！账户创建成功',
            'auth.success_subtitle': '您的员工档案已成功登记。',
            'auth.success_empid_eyebrow': '您的唯一员工工号',
            'auth.success_empid_hint': '请妥善保存此工号，您将使用它及密码登录。',
            'auth.success_guideline': '🔒 注册只需进行一次，无需重复注册。',
            'auth.continue_to_signin': '继续前往登录',
            'auth.forgot_title': '找回密码',
            'auth.forgot_desc': '输入您的注册工作邮箱以接收重置链接。',
            'auth.forgot_remember': '想起密码了？',
            'auth.reset_title': '重置密码',
            'auth.reset_desc': '为您的账户创建新的安全密码。',
            'auth.reset_new_password': '新密码',
            'auth.reset_new_password_placeholder': '输入新密码',
            'auth.reset_confirm_password': '确认新密码',
            'auth.reset_confirm_password_placeholder': '请再次输入新密码',
            'auth.reset_back_signin': '返回登录',
            'footer.confidential': '保密与企业加密',
            'footer.wellbeing': '组织健康发展',
            'footer.rights': '保留所有权利。',
        },
        ja: {
            'brand.product_title': 'ピープル＆プロセス・エクセレンス',
            'brand.desc': '従業員の率直なフィードバック、インテリジェントな業務分析、卓越したリーダーシップを通じて組織の成長を推進します。',
            'brand.pillar1_title': '完全機密フィードバック',
            'brand.pillar1_desc': '暗号化されたプライバシー第一の環境で、率直な意見を奨励します。',
            'brand.pillar2_title': '実用的なインサイト',
            'brand.pillar2_desc': '従業員の意識と評価データを明確な組織の優先課題へと変換します。',
            'brand.pillar3_title': '持続可能な成長',
            'brand.pillar3_desc': '心理的安全性の確保、組織のレジリエンス、チーム間の協調を育みます。',
            'auth.email_or_empid': 'メールアドレスまたは社員ID',
            'auth.email_or_empid_placeholder': 'メールアドレスまたは社員IDを入力',
            'auth.confirm_password': 'パスワードの確認',
            'auth.confirm_password_placeholder': 'パスワードを再入力',
            'auth.password_create_placeholder': 'パスワードを作成',
            'auth.autogen_badge': '自動生成',
            'auth.autogen_placeholder': '登録時に自動付与',
            'auth.company_select_default': '企業を選択してください',
            'auth.dept_select_default': '部署を選択してください',
            'auth.other_option': 'その他',
            'auth.specify_company': '企業名を明記',
            'auth.specify_company_placeholder': '企業名を入力してください',
            'auth.specify_dept': '部署名を明記',
            'auth.specify_dept_placeholder': '例：法務、研究開発、サポート',
            'auth.terms_agreement': '調査ガイドラインおよび機密保持規約に同意します。',
            'auth.already_registered_title': '登録は既に完了しています',
            'auth.already_registered_desc': '既に以下の社員IDでアカウントが作成されています',
            'auth.already_registered_signin': 'サインインへ進む →',
            'auth.success_title': 'ようこそ！アカウントが作成されました',
            'auth.success_subtitle': '社員プロファイルが正常に登録されました。',
            'auth.success_empid_eyebrow': 'あなたの固有の社員ID',
            'auth.success_empid_hint': 'このIDを保存してください。サインイン時に必要となります。',
            'auth.success_guideline': '🔒 登録は1回のみです。再登録の必要はありません。',
            'auth.continue_to_signin': 'サインインを続ける',
            'auth.forgot_title': 'パスワードの再設定',
            'auth.forgot_desc': '登録済みの勤務先メールアドレスを入力して再設定リンクを受信してください。',
            'auth.forgot_remember': 'パスワードを思い出しましたか？',
            'auth.reset_title': 'パスワードのリセット',
            'auth.reset_desc': 'アカウント用の新しい安全なパスワードを作成してください。',
            'auth.reset_new_password': '新しいパスワード',
            'auth.reset_new_password_placeholder': '新しいパスワードを入力',
            'auth.reset_confirm_password': '新しいパスワードの確認',
            'auth.reset_confirm_password_placeholder': '新しいパスワードを再入力',
            'auth.reset_back_signin': 'サインインに戻る',
            'footer.confidential': '機密保持および暗号化保護',
            'footer.wellbeing': '組織的ウェルビーイング',
            'footer.rights': '無断転載を禁じます。'
        }
    };

    // Merge enterprise extensions into base TRANSLATIONS
    for (const [lang, keys] of Object.entries(ENTERPRISE_EXTENSIONS)) {
        if (!TRANSLATIONS[lang]) TRANSLATIONS[lang] = {};
        Object.assign(TRANSLATIONS[lang], keys);
    }

    // 2.2 Bidirectional Key Aliases for maximum compatibility across old & new views
    const KEY_ALIASES = {
        'brand.product_title': 'welcome.badge',
        'auth.sign_in_tab': 'auth.tab_signin',
        'auth.create_account_tab': 'auth.tab_signup',
        'auth.welcome_back': 'auth.title_signin',
        'auth.sign_in_desc': 'auth.subtitle_signin',
        'auth.sign_in_btn': 'auth.btn_signin',
        'auth.create_account_btn': 'auth.btn_signup',
        'auth.new_to_platform': 'auth.no_account',
        'auth.create_account_action': 'auth.register_here',
        'auth.already_have_account': 'auth.already_account',
        'auth.sign_in_action': 'auth.back_to_signin',
        'auth.forgot_password': 'auth.forgot_password_link',
        'auth.full_name': 'auth.fullname',
        'auth.full_name_placeholder': 'auth.fullname_placeholder',
        'auth.work_email': 'auth.email',
        'auth.work_email_placeholder': 'auth.email_placeholder',
        'auth.create_account_title': 'auth.title_signup',
        'auth.create_account_desc': 'auth.subtitle_signup',
        'auth.forgot_submit': 'auth.btn_send_reset',
        'auth.reset_submit': 'auth.btn_reset',
        'auth.confidential_note': 'auth.confidential_badge'
    };

    const REVERSE_KEY_ALIASES = Object.fromEntries(
        Object.entries(KEY_ALIASES).map(([k, v]) => [v, k])
    );

    // 3. Active State Management
    let currentLanguage = 'en';
    let allowedLanguages = ['en']; // Configured per company!
    const eventListeners = [];

    const I18n = {
        /**
         * Initialize the i18n engine with optional company configurations.
         */
        init(options = {}) {
            // Priority: 1. Passed in allowed languages, 2. Stored preferences, 3. Company default
            if (options.allowedLanguages && Array.isArray(options.allowedLanguages) && options.allowedLanguages.length > 0) {
                allowedLanguages = options.allowedLanguages;
            } else {
                allowedLanguages = ['en'];
            }

            // Stored language preference
            let storedLang = null;
            try {
                storedLang = localStorage.getItem('visteria_lang');
            } catch (e) {}

            let targetLang = 'en';
            if (options.defaultLanguage && allowedLanguages.includes(options.defaultLanguage)) {
                targetLang = options.defaultLanguage;
            } else if (storedLang && allowedLanguages.includes(storedLang)) {
                targetLang = storedLang;
            } else if (allowedLanguages.length > 0) {
                targetLang = allowedLanguages[0];
            }

            this.setLanguage(targetLang, false);
            return currentLanguage;
        },

        /**
         * Get all supported languages from the global registry.
         */
        getSupportedLanguages() {
            return SYSTEM_LANGUAGES;
        },

        /**
         * Get metadata for a specific language code.
         */
        getLanguageMeta(code) {
            return SYSTEM_LANGUAGES.find(l => l.code === code) || {
                code,
                name: code.toUpperCase(),
                nativeName: code.toUpperCase(),
                direction: 'ltr',
                flag: '🌐'
            };
        },

        /**
         * Set the current active language and update the document DOM direction and labels.
         */
        setLanguage(langCode, triggerEvents = true) {
            const meta = this.getLanguageMeta(langCode);
            currentLanguage = meta.code;

            try {
                localStorage.setItem('visteria_lang', currentLanguage);
            } catch (e) {}

            // Set document attributes
            document.documentElement.lang = currentLanguage;
            document.documentElement.dir = meta.direction;

            if (meta.direction === 'rtl') {
                document.documentElement.classList.add('is-rtl');
                document.body?.classList.add('is-rtl');
            } else {
                document.documentElement.classList.remove('is-rtl');
                document.body?.classList.remove('is-rtl');
            }

            // Apply translations to all matching DOM nodes
            this.applyTranslations();

            // Notify listeners
            if (triggerEvents) {
                eventListeners.forEach(fn => {
                    try { fn(currentLanguage, meta); } catch (err) { console.warn('i18n listener error:', err); }
                });

                // Dispatch global DOM custom event
                window.dispatchEvent(new CustomEvent('visteria:languageChanged', {
                    detail: { language: currentLanguage, meta }
                }));
            }

            return currentLanguage;
        },

        /**
         * Returns current language code (e.g. 'en', 'ar', 'ta', 'hi').
         */
        getLanguage() {
            return currentLanguage;
        },

        /**
         * Alias for getLanguage() ensuring full compatibility with survey and other modules.
         */
        getCurrentLanguage() {
            return currentLanguage;
        },

        /**
         * Returns whether current active language is right-to-left.
         */
        isRTL() {
            return this.getLanguageMeta(currentLanguage).direction === 'rtl';
        },

        isRtl() {
            return this.isRTL();
        },

        /**
         * Translate a key into the active language, falling back to English.
         * Never displays internal raw keys.
         */
        t(key, params = {}) {
            if (!key) return '';

            const langDict = TRANSLATIONS[currentLanguage] || {};
            const enDict = TRANSLATIONS.en || {};

            let text = langDict[key] ?? enDict[key];

            // Check alias mapping if key was not found directly
            if (text === undefined || text === null) {
                const alias = KEY_ALIASES[key] || REVERSE_KEY_ALIASES[key];
                if (alias) {
                    text = langDict[alias] ?? enDict[alias];
                }
            }

            // If completely missing, generate friendly human-readable fallback (never raw internal key)
            if (text === undefined || text === null) {
                const parts = key.split('.');
                const lastPart = parts[parts.length - 1] || key;
                text = lastPart.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }

            // Interpolate {param} variables
            if (params && typeof params === 'object') {
                for (const [k, v] of Object.entries(params)) {
                    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
                }
            }

            return text;
        },

        /**
         * Standardized 5-point Likert option catalogs for all 9 supported languages.
         */
        _likertScales: {
            en: [
                { value: '1', score: 1, label: 'Strongly Disagree' },
                { value: '2', score: 2, label: 'Disagree' },
                { value: '3', score: 3, label: 'Neutral' },
                { value: '4', score: 4, label: 'Agree' },
                { value: '5', score: 5, label: 'Strongly Agree' }
            ],
            ta: [
                { value: '1', score: 1, label: 'முற்றிலும் உடன்படவில்லை' },
                { value: '2', score: 2, label: 'உடன்படவில்லை' },
                { value: '3', score: 3, label: 'நடுநிலை' },
                { value: '4', score: 4, label: 'உடன்படுகிறேன்' },
                { value: '5', score: 5, label: 'முற்றிலும் உடன்படுகிறேன்' }
            ],
            hi: [
                { value: '1', score: 1, label: 'दृढ़ता से असहमत' },
                { value: '2', score: 2, label: 'असहमत' },
                { value: '3', score: 3, label: 'तटस्थ' },
                { value: '4', score: 4, label: 'सहमत' },
                { value: '5', score: 5, label: 'दृढ़ता से सहमत' }
            ],
            ar: [
                { value: '1', score: 1, label: 'غير موافق بشدة' },
                { value: '2', score: 2, label: 'غير موافق' },
                { value: '3', score: 3, label: 'محايد' },
                { value: '4', score: 4, label: 'موافق' },
                { value: '5', score: 5, label: 'موافق بشدة' }
            ],
            es: [
                { value: '1', score: 1, label: 'Totalmente en desacuerdo' },
                { value: '2', score: 2, label: 'En desacuerdo' },
                { value: '3', score: 3, label: 'Neutral' },
                { value: '4', score: 4, label: 'De acuerdo' },
                { value: '5', score: 5, label: 'Totalmente de acuerdo' }
            ],
            fr: [
                { value: '1', score: 1, label: 'Tout à fait en désaccord' },
                { value: '2', score: 2, label: 'En désaccord' },
                { value: '3', score: 3, label: 'Neutre' },
                { value: '4', score: 4, label: "D'accord" },
                { value: '5', score: 5, label: "Tout à fait d'accord" }
            ],
            de: [
                { value: '1', score: 1, label: 'Stimme überhaupt nicht zu' },
                { value: '2', score: 2, label: 'Stimme nicht zu' },
                { value: '3', score: 3, label: 'Neutral' },
                { value: '4', score: 4, label: 'Stimme zu' },
                { value: '5', score: 5, label: 'Stimme voll und ganz zu' }
            ],
            zh: [
                { value: '1', score: 1, label: '强烈反对' },
                { value: '2', score: 2, label: '反对' },
                { value: '3', score: 3, label: '中立' },
                { value: '4', score: 4, label: '同意' },
                { value: '5', score: 5, label: '强烈同意' }
            ],
            ja: [
                { value: '1', score: 1, label: '全く同意しない' },
                { value: '2', score: 2, label: '同意しない' },
                { value: '3', score: 3, label: 'どちらでもない' },
                { value: '4', score: 4, label: '同意する' },
                { value: '5', score: 5, label: '強く同意する' }
            ]
        },

        /**
         * Comprehensive Built-in Question & Metadata Translations for all 9 languages.
         * Guarantees that survey questions never revert to English when another language is selected.
         */
        _builtinQuestions: {
            theworkplaceismaintainedcleanandhygienic: {
                ta: { text: "பணியிடம் தூய்மையாகவும் சுகாதாரமாகவும் பராமரிக்கப்படுகிறது.", hint: "உங்கள் பணியிடத்தின் தினசரி தூய்மை மற்றும் சுகாதார வசதிகளைப் பற்றி சிந்தியுங்கள்." },
                hi: { text: "कार्यस्थल को स्वच्छ और स्वच्छ रखा जाता है।", hint: "अपने कार्यस्थल की दैनिक स्वच्छता और सफाई व्यवस्था पर विचार करें।" },
                ar: { text: "مكان العمل نظيف وصحي ويتم الحفاظ عليه جيداً.", hint: "فكر في النظافة اليومية وبيئة العمل الصحية في مكتبك." },
                es: { text: "El lugar de trabajo se mantiene limpio e higiénico.", hint: "Reflexione sobre la limpieza diaria y los estándares de higiene en su lugar de trabajo." },
                fr: { text: "Le lieu de travail est maintenu propre et hygiénique.", hint: "Réfléchissez à la propreté quotidienne et aux normes d'hygiène sur votre lieu de travail." },
                de: { text: "Der Arbeitsplatz wird sauber und hygienisch gehalten.", hint: "Denken Sie an die tägliche Sauberkeit und die Hygienestandards an Ihrem Arbeitsplatz." },
                zh: { text: "工作场所保持清洁和卫生。", hint: "请结合您工作环境的日常清洁和卫生标准进行反思。" },
                ja: { text: "職場は清潔で衛生的に保たれている。", hint: "職場の日常的な清掃状況や衛生基準について振り返ってください。" }
            },
            workstationsandcommonareasarecleanedregularly: {
                ta: { text: "பணிமேசைகள் மற்றும் பொது இடங்கள் தவறாமல் சுத்தம் செய்யப்படுகின்றன.", hint: "மேசைகள், சந்திப்பு அறைகள் மற்றும் நடைபாதைகளின் தூய்மையை மதிப்பீடு செய்யுங்கள்." },
                hi: { text: "वर्कस्टेशन और सामान्य क्षेत्रों की नियमित रूप से सफाई की जाती है।", hint: "डेस्क, मीटिंग रूम और गलियारों की नियमित सफाई पर ध्यान दें।" },
                ar: { text: "يتم تنظيف محطات العمل والمناطق المشتركة بانتظام.", hint: "قم بتقييم نظافة المكاتب وقاعات الاجتماعات والممرات المشتركة." },
                es: { text: "Las estaciones de trabajo y las áreas comunes se limpian regularmente.", hint: "Evalúe la limpieza regular de escritorios, salas de reuniones y pasillos." },
                fr: { text: "Les postes de travail et les espaces communs sont nettoyés régulièrement.", hint: "Évaluez la régularité du nettoyage des bureaux et des espaces partagés." },
                de: { text: "Arbeitsplätze und Gemeinschaftsbereiche werden regelmäßig gereinigt.", hint: "Bewerten Sie die regelmäßige Reinigung von Tischen, Besprechungsräumen und Fluren." },
                zh: { text: "工位和公共区域定期清洁。", hint: "评估办公桌、会议室和公共走廊的日常清洁情况。" },
                ja: { text: "ワークステーションと共用エリアは定期的に清掃されている。", hint: "デスク、会議室、廊下などの定期的な清掃状況を評価してください。" }
            },
            restroomsarecleanandwellmaintained: {
                ta: { text: "ஓய்வறைகள் சுத்தமாகவும் சரியான பராமரிப்பிலும் உள்ளன.", hint: "ஓய்வறைகளில் சோப், தண்ணீர் மற்றும் சுகாதாரப் பொருட்கள் உள்ளனவா என கவனியுங்கள்." },
                hi: { text: "शौचालय साफ और अच्छी तरह से बनाए रखे गए हैं।", hint: "साबुन, पानी और आवश्यक स्वच्छता आपूर्ति की उपलब्धता पर ध्यान दें।" },
                ar: { text: "دورات المياه نظيفة ويتم صيانتها جيداً.", hint: "تحقق من توفر الصابون والماء ولوازم النظافة الأساسية وصيانة المرافق." },
                es: { text: "Los baños están limpios y bien mantenidos.", hint: "Considere la disponibilidad de agua, jabón e insumos higiénicos básicos." },
                fr: { text: "Les toilettes sont propres et bien entretenues.", hint: "Considérez la disponibilité du savon, de l'eau et des fournitures d'hygiène." },
                de: { text: "Die Waschräume sind sauber und gut gepflegt.", hint: "Achten Sie auf die Verfügbarkeit von Seife, Wasser und Hygieneartikeln." },
                zh: { text: "洗手间清洁且维护良好。", hint: "考虑洗手液、清洁水和基本卫生用品的供应情况。" },
                ja: { text: "トイレは清潔でよく維持管理されている。", hint: "石鹸、水、必要な衛生用品の補充状況を考慮してください。" }
            },
            adequatehandwashingfacilitiesandhygienesuppliesareavailable: {
                ta: { text: "போதுமான கை கழுவும் வசதிகளும் சுகாதாரப் பொருட்களும் கிடைக்கின்றன.", hint: "கை கழுவும் வசதிகள் மற்றும் சுத்திகரிப்பு திரவங்களின் இருப்பு." },
                hi: { text: "पर्याप्त हाथ धोने की सुविधाएँ और स्वच्छता सामग्री उपलब्ध हैं।", hint: "हाथ धोने की व्यवस्था और सैनिटाइज़र आदि की उपलब्धता।" },
                ar: { text: "تتوفر مرافق كافية لغسل اليدين ومستلزمات النظافة.", hint: "تأكد من وجود مغاسل نظيفة ومعقمات اليدين بشكل كافٍ." },
                es: { text: "Se dispone de instalaciones adecuadas para el lavado de manos y suministros de higiene.", hint: "Disponibilidad de agua, jabón y desinfectantes." },
                fr: { text: "Des installations adéquates pour le lavage des mains et des produits d'hygiène sont disponibles.", hint: "Présence de savon, essuie-mains et distributeurs de gel." },
                de: { text: "Es sind angemessene Händewaschmöglichkeiten und Hygieneartikel vorhanden.", hint: "Verfügbarkeit von Handwaschbecken, Seife und Desinfektionsmitteln." },
                zh: { text: "提供充足的洗手设施和卫生用品。", hint: "洗手池、洗手液及消毒用品的完备程度。" },
                ja: { text: "適切な手洗い設備と衛生用品が利用可能である。", hint: "手洗い場、石鹸、消毒液が十分に配備されているか。" }
            },
            drinkingwaterfacilitiesarecleanandeasilyaccessible: {
                ta: { text: "குடிநீர் வசதிகள் சுத்தமாகவும் எளிதில் அணுகக்கூடியதாகவும் உள்ளன.", hint: "தூய்மையான குடிநீர் விநியோகம் மற்றும் சுலபமான அணுகல்." },
                hi: { text: "पीने के पानी की सुविधाएँ स्वच्छ और आसानी से सुलभ हैं।", hint: "साफ पेयजल डिस्पेंसर और आसान पहुंच।" },
                ar: { text: "مرافق مياه الشرب نظيفة ويسهل الوصول إليها.", hint: "نقاط توزيع مياه الشرب النظيفة وسهولة الوصول إليها." },
                es: { text: "Las instalaciones de agua potable están limpias y son de fácil acceso.", hint: "Puntos de agua potable limpios y convenientemente ubicados." },
                fr: { text: "Les points d'eau potable sont propres et faciles d'accès.", hint: "Fontaines d'eau propre et facilement accessibles à tous." },
                de: { text: "Trinkwassereinrichtungen sind sauber und leicht zugänglich.", hint: "Saubere Wasserspender und kurze Wege." },
                zh: { text: "饮用水设施清洁且便于使用。", hint: "饮用水源的洁净程度和取水便利性。" },
                ja: { text: "飲料水設備は清潔で利用しやすい。", hint: "清潔な給水器やアクセスのしやすさについて。" }
            },
            wastebinsareavailableandemptiedregularly: {
                ta: { text: "குப்பைத் தொட்டிகள் பயன்பாட்டில் உள்ளன மற்றும் தவறாமல் காலி செய்யப்படுகின்றன.", hint: "குப்பைத் தொட்டிகள் நிரம்பி வழியாமல் தினசரி பராமரிக்கப்படுகின்றனவா?" },
                hi: { text: "कचरे के डिब्बे उपलब्ध हैं और नियमित रूप से खाली किए जाते हैं।", hint: "कचरा पात्रों की पर्याप्त संख्या और समय पर सफाई।" },
                ar: { text: "سلال النفايات متوفرة ويتم تفريغها بانتظام.", hint: "سلال المهملات متوفرة وتفرغ دورياً دون تراكم." },
                es: { text: "Los cubos de basura están disponibles y se vacían periódicamente.", hint: "Papeleras suficientes y vaciadas a tiempo." },
                fr: { text: "Des poubelles sont disponibles et vidées régulièrement.", hint: "Bacs à déchets suffisants et vidés sans débordement." },
                de: { text: "Abfalleimer sind vorhanden und werden regelmäßig geleert.", hint: "Ausreichende Mülleimer, die pünktlich geleert werden." },
                zh: { text: "垃圾桶齐全并定期清空。", hint: "垃圾桶数量充足且清理及时。" },
                ja: { text: "ゴミ箱が設置されており、定期的に回収されている。", hint: "ゴミ箱が適切に配置され定期的に処理されているか。" }
            },
            theofficehasadequateventilationandfreshair: {
                ta: { text: "அலுவலகத்தில் போதுமான காற்றோட்டமும் புதிய காற்றும் உள்ளது.", hint: "காற்றோட்டம், ஏசி தரம் மற்றும் புதிய காற்றின் ஓட்டம்." },
                hi: { text: "कार्यालय में पर्याप्त वेंटिलेशन और ताज़ी हवा उपलब्ध है।", hint: "उचित वायु संचार और ताज़ा वातावरण।" },
                ar: { text: "المكتب يحتوي على تهوية كافية وهواء نقي.", hint: "جودة التهوية ودوران الهواء النقي وتكييف الهواء." },
                es: { text: "La oficina cuenta con ventilación adecuada y aire fresco.", hint: "Calidad del aire interior y buena ventilación." },
                fr: { text: "Le bureau dispose d'une ventilation adéquate et d'air frais.", hint: "Qualité de l'air ambiant et renouvellement régulier." },
                de: { text: "Das Büro verfügt über ausreichende Belüftung und frische Luft.", hint: "Angemessene Belüftung und Raumluftqualität." },
                zh: { text: "办公室通风良好，空气新鲜。", hint: "室内空气流通与换气质量。" },
                ja: { text: "オフィスには十分な換気と新鮮な空気がある。", hint: "オフィスの換気状態や空気の質について。" }
            },
            theworkplaceisfreefromunpleasantodorsandexcessivedust: {
                ta: { text: "பணியிடம் விரும்பத்தகாத வாசனைகள் மற்றும் அதிகப்படியான தூசியிலிருந்து விடுபட்டுள்ளது.", hint: "தூய்மையான சூழல், தூசியற்ற மேசைகள் மற்றும் நல்ல நறுமணம்." },
                hi: { text: "कार्यस्थल अप्रिय गंध और अत्यधिक धूल से मुक्त है।", hint: "कार्यस्थल की स्वच्छता और अप्रिय गंध की अनुपस्थिति।" },
                ar: { text: "مكان العمل خالٍ من الروائح الكريهة والغبار الزائد.", hint: "البيئة خالية من الروائح المزعجة وتراكم الغبار." },
                es: { text: "El lugar de trabajo está libre de olores desagradables y polvo excesivo.", hint: "Espacio de trabajo sin polvo excesivo ni malos olores." },
                fr: { text: "Le lieu de travail est exempt d'odeurs désagréables et de poussière excessive.", hint: "Absence d'odeurs désagréables et de poussières gênantes." },
                de: { text: "Der Arbeitsplatz ist frei von unangenehmen Gerüchen und übermäßigem Staub.", hint: "Keine störenden Gerüche oder übermäßiger Staub." },
                zh: { text: "工作场所无异味和过多灰尘。", hint: "工作区域清洁，无异味或过多积尘。" },
                ja: { text: "職場には不快な臭いや過剰なほこりがない。", hint: "不快なにおいやほこりがない快適な環境か。" }
            },
            foodandpantryareasaremaintainedinahygieniccondition: {
                ta: { text: "உணவு மற்றும் சிற்றுண்டி பகுதிகள் சுகாதாரமான நிலையில் பராமரிக்கப்படுகின்றன.", hint: "உணவருந்தும் இடம், மைக்ரோவேவ் மற்றும் பாத்திரங்கள் சுத்தமாக உள்ளதா?" },
                hi: { text: "भोजन और पेंट्री क्षेत्रों को स्वच्छ स्थिति में बनाए रखा जाता है।", hint: "पेंट्री, माइक्रोवेव और खाने की मेजों की स्वच्छता।" },
                ar: { text: "يتم الحفاظ على مناطق الطعام والمشروبات في حالة صحية ونظيفة.", hint: "نظافة منطقة الاستراحة والمطبخ والميكروويف وموائد الطعام." },
                es: { text: "Las áreas de comida y despensa se mantienen en condiciones higiénicas.", hint: "Limpieza del comedor, microondas y mesas de descanso." },
                fr: { text: "Les espaces de restauration et café sont maintenus dans un état hygiénique.", hint: "Propreté de la cafétéria, des tables et de la kitchenette." },
                de: { text: "Ess- und Pausenbereiche werden in hygienischem Zustand gehalten.", hint: "Sauberkeit in der Teeküche und im Aufenthaltsraum." },
                zh: { text: "餐饮和茶水间保持卫生。", hint: "用餐区、微波炉和茶水间的清洁程度。" },
                ja: { text: "食事やパントリーエリアは衛生的な状態に保たれている。", hint: "パントリー、電子レンジ、食事スペースの清潔度。" }
            },
            ifeelcomfortablewiththeoverallhygienestandardsofmyworkplace: {
                ta: { text: "எனது பணியிடத்தின் ஒட்டுமொத்த சுகாதாரத் தரத்தில் நான் வசதியாக உணர்கிறேன்.", hint: "நிறுவனத்தின் ஒட்டுமொத்த சுகாதாரம் குறித்த உங்கள் பொதுவான திருப்தி." },
                hi: { text: "मैं अपने कार्यस्थल के समग्र स्वच्छता मानकों से सहज महसूस करता हूँ।", hint: "अपने कार्यस्थल की समग्र स्वच्छता के प्रति आपका संतोष।" },
                ar: { text: "أشعر بالارتياح تجاه معايير النظافة العامة في مكان عملي.", hint: "شعورك العام بالرضا تجاه معايير النظافة والصحة العامة." },
                es: { text: "Me siento cómodo con los estándares generales de higiene de mi lugar de trabajo.", hint: "Satisfacción general con la limpieza e higiene institucional." },
                fr: { text: "Je me sens à l'aise avec les normes générales d'hygiène de mon lieu de travail.", hint: "Satisfaction générale quant au niveau d'hygiène global." },
                de: { text: "Ich fühle mich mit den allgemeinen Hygienestandards an meinem Arbeitsplatz wohl.", hint: "Allgemeine Zufriedenheit mit der Arbeitsplatzhygiene." },
                zh: { text: "我对工作场所的整体卫生标准感到满意。", hint: "您对单位整体卫生和健康环境的满意度。" },
                ja: { text: "職場の総合的な衛生基準に満足している。", hint: "職場の衛生全般に対する全体的な満足度。" }
            },
            hygienerelatedissuesareaddressedpromptlywhenreported: {
                ta: { text: "சுகாதாரம் தொடர்பான புகார்கள் தெரிவிக்கப்பட்டால் உடனடியாக சரிசெய்யப்படுகின்றன.", hint: "நிர்வாகத்திற்கு தெரிவிக்கப்படும் புகார்களுக்கு விரைவான தீர்வு கிடைக்கிறதா?" },
                hi: { text: "सूचना मिलने पर स्वच्छता संबंधी समस्याओं का तुरंत समाधान किया जाता है।", hint: "समस्याओं की रिपोर्टिंग के बाद त्वरित सुधारात्मक कार्रवाई।" },
                ar: { text: "تتم معالجة المشكلات المتعلقة بالنظافة على الفور عند الإبلاغ عنها.", hint: "سرعة الاستجابة لمعالجة أي ملاحظات صحية يتم رفعها." },
                es: { text: "Los problemas relacionados con la higiene se abordan de inmediato cuando se informan.", hint: "Respuesta rápida del equipo de mantenimiento ante reportes." },
                fr: { text: "Les problèmes d'hygiène signalés sont traités rapidement.", hint: "Rapidité de résolution des signalements de propreté." },
                de: { text: "Hygieneprobleme werden nach Meldung umgehend behoben.", hint: "Schnelle Behebung nach Meldung von Hygienemängeln." },
                zh: { text: "报告卫生问题后能迅速得到解决。", hint: "反映卫生问题后相关部门的处理速度。" },
                ja: { text: "衛生に関する問題が報告された場合、迅速に対応される。", hint: "衛生上の問題が報告された際の対応の迅速さ。" }
            },
            theorganizationprovidessufficientfacilitiestosupportemployeehygiene: {
                ta: { text: "பணியாளர்களின் சுகாதாரத்தை ஆதரிக்க நிறுவனம் போதுமான வசதிகளை வழங்குகிறது.", hint: "ஊழியர் நலனுக்கான அடிப்படை வசதிகள் மற்றும் ஏற்பாடுகள்." },
                hi: { text: "संगठन कर्मचारियों की स्वच्छता का समर्थन करने के लिए पर्याप्त सुविधाएँ प्रदान करता है।", hint: "कर्मचारी स्वच्छता के समर्थन में उपलब्ध संसाधन।" },
                ar: { text: "توفر المؤسسة مرافق كافية لدعم نظافة الموظفين.", hint: "كفاية المرافق المقدمة للحفاظ على صحة وسلامة العاملين." },
                es: { text: "La organización proporciona instalaciones suficientes para apoyar la higiene de los empleados.", hint: "Instalaciones y recursos provistos por la empresa." },
                fr: { text: "L'organisation met à disposition des installations suffisantes pour l'hygiène des employés.", hint: "Ressources mises en place par la direction pour l'hygiène." },
                de: { text: "Das Unternehmen stellt ausreichende Einrichtungen zur Unterstützung der Mitarbeiterhygiene bereit.", hint: "Vom Arbeitgeber bereitgestellte sanitäre Ressourcen." },
                zh: { text: "公司提供了充足的设施来保障员工卫生。", hint: "公司为保障员工身心健康所提供的支持与设施。" },
                ja: { text: "組織は従業員の衛生をサポートする十分な設備を提供している。", hint: "従業員の衛生維持のために組織が提供する設備。" }
            },
            ifeelcomfortableandsupportedinmyworkplace: {
                ta: { text: "எனது பணியிடத்தில் நான் வசதியாகவும் ஆதரவுடனும் உணர்கிறேன்.", hint: "பணிச்சூழல், சக ஊழியர்களின் ஒத்துழைப்பு மற்றும் ஆதரவு." },
                hi: { text: "मैं अपने कार्यस्थल पर सहज और समर्थित महसूस करता हूँ।", hint: "कार्यस्थल पर सकारात्मक माहौल और सहकर्मियों का सहयोग।" },
                ar: { text: "أشعر بالراحة والدعم في مكان عملي.", hint: "الشعور بالأمان والدعم من الفريق والإدارة في العمل اليومي." },
                es: { text: "Me siento cómodo y apoyado en mi lugar de trabajo.", hint: "Ambiente de trabajo inclusivo y con apoyo mutuo." },
                fr: { text: "Je me sens à l'aise et soutenu sur mon lieu de travail.", hint: "Sentiment de confiance et de soutien au quotidien." },
                de: { text: "Ich fühle mich an meinem Arbeitsplatz wohl und unterstützt.", hint: "Unterstützende Atmosphäre und positives Arbeitsklima." },
                zh: { text: "在工作场所，我感到舒适并得到支持。", hint: "在团队和日常工作中感受到的关怀与协作。" },
                ja: { text: "職場で快適に過ごせ、サポートされていると感じる。", hint: "職場での安心感や周囲からのサポート。" }
            },
            ifeelmyorganizationactivelysupportsemployeewellbeing: {
                ta: { text: "எனது நிறுவனம் ஊழியர்களின் நல்வாழ்வை தீவிரமாக ஆதரிக்கிறது என உணர்கிறேன்.", hint: "உடல் மற்றும் மன நலம் சார்ந்த நிறுவன ஆதரவு." },
                hi: { text: "मुझे लगता है कि मेरा संगठन कर्मचारियों की भलाई का सक्रिय रूप से समर्थन करता है।", hint: "कर्मचारियों के स्वास्थ्य और खुशहाली के प्रति प्रबंधन का रुख।" },
                ar: { text: "أشعر أن مؤسستي تدعم بنشاط رفاهية وصحة الموظفين.", hint: "مبادرات المؤسسة لصالح الصحة البدنية والنفسية للموظفين." },
                es: { text: "Siento que mi organización apoya activamente el bienestar de los empleados.", hint: "Programas e iniciativas a favor del bienestar integral." },
                fr: { text: "J'ai le sentiment que mon organisation soutient activement le bien-être des salariés.", hint: "Initiatives pour la santé physique et mentale des équipes." },
                de: { text: "Ich habe das Gefühl, dass mein Unternehmen das Wohlbefinden der Mitarbeiter aktiv fördert.", hint: "Förderung von Gesundheit und Wohlbefinden durch das Unternehmen." },
                zh: { text: "我觉得公司积极支持员工的健康和福祉。", hint: "公司在员工身心健康方面开展的支持措施。" },
                ja: { text: "組織は従業員の心身の健康を積極的に支援していると感じる。", hint: "従業員の健康や幸福に対する組織の取り組み。" }
            },
            icanmaintainahealthyworklifebalance: {
                ta: { text: "என்னால் ஆரோக்கியமான வேலை-வாழ்க்கை சமநிலையை பராமரிக்க முடிகிறது.", hint: "பணி நேரம் மற்றும் குடும்ப வாழ்க்கைக்கான சமநிலை." },
                hi: { text: "मैं एक स्वस्थ कार्य-जीवन संतुलन बनाए रखने में सक्षम हूँ।", hint: "काम के घंटे और व्यक्तिगत जीवन के बीच उचित संतुलन।" },
                ar: { text: "أستطيع الحفاظ على توازن صحي بين العمل والحياة الشخصية.", hint: "القدرة على الموازنة بين ساعات العمل والحياة الأسرية." },
                es: { text: "Puedo mantener un equilibrio saludable entre el trabajo y la vida personal.", hint: "Equilibrio entre la jornada laboral y la vida personal." },
                fr: { text: "Je parviens à maintenir un équilibre sain entre vie professionnelle et vie personnelle.", hint: "Équilibre entre temps de travail et vie privée." },
                de: { text: "Ich kann eine gesunde Work-Life-Balance aufrechterhalten.", hint: "Vereinbarkeit von Beruf und Privatleben." },
                zh: { text: "我能保持健康的工作与生活平衡。", hint: "工作时间与个人生活之间的协调平衡。" },
                ja: { text: "健全なワークライフバランスを維持できている。", hint: "仕事と私生活の調和が取れているか。" }
            },
            ihavesufficientresourcesandsupporttoperformmyresponsibilities: {
                ta: { text: "எனது கடமைகளைச் செய்ய போதுமான ஆதாரங்களும் ஆதரவும் என்னிடம் உள்ளன.", hint: "வேலைக்குத் தேவையான மென்பொருள், உபகரணங்கள் மற்றும் வழிகாட்டுதல்." },
                hi: { text: "अपनी जिम्मेदारियों को निभाने के लिए मेरे पास पर्याप्त संसाधन और समर्थन उपलब्ध हैं।", hint: "कार्य निष्पादन हेतु आवश्यक उपकरण और पर्यवेक्षक का मार्गदर्शन।" },
                ar: { text: "لدي الموارد والدعم الكافي لأداء مسؤولياتي ومهامي.", hint: "توفر الأدوات والبرمجيات والإرشاد اللازم لإنجاز المهام بكفاءة." },
                es: { text: "Cuento con recursos y apoyo suficientes para desempeñar mis responsabilidades.", hint: "Herramientas, capacitación y apoyo directivo para cumplir las tareas." },
                fr: { text: "Je dispose des ressources et du soutien nécessaires pour accomplir mes responsabilités.", hint: "Outils, matériels et encadrement suffisants pour travailler efficacement." },
                de: { text: "Ich verfüge über ausreichende Ressourcen und Unterstützung zur Erfüllung meiner Aufgaben.", hint: "Erforderliche Tools, IT-Ausstattung und Anleitung durch Vorgesetzte." },
                zh: { text: "我有足够的资源和支持来履行我的职责。", hint: "完成工作所需的软件工具、硬件设备及导师指导。" },
                ja: { text: "責任を果たすための十分なリソースとサポートがある。", hint: "業務を遂行するために必要なツール、設備、指導体制。" }
            }
        },

        /**
         * Metadata translations for Survey Titles, Categories, and Descriptions.
         */
        _builtinMeta: {
            "workplace assessment": {
                ta: { title: "பணியிட மதிப்பீடு", desc: "செயல்பாட்டு திறன், குழுப்பணி மற்றும் நிறுவன செயல்முறைகளை மதிப்பீடு செய்தல்.", category: "ஒதுக்கப்பட்ட கணக்கெடுப்பு" },
                hi: { title: "कार्यस्थल मूल्यांकन", desc: "परिचालन प्रभावशीलता, टीम वर्क और संगठनात्मक प्रक्रियाओं का मूल्यांकन।", category: "आवंटित सर्वेक्षण" },
                ar: { title: "تقييم بيئة العمل", desc: "تقييم الفعالية التشغيلية والعمل الجماعي والعمليات المؤسسية.", category: "الاستطلاع المخصص" },
                es: { title: "Evaluación del lugar de trabajo", desc: "Evaluación de la eficacia operativa, el trabajo en equipo y los procesos organizativos.", category: "ENCUESTA ASIGNADA" },
                fr: { title: "Évaluation du lieu de travail", desc: "Évaluation de l'efficacité opérationnelle, du travail d'équipe et des processus organisationnels.", category: "SONDAGE ASSIGNÉ" },
                de: { title: "Arbeitsplatzbeurteilung", desc: "Bewertung der betrieblichen Effektivität, Teamarbeit und Organisationsprozesse.", category: "ZUGEWIESENE UMFRAGE" },
                zh: { title: "工作场所评估", desc: "评估运营效率、团队合作和组织流程。", category: "已分配调查" },
                ja: { title: "職場環境評価", desc: "業務の有効性、チームワーク、組織プロセスの評価。", category: "割り当てられたアンケート" }
            }
        },

        /**
         * Translate survey metadata (title, category, description) into the target language.
         */
        getTranslatedMeta(meta, targetLang = currentLanguage) {
            if (!meta) return { title: 'Workplace Assessment', desc: '', category: 'ASSIGNED SURVEY', tags: [] };
            if (!targetLang || targetLang === 'en') return meta;

            const norm = (meta.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const match = this._builtinMeta[norm] || this._builtinMeta["workplace assessment"];
            const t = match ? match[targetLang] : null;

            return {
                title: t?.title || meta.title,
                desc: t?.desc || meta.desc,
                category: t?.category || meta.category,
                tags: meta.tags || []
            };
        },

        /**
         * Translate a question object into the target language, falling back to original English.
         */
        getTranslatedQuestion(question, targetLang = currentLanguage) {
            if (!question) return { title: '', question_text: '', hint: '', placeholder: '', options: [] };

            const rawTitle = question.title || question.question_text || '';
            const rawText = question.question_text || question.title || '';
            const rawHint = question.hint || '';
            const rawPlaceholder = question.placeholder || '';
            const rawOpts = question.options_json || question.options;

            let translatedText = rawText;
            let translatedTitle = rawTitle;
            let translatedHint = rawHint;
            let translatedPlaceholder = rawPlaceholder;
            let translatedOptions = null;
            let isTranslated = false;

            if (targetLang && targetLang !== 'en') {
                // 1. Check if translations_json contains the target language
                let translations = question.translations_json;
                if (typeof translations === 'string') {
                    try { translations = JSON.parse(translations); } catch (e) { translations = null; }
                }

                if (translations && translations[targetLang]) {
                    const t = translations[targetLang];
                    if (t.question_text && t.question_text.trim()) {
                        translatedText = t.question_text.trim();
                        translatedTitle = t.title || t.question_text.trim();
                        isTranslated = true;
                    } else if (t.title && t.title.trim()) {
                        translatedTitle = t.title.trim();
                        translatedText = t.title.trim();
                        isTranslated = true;
                    }
                    if (t.hint) translatedHint = t.hint;
                    if (t.placeholder) translatedPlaceholder = t.placeholder;
                    if (t.options_json) translatedOptions = t.options_json;
                    else if (t.options) translatedOptions = t.options;
                }

                // 2. Check Built-in Question Dictionary if DB translation is missing
                if (!isTranslated) {
                    const normKey = (rawText || rawTitle).toLowerCase().replace(/[^a-z0-9]/g, '');
                    const builtin = this._builtinQuestions[normKey];
                    if (builtin && builtin[targetLang]) {
                        const bt = builtin[targetLang];
                        translatedText = bt.text || translatedText;
                        translatedTitle = bt.title || bt.text || translatedTitle;
                        if (bt.hint) translatedHint = bt.hint;
                        if (bt.placeholder) translatedPlaceholder = bt.placeholder;
                        isTranslated = true;
                    }
                }
            }

            // Standardize Likert options for rating questions
            let finalOptions = translatedOptions || rawOpts;
            if (typeof finalOptions === 'string') {
                try { finalOptions = JSON.parse(finalOptions); } catch (e) { finalOptions = null; }
            }

            // Check if options are standard 5-point Likert or empty
            const isStandardLikert = !Array.isArray(finalOptions) || finalOptions.length === 0 ||
                (finalOptions.length === 5 && (
                    finalOptions[0]?.label === 'Strongly Disagree' ||
                    finalOptions[0]?.score === 1 ||
                    finalOptions[4]?.label === 'Strongly Agree'
                ));

            if (isStandardLikert) {
                finalOptions = this.getLikertOptions(targetLang);
            }

            return {
                title: translatedTitle,
                question_text: translatedText,
                hint: translatedHint,
                placeholder: translatedPlaceholder,
                options: finalOptions,
                is_translated: isTranslated
            };
        },

        /**
         * Returns the standardized 5-point Likert options in the specified language.
         */
        getLikertOptions(lang = currentLanguage) {
            const scale = this._likertScales[lang] || this._likertScales.en;
            return scale.map(item => ({ ...item }));
        },

        /**
         * Scans the DOM and applies translations to elements marked with data-i18n attributes.
         */
        applyTranslations(root = document) {
            // 1. Text Content
            const textEls = root.querySelectorAll('[data-i18n]');
            textEls.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) {
                    el.textContent = this.t(key);
                }
            });

            // 2. HTML Content
            const htmlEls = root.querySelectorAll('[data-i18n-html]');
            htmlEls.forEach(el => {
                const key = el.getAttribute('data-i18n-html');
                if (key) {
                    el.innerHTML = this.t(key);
                }
            });

            // 3. Placeholders
            const placeholderEls = root.querySelectorAll('[data-i18n-placeholder]');
            placeholderEls.forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (key) {
                    el.setAttribute('placeholder', this.t(key));
                }
            });

            // 4. Tooltip / Title attributes
            const titleEls = root.querySelectorAll('[data-i18n-title]');
            titleEls.forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                if (key) {
                    el.setAttribute('title', this.t(key));
                }
            });

            // 5. ARIA Labels
            const ariaEls = root.querySelectorAll('[data-i18n-aria-label]');
            ariaEls.forEach(el => {
                const key = el.getAttribute('data-i18n-aria-label');
                if (key) {
                    el.setAttribute('aria-label', this.t(key));
                }
            });
        },

        /**
         * Subscribe to language change events.
         */
        onLanguageChange(callback) {
            if (typeof callback === 'function') {
                eventListeners.push(callback);
            }
        },

        /**
         * Set the allowed languages permitted for the currently logged-in or selected company.
         */
        setAllowedLanguages(langCodes = ['en'], defaultLang = null) {
            if (Array.isArray(langCodes) && langCodes.length > 0) {
                // Ensure English is always present as universal fallback
                const unique = Array.from(new Set(langCodes));
                if (!unique.includes('en')) unique.unshift('en');
                allowedLanguages = unique;

                let storedLang = null;
                try { storedLang = localStorage.getItem('visteria_lang'); } catch (e) {}

                if (defaultLang && allowedLanguages.includes(defaultLang)) {
                    this.setLanguage(defaultLang);
                } else if (storedLang && allowedLanguages.includes(storedLang)) {
                    this.setLanguage(storedLang);
                } else if (!allowedLanguages.includes(currentLanguage)) {
                    this.setLanguage(allowedLanguages[0]);
                }
            }
        },

        /**
         * Get the allowed languages for current scope.
         */
        getAllowedLanguages() {
            return allowedLanguages;
        },

        /**
         * Mount a modern, sleek language selector dropdown into any DOM container.
         * Only displays the languages enabled for the company!
         */
        mountLanguageSelector(containerOrSelector, allowedLangs = null, onSelect = null) {
            const container = typeof containerOrSelector === 'string'
                ? (containerOrSelector.startsWith('#') || containerOrSelector.startsWith('.')
                    ? document.querySelector(containerOrSelector)
                    : (document.querySelector(containerOrSelector) || document.getElementById(containerOrSelector)))
                : containerOrSelector;

            if (!container) return;

            if (allowedLangs && Array.isArray(allowedLangs) && allowedLangs.length > 0) {
                this.setAllowedLanguages(allowedLangs);
            }

            const langsToShow = SYSTEM_LANGUAGES.filter(l => allowedLanguages.includes(l.code));
            
            // If only 1 language is available, hide selector dropdown completely
            if (langsToShow.length <= 1) {
                container.innerHTML = '';
                return;
            }

            const currentMeta = this.getLanguageMeta(currentLanguage);

            container.innerHTML = `
                <div class="visteria-lang-widget" id="visteriaLangWidget">
                    <button type="button" class="lang-trigger-btn" id="langTriggerBtn" aria-haspopup="true" aria-expanded="false" title="${this.t('lang.switch_prompt')}">
                        <span class="lang-flag" aria-hidden="true">${currentMeta.flag}</span>
                        <span class="lang-code-label">${currentMeta.nativeName}</span>
                        <span class="lang-chevron" aria-hidden="true">▾</span>
                    </button>
                    <div class="lang-dropdown-menu" id="langDropdownMenu" role="menu" aria-hidden="true">
                        <div class="lang-dropdown-header">
                            <span class="lang-dropdown-title">${this.t('lang.select_label')}</span>
                            <span class="lang-count-badge">${langsToShow.length}</span>
                        </div>
                        <div class="lang-options-list">
                            ${langsToShow.map(l => `
                                <button type="button" class="lang-option-item ${l.code === currentLanguage ? 'active' : ''}" data-code="${l.code}" role="menuitem">
                                    <span class="option-flag">${l.flag}</span>
                                    <div class="option-names">
                                        <span class="option-native">${l.nativeName}</span>
                                        <span class="option-english">${l.name}</span>
                                    </div>
                                    ${l.code === currentLanguage ? '<span class="option-check">✓</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            const triggerBtn = container.querySelector('#langTriggerBtn');
            const menu = container.querySelector('#langDropdownMenu');

            function toggleMenu(open = null) {
                const isOpen = open !== null ? open : !menu.classList.contains('show');
                if (isOpen) {
                    menu.classList.add('show');
                    triggerBtn.setAttribute('aria-expanded', 'true');
                    menu.setAttribute('aria-hidden', 'false');
                } else {
                    menu.classList.remove('show');
                    triggerBtn.setAttribute('aria-expanded', 'false');
                    menu.setAttribute('aria-hidden', 'true');
                }
            }

            triggerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMenu();
            });

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    toggleMenu(false);
                }
            });

            // Handle option click
            const options = container.querySelectorAll('.lang-option-item');
            options.forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const code = opt.getAttribute('data-code');
                    toggleMenu(false);
                    if (code && code !== currentLanguage) {
                        I18n.setLanguage(code);
                        if (typeof onSelect === 'function') {
                            onSelect(code);
                        }
                    }
                });
            });

            // Keep widget in sync when language changes
            this.onLanguageChange((newCode, newMeta) => {
                const codeLabel = container.querySelector('.lang-code-label');
                const flagEl = container.querySelector('.lang-flag');
                if (codeLabel) codeLabel.textContent = newMeta.nativeName;
                if (flagEl) flagEl.textContent = newMeta.flag;

                options.forEach(item => {
                    const itemCode = item.getAttribute('data-code');
                    if (itemCode === newCode) {
                        item.classList.add('active');
                        if (!item.querySelector('.option-check')) {
                            const check = document.createElement('span');
                            check.className = 'option-check';
                            check.textContent = '✓';
                            item.appendChild(check);
                        }
                    } else {
                        item.classList.remove('active');
                        const check = item.querySelector('.option-check');
                        if (check) check.remove();
                    }
                });
            });
        }
    };

    // Expose globally
    window.I18n = I18n;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            I18n.init();
        });
    } else {
        I18n.init();
    }

})(window, document);
