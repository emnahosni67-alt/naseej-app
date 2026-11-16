import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, HeartPulse, MapPin, ShieldCheck } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { Button } from '../components/ui';

/**
 * First screen of the app: brand, what it does, and one obvious way in.
 * Nothing else competes for attention here.
 */
export default function Welcome() {
  const { t, lang, setLang, languages, dir } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-deep text-white">
      {/* Deep Tunisian night sky + zellige lattice */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, #12699f 0%, #0a3a5c 42%, #061a2b 100%)',
        }}
      />
      <div className="zellige absolute inset-0 opacity-[0.5]" />

      {/* Language switcher: people should be able to read this before signing up. */}
      <div className="relative z-10 flex justify-end gap-1 p-4">
        {languages.map((item) => (
          <button
            key={item.id}
            onClick={() => setLang(item.id)}
            aria-pressed={lang === item.id}
            className={
              'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ' +
              (lang === item.id
                ? 'bg-white text-deep'
                : 'bg-white/10 text-white/80 hover:bg-white/20')
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Artwork */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          {/* Three arches — the Sidi Bou Said window, drawn in line only. */}
          <svg width="132" height="150" viewBox="0 0 132 150" fill="none" aria-hidden>
            <path
              d="M24 150V74c0-19 15-34 34-34s34 15 34 34v76"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
            <path
              d="M40 150V78c0-10 8-18 18-18s18 8 18 18v72"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.5"
            />
            <path d="M58 92v58" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <circle cx="58" cy="60" r="3" fill="#e0c072" />
          </svg>
          <div className="absolute inset-0 -z-10 blur-2xl" style={{ background: 'radial-gradient(circle, rgba(63,157,255,0.35), transparent 70%)' }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="mt-6 text-center text-[34px] font-extrabold leading-none tracking-tight"
        >
          {t('app.name')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mt-3 max-w-[30ch] text-center text-[13.5px] leading-relaxed text-white/70"
        >
          {t('welcome.subtitle')}
        </motion.p>

        <div className="mt-7 flex items-center gap-4 text-white/55">
          <Feature icon={<HeartPulse size={14} />} label={t('home.emergency')} />
          <span className="h-3 w-px bg-white/20" />
          <Feature icon={<MapPin size={14} />} label={t('home.transport')} />
          <span className="h-3 w-px bg-white/20" />
          <Feature icon={<ShieldCheck size={14} />} label={t('common.verified')} />
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 space-y-2.5 px-6 pb-8">
        <Button
          size="lg"
          fullWidth
          className="!bg-red !text-deep hover:!bg-white/90"
          onClick={() => navigate('/register')}
          icon={dir === 'rtl' ? <ArrowRight size={17} className="rotate-180" /> : <ArrowRight size={17} />}
        >
          {t('welcome.start')}
        </Button>

        <button
          onClick={() => navigate('/login')}
          className="w-full rounded-xl border border-white/25 py-3 text-[13px] font-bold text-white transition-colors hover:bg-white/10"
        >
          {t('welcome.have')}
        </button>

        <p className="pt-1 text-center text-[10px] leading-relaxed text-white/40">
          {t('emergency.notice')}
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold">
      {icon}
      {label}
    </span>
  );
}
