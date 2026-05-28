// Корневой компонент Zero.ID — маршрутизация между экранами
import { useZeroStore } from './store/useZeroStore';
import { ZeroLogin } from './components/ZeroLogin';
import { ZeroProfiles } from './components/ZeroProfiles';
import { ZeroEditor } from './components/editor/ZeroEditor';
import { ZeroToast } from './components/ZeroToast';
import { ZeroDocs } from './components/ZeroDocs';

export default function App() {
  const { isAuthenticated, activeView, activeProfileId } = useZeroStore();

  // Не авторизован — показываем логин
  if (!isAuthenticated) {
    return (
      <>
        <ZeroLogin />
        <ZeroToast />
      </>
    );
  }

  // Маршрутизация по экранам
  const renderView = () => {
    if (activeView === 'editor' && activeProfileId) {
      return <ZeroEditor profileId={activeProfileId} />;
    }
    if (activeView === 'docs') {
      return <ZeroDocs />;
    }
    // Дефолт — список профилей
    return <ZeroProfiles />;
  };

  return (
    <>
      {renderView()}
      <ZeroToast />
    </>
  );
}
