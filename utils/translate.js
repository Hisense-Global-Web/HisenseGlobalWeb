// 给定默认语言，当没有适配的时候返回什么
const InitLanguage = 'zh';
// 翻译字典
const translateDictionary = {
  COMPANY: {
    en: 'Company',
    fr: 'Entreprise',
    es: 'Empresa',
    pt: 'Empresa',
    zh: '公司',
    ar: 'شركة',
    ja: '会社',
    th: 'บริษัท',
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
    console.warn('translate: 无效的键名', key);
    return '';
  }

  if (!lang || typeof lang !== 'string') {
    console.warn('translate: 无效的语言代码', lang);
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
  console.warn(`translate: 未找到键 "${key}" 或语言 "${lang}" 的翻译`);
  return key;
}

export default translate;
