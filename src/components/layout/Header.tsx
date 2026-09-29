import React from 'react';
import {
  Building2,
  ChevronDown,
  MonitorCheck,
  Shield,
  UserCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { state, dispatch, activeJob, addToast, addAudit } = useApp();

  const handleRoleChange = async (newRole: UserRole) => {
    dispatch({ type: 'SET_ROLE', payload: newRole });
    addToast({
      type: 'info',
      title: `Switched Role to ${newRole}`,
      message:
        newRole === 'Reviewer'
          ? 'RLS active: Approval actions disabled. Comments & QC review permitted.'
          : newRole === 'Appraiser'
          ? 'RLS active: Certified Appraiser authority with evidence verification requirements.'
          : 'RLS active: Administrative audit & policy inspection authority.',
    });

    await addAudit({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: newRole === 'Appraiser' ? 'M. Alvarez, MAI' : newRole === 'Reviewer' ? 'S. Patel, Specialist' : 'E. Vance, Compliance Admin',
      actorType: 'USER',
      action: 'READ',
      object: 'UserSession:RoleSwitch',
      details: `Switched execution role to ${newRole}. Row-level security permissions re-evaluated.`,
    });
  };

  const getRoleUser = (role: UserRole) => {
    switch (role) {
      case 'Appraiser':
        return 'M. Alvarez, MAI';
      case 'Reviewer':
        return 'S. Patel, Reviewer';
      case 'Admin':
        return 'E. Vance, Admin';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E5E0] px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      {/* Left: Job Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="job-selector" className="sr-only">Select Appraisal Job</label>
              <select
                id="job-selector"
                value={state.selectedJobId}
                onChange={e => dispatch({ type: 'SET_JOB', payload: e.target.value })}
                className="font-bold text-xs text-gray-900 bg-transparent border-0 cursor-pointer focus:ring-0 p-0 pr-6 appearance-none font-mono"
              >
                {state.jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.code} · {job.propertyType}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none -ml-5" />
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-600 font-medium">{activeJob.subjectAddress}, {activeJob.cityState}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>Client: <strong className="text-gray-700 font-medium">{activeJob.client}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Due {activeJob.dueDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls: Runner badge, RLS badge, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Windows 365 Cloud PC Runner Status */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <MonitorCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px] font-medium text-slate-700">
              Windows 365 Runner: <strong className="text-emerald-700 font-semibold">Online</strong>
            </span>
          </div>
        </div>

        {/* Row Level Security Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
            state.currentRole === 'Reviewer'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-teal-50/80 border-teal-200 text-teal-900'
          }`}
          title={
            state.currentRole === 'Reviewer'
              ? 'Reviewer Role: Approvals locked by Row-Level Security'
              : 'Appraiser Role: Authorized to verify evidence & approve comps'
          }
        >
          <Lock className="w-3.5 h-3.5 text-current opacity-80" />
          <span className="text-[11px] font-mono font-medium">
            RLS: {state.currentRole === 'Reviewer' ? 'Read/Comment Only' : 'Appraiser Signing Authority'}
          </span>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {(['Appraiser', 'Reviewer', 'Admin'] as UserRole[]).map(role => {
            const isActive = state.currentRole === role;
            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* User Identity Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
            {state.currentRole === 'Appraiser' ? 'MA' : state.currentRole === 'Reviewer' ? 'SP' : 'EV'}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-gray-900 leading-tight">
              {getRoleUser(state.currentRole)}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {state.currentRole === 'Appraiser' ? 'MAI #41829' : state.currentRole === 'Reviewer' ? 'Review Analyst' : 'Security Admin'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
