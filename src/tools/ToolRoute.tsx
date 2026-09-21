import { ScreenHeader } from '../components/ScreenHeader';
import { useRouter } from '../app/Router';
import { getToolById } from './registry';
import { Calculator } from './calculator/Calculator';

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  calculator: Calculator,
};

export function ToolRoute({ toolId }: { toolId: string }) {
  const { navigate } = useRouter();
  const tool = getToolById(toolId);
  const ToolComponent = TOOL_COMPONENTS[toolId];

  if (ToolComponent) {
    return <ToolComponent />;
  }

  return (
    <div className="screen">
      <ScreenHeader title={tool?.name ?? 'Tool'} onBack={() => navigate('/tools')} />
      <div className="screen__empty">
        <p>This tool isn't built yet — coming very soon.</p>
      </div>
    </div>
  );
}
