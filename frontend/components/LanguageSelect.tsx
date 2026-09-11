import React from 'react';
import { useI18n } from '../context/I18nContext';
import { LANG_CODES, LANG_LABELS } from '../i18n';

const VARIANT_CLASSES = {
  navbar: 'border-white/40 bg-blue-600 text-white focus:ring-white/60',
  page: 'border-gray-200 bg-white text-gray-800 focus:ring-blue-500 shadow-sm',
};

interface LanguageSelectProps {
  className?: string;
  variant?: 'navbar' | 'page';
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { lang, setLang } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as typeof lang)}
      aria-label={lang === 'zh' ? '语言' : 'Language'}
      className={[
        'rounded-lg border px-2 py-1.5 text-sm',
        'focus:outline-none focus:ring-2',
        'transition-all duration-200',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
    >
      {LANG_CODES.map((code) => (
        <option key={code} value={code} className="text-slate-900 bg-white">
          {LANG_LABELS[code]}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelect;