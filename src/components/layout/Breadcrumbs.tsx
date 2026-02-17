import { useMemo } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { mockGoals, newGoal5, refreshedGoal5 } from '@/data/mock-goals';
import { useVera } from '@/hooks/use-vera';
import { BreadcrumbDropdown } from '@/components/layout/BreadcrumbDropdown';

export function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, goalName: contextGoalName, refreshedGoalIds } = useVera();

  // Build combined goals list including Vera-created goal
  // (must be above early return to satisfy Rules of Hooks)
  const allGoals = useMemo(() => {
    if (!goalCreated) return mockGoals;
    const wizardOverrides = {
      connectedDsp: goalConnectedDspLabel || undefined,
      ...(goalPlatform ? { platform: goalPlatform, platforms: [goalPlatform] } : {}),
      ...(goalMediaType ? { mediaType: goalMediaType } : {}),
      ...(contextGoalName ? { name: contextGoalName } : {}),
    } as const;
    const goal5Data = refreshedGoalIds.has('goal-5')
      ? { ...refreshedGoal5, ...wizardOverrides }
      : { ...newGoal5, ...wizardOverrides };
    return [goal5Data, ...mockGoals];
  }, [goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, contextGoalName, refreshedGoalIds]);

  // Only show breadcrumbs for nested goal/campaign pages
  if (!location.pathname.startsWith('/goals') || !params.goalId) return null;

  const goal = allGoals.find(g => g.id === params.goalId);
  const goalLabel = goal?.name ?? params.goalId;

  const allGoalItems = allGoals.map(g => ({ id: g.id, label: g.name }));

  const segments: React.ReactNode[] = [];

  // Root: "Goals" as a plain link
  segments.push(
    <Link key="root" to="/goals" className="text-cool-500 hover:text-plum-600 transition-colors">
      Goals
    </Link>
  );

  if (params.campaignId) {
    // Campaign detail: Goals > Goal (link) > [Campaign ▾]
    segments.push(
      <Link key="goal" to={`/goals/${params.goalId}`} className="text-cool-500 hover:text-plum-600 transition-colors">
        {goalLabel}
      </Link>
    );

    const campaign = goal?.campaigns.find(c => c.id === params.campaignId);
    const campaignLabel = `Campaign: ${campaign?.name ?? params.campaignId}`;
    const campaignItems = (goal?.campaigns ?? []).map(c => ({ id: c.id, label: `Campaign: ${c.name}` }));

    segments.push(
      <BreadcrumbDropdown
        key="campaign"
        currentLabel={campaignLabel}
        items={campaignItems}
        currentId={params.campaignId}
        onSelect={(id) => navigate(`/goals/${params.goalId}/campaigns/${id}`)}
        isLast
      />
    );
  } else {
    // Goal detail: Goals > [Goal ▾]
    segments.push(
      <BreadcrumbDropdown
        key="goal"
        currentLabel={goalLabel}
        items={allGoalItems}
        currentId={params.goalId}
        onSelect={(id) => navigate(`/goals/${id}`)}
        isLast
      />
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-body3 mb-4">
      {segments.map((segment, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-cool-400" />}
          {segment}
        </span>
      ))}
    </nav>
  );
}
