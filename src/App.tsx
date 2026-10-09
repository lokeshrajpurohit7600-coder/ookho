import { AntiGravityViewport } from './components/viewport/AntiGravityViewport';
import { defaultEngineConfig } from './config/engineConfig';

export function App() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      <AntiGravityViewport config={defaultEngineConfig} />
    </main>
  );
}

export default App;
