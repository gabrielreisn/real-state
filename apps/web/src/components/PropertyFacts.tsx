import clsx from 'clsx';
import type { IconType } from 'react-icons';
import { FaBath, FaBed, FaCar, FaRulerCombined } from 'react-icons/fa6';
import type { PropertySummary } from '@/content/types';
import { plural } from '@/lib/format';

type Fact = { icon: IconType; text: string };

/**
 * Written out in words, so they read the same to everyone, screen readers included; the icons
 * only help scanning. Each fact wraps as a unit, so a narrow card never splits "3 quartos".
 */
export function PropertyFacts({ property, className }: { property: PropertySummary; className?: string }) {
  const facts = [
    property.area !== undefined && { icon: FaRulerCombined, text: `${property.area.toLocaleString('pt-BR')} m²` },
    property.bedrooms !== undefined && { icon: FaBed, text: `${property.bedrooms} ${plural(property.bedrooms, 'quarto', 'quartos')}` },
    property.suites !== undefined && { icon: FaBath, text: `${property.suites} ${plural(property.suites, 'suíte', 'suítes')}` },
    property.parking !== undefined && { icon: FaCar, text: `${property.parking} ${plural(property.parking, 'vaga', 'vagas')}` },
  ].filter((fact): fact is Fact => fact !== false);

  if (facts.length === 0) return null;

  return (
    <ul className={clsx('flex flex-wrap gap-x-4 gap-y-1.5 text-slate', className)}>
      {facts.map(({ icon: Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Icon aria-hidden className="shrink-0 text-[0.85em] opacity-70" />
          {text}
        </li>
      ))}
    </ul>
  );
}
