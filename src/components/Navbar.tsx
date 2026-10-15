/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, InAppNotification } from '../types.ts';
import { Bell, LogOut, CheckCheck, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  notifications: InAppNotification[];
  onLogout: () => void;
  onSwitchRole: (role: 'Admin' | 'Franchisee' | 'Agent') => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateToNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications,
  onLogout,
  onSwitchRole,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roleBadge = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            ADMINISTRATOR
          </span>
        );
      case 'Agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5" />
            RECRUITMENT AGENT
          </span>
        );
      case 'Franchisee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Briefcase className="w-3.5 h-3.5" />
            FRANCHISE PARTNER
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E52320] to-[#FF5252] flex items-center justify-center shadow-md shadow-red-500/20 text-white font-extrabold text-xl tracking-tight">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#E52320]">Aice</span>
                <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  Operations
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Franchise Management & Recruitment Portal
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Role Badge */}
        <div className="hidden md:flex items-center gap-2">
          {roleBadge()}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Role Tester Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Test application as another authenticated role"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Switch Role
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test User Roles
                </div>
                <button
                  onClick={() => { onSwitchRole('Admin'); setShowRoleSwitcher(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${currentUser?.role === 'Admin' ? 'font-bold text-rose-600 bg-rose-50/50' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    Admin (Carlos Mendoza)
                  </span>
                  {currentUser?.role === 'Admin' && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Active</span>}
                </button>
                <button
                  onClick={() => { onSwitchRole('Agent'); setShowRoleSwitcher(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${currentUser?.role === 'Agent' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Agent (Maria Reyes)
                  </span>
                  {currentUser?.role === 'Agent' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Active</span>}
                </button>
                <button
                  onClick={() => { onSwitchRole('Franchisee'); setShowRoleSwitcher(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${currentUser?.role === 'Franchisee' ? 'font-bold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    Franchisee (Elena V.)
                  </span>
                  {currentUser?.role === 'Franchisee' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Active</span>}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E52320] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${!notif.isRead ? 'bg-amber-50/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile info */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.role}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                title="Log out of system"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
