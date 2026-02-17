import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Megaphone, Store, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/goals', icon: Target, label: 'Goals', exact: false },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', exact: false },
  { to: '/marketplace', icon: Store, label: 'Marketplace', exact: true },
  { to: '/settings', icon: Settings, label: 'Settings', exact: true },
  { to: '/help', icon: HelpCircle, label: 'Help & Support', exact: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside
      className={cn(
        'h-full bg-neutral-25 flex flex-col flex-shrink-0 transition-all duration-200',
        open ? 'w-60' : 'w-16'
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 pt-2 pb-4 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={!open ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-full py-2 transition-all duration-150 whitespace-nowrap',
                open ? 'px-4' : 'px-0 justify-center',
                active
                  ? 'bg-plum-50 text-plum-700 font-semibold'
                  : 'text-cool-600 hover:bg-neutral-100'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                active ? 'text-plum-600' : ''
              )} />
              {open && <span className="text-body3">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
