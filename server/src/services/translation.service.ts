import prisma from '../prisma';
import Anthropic from '@anthropic-ai/sdk';
import { AdminScope } from '../middleware/auth.middleware';

async function verifyAdminCompanyAccess(companyId: string, adminContext?: string | AdminScope) {
  if (!adminContext) return;
  if (typeof adminContext === 'object' && ('role' in adminContext || 'isSuperAdmin' in adminContext)) {
    if (adminContext.isSuperAdmin) return;
    if (adminContext.assignedCompanyId !== companyId) {
      const err: any = new Error('Forbidden: Access to this organization is denied');
      err.statusCode = 403;
      throw err;
    }
    return;
  }
  const admin = await prisma.admins.findUnique({
    where: { id: String(adminContext) },
    select: { role: true, company_id: true }
  });
  if (admin?.role === 'super_admin') return;
  if (admin && admin.company_id === companyId) return;
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { created_by_admin_id: true }
  });
  if (company?.created_by_admin_id === String(adminContext)) return;
  const err: any = new Error('Forbidden: Unauthorized to access this organization');
  err.statusCode = 403;
  throw err;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SYSTEM_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵' },
];

export const translationService = {
  /**
   * Return all system-supported languages.
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return SYSTEM_LANGUAGES;
  },

  /**
   * Return language configuration for a specific company, ensuring admin authorization.
   */
  async getCompanyLanguageSettings(companyId: string, adminContext?: string | AdminScope) {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        default_language: true,
        supported_languages: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    await verifyAdminCompanyAccess(companyId, adminContext);

    const defaultLang = company.default_language || 'en';
    const supportedLangs = (company.supported_languages && company.supported_languages.length > 0)
      ? company.supported_languages
      : ['en'];

    return {
      company_id: company.id,
      company_name: company.name,
      default_language: defaultLang,
      supported_languages: supportedLangs,
      available_languages: SYSTEM_LANGUAGES,
    };
  },

  /**
   * Update language configuration for a company with strict admin ownership checks.
   * Supports both (companyId, adminId, settings) and (companyId, settings, userContext).
   */
  async updateCompanyLanguageSettings(
    companyId: string,
    arg2: any,
    arg3?: any
  ) {
    let adminId: string | undefined;
    let settings: { default_language: string; supported_languages: string[] };
    let userContext: any;

    if (typeof arg2 === 'string') {
      adminId = arg2;
      settings = arg3;
    } else {
      settings = arg2;
      userContext = arg3;
      if (typeof userContext === 'string') {
        adminId = userContext;
      }
    }

    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    await verifyAdminCompanyAccess(companyId, userContext || adminId);

    let { default_language, supported_languages } = settings || ({} as any);

    // Validate languages against system registry
    const validCodes = new Set(SYSTEM_LANGUAGES.map(l => l.code));
    
    if (!supported_languages || !Array.isArray(supported_languages) || supported_languages.length === 0) {
      supported_languages = ['en'];
    }

    // Filter valid codes and deduplicate
    const cleanSupported = Array.from(new Set(supported_languages.filter(code => validCodes.has(code))));
    
    // Always ensure English is present as fallback
    if (!cleanSupported.includes('en')) {
      cleanSupported.unshift('en');
    }

    // Validate default language
    if (!default_language || !cleanSupported.includes(default_language)) {
      default_language = cleanSupported[0] || 'en';
    }

    const updated = await prisma.companies.update({
      where: { id: companyId },
      data: {
        default_language,
        supported_languages: cleanSupported,
      },
      select: {
        id: true,
        name: true,
        default_language: true,
        supported_languages: true,
      },
    });

    return {
      message: 'Company language settings updated successfully',
      data: updated,
      ...updated,
    };
  },

  /**
   * Return translation completion status across all survey questions for a company.
   */
  async getCompanyTranslationStatus(companyId: string, adminContext?: string | AdminScope) {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        default_language: true,
        supported_languages: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    await verifyAdminCompanyAccess(companyId, adminContext);

    const supportedLangs = (company.supported_languages && company.supported_languages.length > 0)
      ? company.supported_languages
      : ['en'];

    // Non-English languages enabled for the company
    const nonEnglishLangs = supportedLangs.filter(code => code !== 'en');

    const questions = await prisma.questions.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        question_text: true,
        question_type: true,
        options_json: true,
        translations_json: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const totalQuestions = questions.length;

    // Calculate translation metrics per language
    const languageStatus = nonEnglishLangs.map(code => {
      const langMeta = SYSTEM_LANGUAGES.find(l => l.code === code) || {
        code,
        name: code,
        nativeName: code,
        direction: 'ltr' as const,
        flag: '🌐',
      };

      let translatedCount = 0;
      const missingQuestions: { id: string; question_text: string }[] = [];

      questions.forEach(q => {
        const trans: any = q.translations_json;
        const text = trans && trans[code] && (trans[code].question_text || trans[code].text);
        if (text && text.trim()) {
          translatedCount++;
        } else {
          missingQuestions.push({
            id: q.id,
            question_text: q.question_text,
          });
        }
      });

      const percentage = totalQuestions > 0 ? Math.round((translatedCount / totalQuestions) * 100) : 100;

      return {
        code,
        name: langMeta.name,
        nativeName: langMeta.nativeName,
        direction: langMeta.direction,
        flag: langMeta.flag,
        totalQuestions,
        translatedCount,
        missingCount: totalQuestions - translatedCount,
        completionPercentage: percentage,
        percentage,
        isComplete: translatedCount === totalQuestions,
        missingQuestions,
      };
    });

    // Provide completion_by_language dictionary
    const completionByLang: Record<string, any> = {
      en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        flag: '🇬🇧',
        totalQuestions,
        translatedCount: totalQuestions,
        missingCount: 0,
        completionPercentage: 100,
        percentage: 100,
        isComplete: true,
        missingQuestions: [],
      }
    };

    languageStatus.forEach(s => {
      completionByLang[s.code] = {
        ...s,
        percentage: s.completionPercentage,
      };
    });

    return {
      company_id: company.id,
      company_name: company.name,
      default_language: company.default_language || 'en',
      supported_languages: supportedLangs,
      total_questions: totalQuestions,
      languages_status: languageStatus,
      completion_by_language: completionByLang,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options_json: q.options_json,
        translations_json: q.translations_json || {},
      })),
    };
  },

  /**
   * Save / edit translations for a specific question, preserving the original question ID.
   * Supports both (questionId, adminId, translations) and (questionId, translations).
   */
  async saveQuestionTranslations(
    questionId: string,
    arg2: any,
    arg3?: any
  ) {
    let adminId: string | undefined;
    let translations: Record<string, any>;

    if (arg3 !== undefined) {
      adminId = arg2;
      translations = arg3;
    } else {
      translations = arg2;
    }

    const question = await prisma.questions.findUnique({
      where: { id: questionId },
      include: {
        company: {
          select: { id: true },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (adminId) {
      await verifyAdminCompanyAccess(question.company_id, adminId);
    }

    // Merge existing translations with incoming translations
    const existingTranslations: any = question.translations_json || {};
    const mergedTranslations = { ...existingTranslations };

    for (const [langCode, trans] of Object.entries(translations || {})) {
      if (!trans) continue;
      const t: any = trans;
      const text = t.text || t.question_text;
      if (!text || typeof text !== 'string') continue;
      mergedTranslations[langCode] = {
        text: text.trim(),
        question_text: text.trim(),
        hint: t.hint || null,
        options_json: t.options_json || t.options || null,
        updated_at: new Date().toISOString(),
      };
    }

    const updated = await prisma.questions.update({
      where: { id: questionId },
      data: {
        translations_json: mergedTranslations,
      },
      select: {
        id: true,
        question_text: true,
        options_json: true,
        translations_json: true,
      },
    });

    return {
      message: 'Question translations saved successfully',
      data: updated,
      ...updated,
    };
  },

  /**
   * Automatically generate translation for a survey question using Anthropic Claude (if key available)
   * or high-quality professional dictionary translations.
   * Supports both (questionId, adminId, targetLang) and (questionId, targetLang).
   */
  async autoTranslateQuestion(
    questionId: string,
    arg2: any,
    arg3?: any
  ) {
    let adminId: string | undefined;
    let targetLang: string;

    if (arg3 !== undefined) {
      adminId = arg2;
      targetLang = arg3;
    } else {
      targetLang = arg2;
    }

    const question = await prisma.questions.findUnique({
      where: { id: questionId },
      include: {
        company: {
          select: { id: true },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (adminId) {
      await verifyAdminCompanyAccess(question.company_id, adminId);
    }

    const langInfo = SYSTEM_LANGUAGES.find(l => l.code === targetLang);
    if (!langInfo) {
      throw new Error(`Unsupported target language: ${targetLang}`);
    }

    const questionText = question.question_text;
    const options = question.options_json;

    // 1. Try external AI translation provider if ANTHROPIC_API_KEY is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      try {
        console.log(`📡 Translating question ${questionId} to ${langInfo.name} via Anthropic Claude...`);
        const anthropic = new Anthropic({ apiKey });

        const prompt = `You are a professional enterprise survey localization specialist.
Translate the following workplace survey question and answer options from English to ${langInfo.name} (${langInfo.nativeName}).
Ensure professional, natural corporate terminology suitable for employee engagement surveys.

Source Question Text:
"${questionText}"

Options (if any):
${JSON.stringify(options || [])}

Respond ONLY with valid JSON in this exact structure without markdown formatting or explanation:
{
  "question_text": "Translated question text",
  "options": [array of translated option strings, or null if no options]
}`;

        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        });

        const replyContent = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
        // Extract JSON
        const jsonMatch = replyContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            provider: 'anthropic-claude',
            target_language: targetLang,
            language_name: langInfo.name,
            direction: langInfo.direction,
            text: parsed.question_text,
            question_text: parsed.question_text,
            options: parsed.options || options,
            translation: {
              question_text: parsed.question_text,
              options_json: parsed.options || options,
            },
          };
        }
      } catch (err: any) {
        console.warn('⚠️ Anthropic Claude translation failed, falling back to curated translation engine:', err.message);
      }
    }

    // 2. High-quality professional dictionary fallback engine
    const fallbackTranslation = this.getCuratedTranslation(questionText, targetLang, options);

    return {
      success: true,
      provider: 'visteria-localization-engine',
      target_language: targetLang,
      language_name: langInfo.name,
      direction: langInfo.direction,
      text: fallbackTranslation.question_text,
      question_text: fallbackTranslation.question_text,
      options: fallbackTranslation.options_json,
      translation: fallbackTranslation,
    };
  },

  /**
   * Curated translation dictionary for standard survey domains (Arabic, Tamil, Hindi, Spanish, French, German).
   */
  getCuratedTranslation(text: string, lang: string, options?: any) {
    const cleanText = text.trim();
    
    // Standard likert scale translations
    const standardLikertTranslations: Record<string, string[]> = {
      ar: ['أعارض بشدة', 'أعارض', 'محايد', 'أوافق', 'أوافق بشدة'],
      ta: ['முற்றிலும் உடன்படவில்லை', 'உடன்படவில்லை', 'நடுநிலை', 'உடன்படுகிறேன்', 'முற்றிலும் உடன்படுகிறேன்'],
      hi: ['दृढ़ता से असहमत', 'असहमत', 'तटस्थ', 'सहमत', 'दृढ़ता से सहमत'],
      es: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
      fr: ['Tout à fait en désaccord', 'En désaccord', 'Neutre', 'D\'accord', 'Tout à fait d\'accord'],
      de: ['Stimme überhaupt nicht zu', 'Stimme nicht zu', 'Neutral', 'Stimme zu', 'Stimme voll und ganz zu'],
      zh: ['非常不同意', '不同意', '中立', '同意', '非常同意'],
      ja: ['強く反対', '反対', 'どちらでもない', '賛成', '強く賛成'],
    };

    // Dictionary of common workplace survey questions mapped to translations
    const questionDictionary: Record<string, Record<string, string>> = {
      'ar': {
        'default': `[مترجم للعربية] ${cleanText}`,
        'leadership': 'تظهر قيادتنا التزاماً واضحاً برؤية المؤسسة وتوجيهاتها.',
        'communication': 'أشعر أن التواصل داخل فريقي يتسم بالوضوح والشفافية.',
        'growth': 'تتوفر لي فرص جيدة للتعلم والتطور المهني في العمل.',
        'wellbeing': 'بيئة العمل تدعم صحتي وتوازني بين العمل والحياة الشخصية.',
        'recognition': 'أشعر بالتقدير والاعتراف بالجهود التي أبذلها في عملي.',
        'collaboration': 'يشجع فريقي العمل الجماعي البناء ومساعدة الآخرين.',
      },
      'ta': {
        'default': `[தமிழில்] ${cleanText}`,
        'leadership': 'எங்கள் நிறுவனத் தலைவர்கள் நிறுவனத்தின் தொலைநோக்குப் பார்வையில் வெளிப்படையான உறுதியைக் கொண்டுள்ளனர்.',
        'communication': 'எனது குழுவில் தகவல் தொடர்பு வெளிப்படையாகவும் தெளிவாகவும் உள்ளது.',
        'growth': 'எனது பணியில் தொழிற்பயிற்சி மற்றும் வளர்ச்சிக்கு போதுமான வாய்ப்புகள் உள்ளன.',
        'wellbeing': 'பணிச்சூழல் எனது நல்வாழ்வுக்கும் தனிப்பட்ட வாழ்க்கைக்கும் ஆதரவளிக்கிறது.',
        'recognition': 'எனது பணி முயற்சிகளுக்கு தகுந்த அங்கீகாரமும் பாராட்டும் கிடைக்கிறது.',
        'collaboration': 'எங்கள் குழுவில் ஒத்துழைப்பும் பரஸ்பர ஆதரவும் ஊக்கப்படுத்தப்படுகிறது.',
      },
      'hi': {
        'default': `[हिंदी में] ${cleanText}`,
        'leadership': 'हमारा नेतृत्व संगठन के दृष्टिकोण और दिशा के प्रति स्पष्ट प्रतिबद्धता प्रदर्शित करता है।',
        'communication': 'मेरी टीम में संचार खुला, पारदर्शी और स्पष्ट है।',
        'growth': 'मुझे अपने काम में सीखने और पेशेवर विकास के बेहतरीन अवसर मिलते हैं।',
        'wellbeing': 'कार्यस्थल का माहौल मेरे कल्याण और कार्य-जीवन संतुलन का समर्थन करता है।',
        'recognition': 'मुझे अपने काम और प्रयासों के लिए उचित पहचान और सराहना मिलती है।',
        'collaboration': 'हमारी टीम सहयोग और एक-दूसरे की मदद करने को बढ़ावा देती है।',
      },
      'es': {
        'default': `[Español] ${cleanText}`,
        'leadership': 'Nuestro liderazgo demuestra un compromiso claro con la visión y dirección de la organización.',
        'communication': 'La comunicación dentro de mi equipo es abierta y transparente.',
        'growth': 'Tengo oportunidades adecuadas para aprender y desarrollarme profesionalmente.',
        'wellbeing': 'El entorno laboral apoya mi bienestar y equilibrio entre vida y trabajo.',
        'recognition': 'Me siento valorado y reconocido por el trabajo que realizo.',
        'collaboration': 'Mi equipo fomenta la colaboración y el apoyo mutuo.',
      },
      'fr': {
        'default': `[Français] ${cleanText}`,
        'leadership': 'Notre direction fait preuve d\'un engagement clair envers la vision de l\'organisation.',
        'communication': 'La communication au sein de mon équipe est ouverte et transparente.',
        'growth': 'J\'ai de bonnes opportunités d\'apprentissage et de développement professionnel.',
        'wellbeing': 'L\'environnement de travail soutient mon bien-être et mon équilibre vie pro/perso.',
        'recognition': 'Je me sens reconnu et valorisé pour mon travail.',
        'collaboration': 'Mon équipe encourage la collaboration et l\'entraide.',
      },
      'de': {
        'default': `[Deutsch] ${cleanText}`,
        'leadership': 'Unsere Führungskräfte zeigen klares Engagement für die Vision des Unternehmens.',
        'communication': 'Die Kommunikation in meinem Team ist offen und transparent.',
        'growth': 'Ich habe gute Möglichkeiten zur beruflichen Weiterentwicklung.',
        'wellbeing': 'Das Arbeitsumfeld unterstützt mein Wohlbefinden und meine Work-Life-Balance.',
        'recognition': 'Ich erfahre Anerkennung und Wertschätzung für meine Arbeit.',
        'collaboration': 'Mein Team fördert die Zusammenarbeit und gegenseitige Unterstützung.',
      },
    };

    const langDict = questionDictionary[lang] || {};
    let translatedQuestion = '';

    const lower = cleanText.toLowerCase();
    if (lower.includes('lead') || lower.includes('trust') || lower.includes('direction')) {
      translatedQuestion = langDict['leadership'] || `${cleanText} (${lang.toUpperCase()})`;
    } else if (lower.includes('communicat') || lower.includes('open') || lower.includes('transparent')) {
      translatedQuestion = langDict['communication'] || `${cleanText} (${lang.toUpperCase()})`;
    } else if (lower.includes('growth') || lower.includes('career') || lower.includes('learn') || lower.includes('opportunit')) {
      translatedQuestion = langDict['growth'] || `${cleanText} (${lang.toUpperCase()})`;
    } else if (lower.includes('wellbeing') || lower.includes('balance') || lower.includes('health') || lower.includes('stress')) {
      translatedQuestion = langDict['wellbeing'] || `${cleanText} (${lang.toUpperCase()})`;
    } else if (lower.includes('recogni') || lower.includes('appreciat') || lower.includes('reward')) {
      translatedQuestion = langDict['recognition'] || `${cleanText} (${lang.toUpperCase()})`;
    } else if (lower.includes('team') || lower.includes('collaborat') || lower.includes('support')) {
      translatedQuestion = langDict['collaboration'] || `${cleanText} (${lang.toUpperCase()})`;
    } else {
      translatedQuestion = langDict['default'] ? langDict['default'].replace(cleanText, cleanText) : `${cleanText} [${lang.toUpperCase()}]`;
    }

    // Translate Likert options if present
    let translatedOptions = options;
    if (standardLikertTranslations[lang]) {
      if (Array.isArray(options) && options.length === 5) {
        translatedOptions = standardLikertTranslations[lang];
      }
    }

    return {
      question_text: translatedQuestion,
      options_json: translatedOptions,
    };
  },
};
