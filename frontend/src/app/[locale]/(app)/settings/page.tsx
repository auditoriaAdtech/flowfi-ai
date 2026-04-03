'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  User,
  Globe,
  DollarSign,
  Bell,
  Moon,
  Sun,
  Loader2,
  Crown,
  Check,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@/hooks/useApi';
import * as api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIERS = [
  {
    key: 'FREE',
    name: 'Free',
    price: '$0',
    priceMonth: '/mo',
    features: ['Basic dashboard', 'Manual tracking', 'Up to 50 transactions'],
    icon: User,
    color: 'border-muted',
  },
  {
    key: 'STARTER',
    name: 'Starter',
    price: '$5',
    priceMonth: '/mo',
    features: ['AI coach', 'OCR documents', 'Unlimited transactions', 'Financial score'],
    icon: Sparkles,
    color: 'border-blue-300',
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: '$10',
    priceMonth: '/mo',
    features: ['Everything in Starter', 'Investment plans', 'Marketplace access', 'Advanced analytics'],
    icon: Crown,
    color: 'border-purple-300',
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: '$25',
    priceMonth: '/mo',
    features: ['Everything in Pro', 'Priority AI support', 'Custom reports', 'API access'],
    icon: Crown,
    color: 'border-yellow-300',
  },
  {
    key: 'CORPORATE',
    name: 'Corporate',
    price: 'Custom',
    priceMonth: '',
    features: ['Everything in Premium', 'Multi-user', 'Dedicated support', 'Custom integrations'],
    icon: Building2,
    color: 'border-slate-400',
  },
];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');

  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLanguage(user.language || 'en');
      setCurrency(user.currency || 'USD');
    }
  }, [user]);

  const updateProfile = useMutation<unknown, [Record<string, unknown>]>((data) =>
    api.patch('/auth/profile', data)
  );

  const handleSave = async () => {
    await updateProfile.mutate({
      name,
      language,
      currency,
      notifications: {
        email: notifEmail,
        push: notifPush,
        alerts: notifAlerts,
      },
    });
  };

  const currentTier = user?.subscription ?? 'FREE';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {name?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t('language')}</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('currency')}</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar (CA$)</SelectItem>
                  <SelectItem value="MXN">MXN - Mexican Peso (MX$)</SelectItem>
                  <SelectItem value="GTQ">GTQ - Guatemalan Quetzal (Q)</SelectItem>
                  <SelectItem value="HNL">HNL - Honduran Lempira (L)</SelectItem>
                  <SelectItem value="NIO">NIO - Nicaraguan Cordoba (C$)</SelectItem>
                  <SelectItem value="CRC">CRC - Costa Rican Colon ({'\u20a1'})</SelectItem>
                  <SelectItem value="PAB">PAB - Panamanian Balboa (B/.)</SelectItem>
                  <SelectItem value="COP">COP - Colombian Peso (COL$)</SelectItem>
                  <SelectItem value="VES">VES - Venezuelan Bolivar (Bs.)</SelectItem>
                  <SelectItem value="PEN">PEN - Peruvian Sol (S/)</SelectItem>
                  <SelectItem value="BOB">BOB - Bolivian Boliviano (Bs)</SelectItem>
                  <SelectItem value="CLP">CLP - Chilean Peso (CL$)</SelectItem>
                  <SelectItem value="ARS">ARS - Argentine Peso (AR$)</SelectItem>
                  <SelectItem value="UYU">UYU - Uruguayan Peso ($U)</SelectItem>
                  <SelectItem value="PYG">PYG - Paraguayan Guarani ({'\u20b2'})</SelectItem>
                  <SelectItem value="BRL">BRL - Brazilian Real (R$)</SelectItem>
                  <SelectItem value="DOP">DOP - Dominican Peso (RD$)</SelectItem>
                  <SelectItem value="CUP">CUP - Cuban Peso ({'\u20b1'})</SelectItem>
                  <SelectItem value="JMD">JMD - Jamaican Dollar (J$)</SelectItem>
                  <SelectItem value="TTD">TTD - Trinidad & Tobago Dollar (TT$)</SelectItem>
                  <SelectItem value="BZD">BZD - Belize Dollar (BZ$)</SelectItem>
                  <SelectItem value="SRD">SRD - Surinamese Dollar (SRD)</SelectItem>
                  <SelectItem value="GYD">GYD - Guyanese Dollar (G$)</SelectItem>
                  <SelectItem value="HTG">HTG - Haitian Gourde (G)</SelectItem>
                  <SelectItem value="BSD">BSD - Bahamian Dollar (B$)</SelectItem>
                  <SelectItem value="BBD">BBD - Barbadian Dollar (BBD$)</SelectItem>
                  <SelectItem value="XCD">XCD - East Caribbean Dollar (EC$)</SelectItem>
                  <SelectItem value="AWG">AWG - Aruban Florin (Afl.)</SelectItem>
                  <SelectItem value="ANG">ANG - Netherlands Antillean Guilder (NAf.)</SelectItem>
                  <SelectItem value="KYD">KYD - Cayman Islands Dollar (CI$)</SelectItem>
                  <SelectItem value="BMD">BMD - Bermudian Dollar (BD$)</SelectItem>
                  <SelectItem value="FKP">FKP - Falkland Islands Pound (FK{'\u00a3'})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t('theme')}</label>
            <div className="mt-2 flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <button
              onClick={() => setNotifEmail(!notifEmail)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notifEmail ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  notifEmail ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Browser push notifications</p>
            </div>
            <button
              onClick={() => setNotifPush(!notifPush)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notifPush ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  notifPush ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Financial Alerts</p>
              <p className="text-xs text-muted-foreground">Budget and spending alerts</p>
            </div>
            <button
              onClick={() => setNotifAlerts(!notifAlerts)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notifAlerts ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  notifAlerts ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {t('subscription')}
          </CardTitle>
          <CardDescription>
            Current plan: <span className="font-semibold">{currentTier}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isCurrent = tier.key === currentTier;
              return (
                <div
                  key={tier.key}
                  className={cn(
                    'rounded-lg border-2 p-4 transition-shadow',
                    tier.color,
                    isCurrent && 'ring-2 ring-primary'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{tier.name}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.priceMonth}</span>
                  </div>
                  <ul className="mb-4 space-y-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        /* Would link to upgrade flow */
                      }}
                    >
                      {tier.key === 'CORPORATE' ? 'Contact Sales' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isLoading} size="lg">
          {updateProfile.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tc('save')}
        </Button>
      </div>
    </div>
  );
}
