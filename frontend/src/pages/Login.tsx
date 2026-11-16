import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { errorKey } from '../lib/api';
import { Button, Field, Input } from '../components/ui';
import { AppBar } from '../components/AppShell';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location.state?.from ?? '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(credentials?: { identifier: string; password: string }) {
    setError(null);
    setLoading(true);
    try {
      const user = await login(
        credentials?.identifier ?? identifier,
        credentials?.password ?? password,
      );
      if (user.role === 'provider' || user.role === 'volunteer') navigate('/provider');
      else navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <AppBar title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} onBack={() => navigate('/welcome')} />

      <div className="flex-1 overflow-y-auto px-6 py-6 scroll-thin">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label={t('auth.login.identifier')} htmlFor="login-identifier">
              <Input
                id="login-identifier"
                inputMode="email"
                autoComplete="username"
                placeholder="+216 12 345 678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Field>

            <Field label={t('auth.login.password')} htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-danger/25 bg-danger/8 px-3 py-2.5 text-[12px] font-semibold text-danger"
              >
                {error}
              </p>
            )}

            <Button
  type="submit"
  size="lg"
  fullWidth
  loading={loading}
  icon={<LogIn size={17} />}
  style={{ backgroundColor: 'red', borderColor: 'red' }} // ou '#ef4444'
>
  {t('auth.login.submit')}
</Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              {t('auth.login.demo')}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="outline"
            fullWidth
            icon={<Sparkles size={15} />}
            onClick={() => submit({ identifier: 'admin@naseej.tn', password: 'Admin@2026' })}
          >
            {t('nav.admin')}
          </Button>
        </motion.div>
      </div>

      <div className="border-t border-line px-6 py-4">
        <p className="text-center text-[12.5px] text-muted">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-bold text-brand">
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
