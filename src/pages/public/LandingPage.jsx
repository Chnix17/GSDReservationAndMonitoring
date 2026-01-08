import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaClipboardList, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { SecureStorage } from '../../utils/encryption';

const assetBasePath = window.location.pathname.startsWith('/gsd/grms') ? '/gsd/grms' : '';

const LandingPage = () => {
  const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
  const userRole = SecureStorage.getLocalItem('user_level');
  const userLevelId = SecureStorage.getLocalItem('user_level_id') || SecureStorage.getSessionItem('user_level_id');

  const roleMap = { '1': 'Admin' };
  const resolvedUserRole = userRole || roleMap[String(userLevelId)] || '';

  if (isLoggedIn && resolvedUserRole) {
    if (resolvedUserRole === 'Super Admin' || resolvedUserRole === 'Admin') {
      return <Navigate to="/Admin" replace />;
    }
    if (resolvedUserRole === 'Personnel') {
      return <Navigate to="/Personnel/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Dean' || resolvedUserRole === 'Secretary' || resolvedUserRole === 'Department Head' || resolvedUserRole === 'Principal') {
      return <Navigate to="/Department/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Faculty/Staff' || resolvedUserRole === 'School Head' || resolvedUserRole === 'SBO PRESIDENT' || resolvedUserRole === 'CSG PRESIDENT') {
      return <Navigate to="/Faculty/Dashboard" replace />;
    }
    if (resolvedUserRole === 'Driver') {
      return <Navigate to="/Driver/Dashboard" replace />;
    }
  }

  const heroBg = `${assetBasePath}/PHINMACOC.jpg`;
  const logo = `${assetBasePath}/phinma.png`;
  const defaultAvatar = `${assetBasePath}/default-avatar.jpg`;

  const profileChristian = `${assetBasePath}/profilenichanix.jpg`;
  const profileKyrstyll = `${assetBasePath}/profilenikrystyll.jpg`;
  const profileArmie = `${assetBasePath}/profileniarmie.jpg`;
  const profilePia = `${assetBasePath}/profilenipia.jpg`;

  const teamMembers = [
    { name: 'Christian Mark S Valle', role: 'Lead Developer', avatar: profileChristian },
    { name: 'Kyrstyll Ira Andrei T. Plaza', role: 'Lead Researcher', avatar: profileKyrstyll },
    { name: 'Armie Jane Timbal', role: 'Assistant Researcher', avatar: profileArmie },
    { name: 'Pia Balibagon', role: 'Assistant Researcher', avatar: profilePia },
    { name: 'Josh Ydrriane Pagapong', role: 'Database Designer', avatar: defaultAvatar },
    { name: 'Melanie Abalde', role: '', avatar: defaultAvatar },
  ];

  const features = [
    {
      icon: <FaClipboardList className="h-7 w-7" />,
      title: 'Unified Requests',
      description: 'One portal for service requests across the campus',
    },
    {
      icon: <FaUsers className="h-7 w-7" />,
      title: 'Transparent Approvals',
      description: 'Clear roles and steps for fast, accountable processing',
    },
    {
      icon: <FaCalendarAlt className="h-7 w-7" />,
      title: 'Real-Time Updates',
      description: 'Live status, notifications, and schedules you can trust',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PHINMA" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-primary-dark">PHINMA Cagayan De Oro College</div>
              <div className="text-xs text-slate-500">General Services Department</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#home" className="transition-colors hover:text-primary-dark">HOME</a>
            <a href="#about" className="transition-colors hover:text-primary-dark">ABOUT</a>
          </nav>

          <Link
            to="/login"
            className="rounded-lg bg-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary"
          >
            Login
          </Link>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-white/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-balance text-4xl font-extrabold leading-tight text-primary-dark md:text-5xl">
              Welcome to PHINMA Cagayan De Oro College General Services Department
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base text-slate-700 md:text-lg">
              Streamline campus service requests, approvals, and scheduling with one unified portal.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
              >
                View Features
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="text-xs font-semibold tracking-widest text-primary">FEATURES</div>
            <h2 className="mt-2 text-3xl font-extrabold text-primary-dark md:text-4xl">Why Choose Our System</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-modern-green text-primary-dark transition group-hover:bg-accent-light">
                  {f.icon}
                </div>
                <div className="mt-5 text-lg font-bold text-primary-dark">{f.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-gradient-to-b from-modern-green/40 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold text-primary-dark md:text-4xl">
            About the General Services Portal
          </h2>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <p className="text-base leading-relaxed text-slate-700 md:text-lg">
              The General Services Portal is a unified platform that supports campus operations across PHINMA Cagayan De Oro College.
              It helps users submit requests, track progress, and receive timely updates through a transparent approval flow.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-xl font-bold text-primary-dark md:text-2xl">Development Team</h2>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
            {teamMembers.map((m) => (
              <div key={m.name} className="text-center">
                <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-accent shadow-sm">
                  <img src={m.avatar || defaultAvatar} alt={m.name} className="h-full w-full object-cover" />
                </div>
                <div className="mt-4 text-sm font-bold text-primary-dark">{m.name}</div>
                <div className="mt-1 text-xs text-slate-500">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <div>© {new Date().getFullYear()} PHINMA Cagayan De Oro College - General Services Department</div>
          <div className="flex items-center gap-4">
            <a href="#home" className="hover:text-primary-dark">Home</a>
            <a href="#about" className="hover:text-primary-dark">About</a>
            <Link to="/login" className="hover:text-primary-dark">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
