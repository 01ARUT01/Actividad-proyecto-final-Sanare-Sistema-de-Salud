import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Calendar, Users, Home, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { UserRole } from '../types/auth';
import LanguageSelect from './LanguageSelect';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', labelKey: 'nav.home', icon: Home, roles: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] },
    { path: '/triage', labelKey: 'nav.triage', icon: Activity, roles: [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN] },
    { path: '/booking', labelKey: 'nav.booking', icon: Calendar, roles: [UserRole.PATIENT] },
    { path: '/admin', labelKey: 'nav.admin', icon: Users, roles: [UserRole.ADMIN] },
  ];

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role));
  const roleLabel = user ? t(`role.${user.role.toLowerCase()}`) : '';

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive ? 'bg-white text-blue-600 font-semibold' : 'hover:bg-blue-700 hover:-translate-y-0.5'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
      isActive ? 'bg-white text-blue-600 font-semibold' : 'bg-blue-700 hover:bg-blue-600'
    }`;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Activity className="w-8 h-8" />
            <span className="font-bold text-xl">{t('brand.full')}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} end={item.path === '/'} className={navLinkClass}>
                    <Icon className="w-5 h-5" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="border-l border-blue-400 h-8"></div>

            <div className="flex items-center space-x-3">
              <LanguageSelect />
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-blue-200">{roleLabel}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
                title={t('nav.logoutFull')}
              >
                <LogOut className="w-5 h-5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Activity className="w-7 h-7" />
              <span className="font-bold text-lg">{t('brand.short')}</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-blue-700 transition-all"
              aria-label={t('nav.toggleMenu')}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="pb-4 space-y-2">
              {/* User Info */}
              <div className="bg-blue-700 rounded-lg p-3 mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-200">{roleLabel}</p>
                </div>
                <LanguageSelect />
              </div>

              {/* Navigation Items */}
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={handleNavClick}
                    className={mobileLinkClass}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  handleNavClick();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('nav.logoutFull')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;