import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { MilestoneBanner } from './components/common/MilestoneBanner';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { DocumentIntakePage } from './components/intake/DocumentIntakePage';
import { ExtractionReviewPage } from './components/review/ExtractionReviewPage';
import { CompStagingPage } from './components/staging/CompStagingPage';
import { ExcelModelPage } from './components/excel/ExcelModelPage';
import { WordReportPage } from './components/report/WordReportPage';
import { QCReviewPage } from './components/qc/QCReviewPage';
import { AuditTrailPage } from './components/audit/AuditTrailPage';
import { ArchitecturePage } from './components/architecture/ArchitecturePage';

const AppContent: React.FC = () => {
  const { state } = useApp();

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'dashboard':
        return <DashboardPage />;
      case 'intake':
        return <DocumentIntakePage />;
      case 'review':
        return <ExtractionReviewPage />;
      case 'staging':
        return <CompStagingPage />;
      case 'excel':
        return <ExcelModelPage />;
      case 'report':
        return <WordReportPage />;
      case 'qc':
        return <QCReviewPage />;
      case 'audit':
        return <AuditTrailPage />;
      case 'architecture':
        return <ArchitecturePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <MilestoneBanner />
        <main className="flex-1 overflow-y-auto">
          {renderScreen()}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
