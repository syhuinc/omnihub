import { ScreenHeader } from '../components/ScreenHeader';
import { useRouter } from '../app/Router';
import { getToolById } from './registry';

export function ToolRoute({ toolId }: { toolId: string }) {
  const { navigate } = useRouter();
  const tool = getToolById(toolId);

  return (
    <div className="screen">
      <ScreenHeader title={tool?.name ?? 'Tool'} onBack={() => navigate('/tools')} />
      <div className="screen__empty">
        <p>This tool isn't built yet — coming very soon.</p>
      </div>
    </div>
  );
}
