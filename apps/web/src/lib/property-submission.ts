// Same options as the old site's form (and the Studio schema).
export const PROPERTY_TYPES = [
  'Apartamento', 'Casa', 'Chalé-Pousada', 'Comercial', 'Condomínio Fechado', 'Escritório', 'Fazenda', 'Flat',
  'Galpão / Barracão', 'Garagem', 'Kitnet', 'Loja', 'Lote', 'Mansão', 'Pousada', 'Quiosque', 'Sala Comercial',
  'Sítio / Chácara', 'Terreno',
];
export const PURPOSES = ['Venda', 'Locação', 'Temporada'];

export type PropertySubmission = {
  name: string;
  phone: string;
  email?: string;
  residenceCity?: string;
  propertyType: string;
  purpose: string;
  propertyCity: string;
  description: string;
};

export type ValidationResult = { ok: true; value: PropertySubmission } | { ok: false; fields: (keyof PropertySubmission)[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Brazilian numbers with area code: 10 or 11 digits, with or without +55 and punctuation.
const PHONE = /^\+?[\d\s().-]{10,30}$/;

/** Validates raw form input. Runs on the server, so it is the real check, not just a UX hint. */
export function validatePropertySubmission(input: Record<string, unknown>): ValidationResult {
  const text = (key: string, max: number) => {
    const value = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    return value.length <= max ? value : null;
  };

  const value = {
    name: text('name', 120),
    phone: text('phone', 30),
    email: text('email', 254),
    residenceCity: text('residenceCity', 120),
    propertyType: text('propertyType', 60),
    purpose: text('purpose', 20),
    propertyCity: text('propertyCity', 120),
    description: text('description', 4000),
  };

  const fields: (keyof PropertySubmission)[] = [];
  if (!value.name) fields.push('name');
  if (!value.phone || !PHONE.test(value.phone)) fields.push('phone');
  if (value.email === null || (value.email && !EMAIL.test(value.email))) fields.push('email');
  if (value.residenceCity === null) fields.push('residenceCity');
  if (!value.propertyType || !PROPERTY_TYPES.includes(value.propertyType)) fields.push('propertyType');
  if (!value.purpose || !PURPOSES.includes(value.purpose)) fields.push('purpose');
  if (!value.propertyCity) fields.push('propertyCity');
  if (!value.description) fields.push('description');
  if (fields.length > 0) return { ok: false, fields };

  return {
    ok: true,
    value: {
      name: value.name!,
      phone: value.phone!,
      email: value.email || undefined,
      residenceCity: value.residenceCity || undefined,
      propertyType: value.propertyType!,
      purpose: value.purpose!,
      propertyCity: value.propertyCity!,
      description: value.description!,
    },
  };
}
