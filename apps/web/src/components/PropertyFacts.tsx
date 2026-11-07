import clsx from 'clsx';
import type { PropertySummary } from '@/content/types';
import { plural } from '@/lib/format';

/** Written out in words, so they read the same to everyone, screen readers included. */
export function PropertyFacts({ property, className }: { property: PropertySummary; className?: string }) {
  const facts = [
    property.area !== undefined && `${property.area} m²`,
    property.bedrooms !== undefined && `${property.bedrooms} ${plural(property.bedrooms, 'quarto', 'quartos')}`,
    property.suites !== undefined && `${property.suites} ${plural(property.suites, 'suíte', 'suítes')}`,
    property.parking !== undefined && `${property.parking} ${plural(property.parking, 'vaga', 'vagas')}`,
  ].filter((fact) => fact !== false);

  if (facts.length === 0) return null;

  return (
    <ul className={clsx('flex flex-wrap gap-y-1 text-slate [&>li+li]:ml-3 [&>li+li]:border-l [&>li+li]:border-line [&>li+li]:pl-3', className)}>
      {facts.map((fact) => (
        <li key={fact}>{fact}</li>
      ))}
    </ul>
  );
}
