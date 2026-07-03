// 给定默认语言，当没有适配的时候返回什么
const InitLanguage = 'zh';
// 翻译字典
const translateDictionary = {
  COMPANY: {
    en: 'Company',
    fr: 'Entreprise',
    es: 'Empresa',
    pt: 'Empresa',
    zh: '集团',
    ar: 'شركة',
    ja: '会社',
    th: 'บริษัท',
  },
  AC_LS_COPY: {
    en: 'Choose your location and language.',
    es: 'Elija su ubicación e idioma.',
    fr: 'Choisissez votre emplacement et votre langue.',
    pt: 'Escolha sua localização e idioma.',
    zh: '选择您的位置和语言。',
    'zh-tw': '選擇您的位置和語言。',
    ja: '場所と言語を選択してください。',
    th: 'เลือกตำแหน่งที่ตั้งและภาษาของคุณ',
    ar: 'اختر موقعك ولغتك.',
  },
  CONTINUE: {
    en: 'Continue',
    es: 'Continuar',
    fr: 'Continuer',
    pt: 'Continuar',
    zh: '继续',
    'zh-tw': '繼續',
    ja: '続行',
    th: 'ดำเนินการต่อ',
    ar: 'استمرار',
  },
  AC_LS_OTHER_COUNTRY: {
    en: 'Other country or region',
    es: 'Otro país o región',
    fr: 'Autre pays ou région',
    pt: 'Outro país ou região',
    zh: '选择其他国家',
    'zh-tw': '選擇其他國家',
    ja: 'その他の国または地域',
    th: 'ประเทศหรือภูมิภาคอื่นๆ',
    ar: 'دولة أو منطقة أخرى',
  },
  LANGUAGE_NAME: {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    pt: 'Português',
    zh: '简体中文',
    'zh-tw': '繁體中文',
    ja: '日本語',
    th: 'ภาษาไทย',
    ar: 'العربية',
  },
};
/**
 * 获取指定键和语言对应的翻译
 * @param {string} key - 字典中的键名（如 'Company'）
 * @param {string} lang - 语言代码（如 'en', 'zh', 'fr'），不区分大小写
 * @returns {string} 翻译后的文本，若未找到则返回原 key 或空字符串
 */
function translate(key, lang) {
  // 参数校验
  if (!key || typeof key !== 'string') {
    return '';
  }

  if (!lang || typeof lang !== 'string') {
    return key; // 降级返回原 key
  }

  const normalizedLang = lang.toLowerCase();
  const entry = translateDictionary[key];

  // 若存在该条目
  if (entry) {
    if (entry[normalizedLang]) {
      return entry[normalizedLang];
    }
    if (entry[InitLanguage]) {
      return entry[InitLanguage];
    }
    if (entry.en) {
      return entry.en;
    }
    const firstLang = Object.values(entry)[0];
    if (firstLang) {
      return firstLang;
    }
  }

  // 完全找不到时，返回原 key 并给出警告
  // eslint-disable-next-line no-console
  console.warn(`translate: 未找到键 "${key}" 或语言 "${lang}" 的翻译`);
  return key;
}

export default translate;
