import { defineField, defineType } from 'sanity';

// Same options as the old site's form; the website validates against these too.
export const SUBMISSION_PROPERTY_TYPES = [
  'Apartamento', 'Casa', 'Chalé-Pousada', 'Comercial', 'Condomínio Fechado', 'Escritório', 'Fazenda', 'Flat',
  'Galpão / Barracão', 'Garagem', 'Kitnet', 'Loja', 'Lote', 'Mansão', 'Pousada', 'Quiosque', 'Sala Comercial',
  'Sítio / Chácara', 'Terreno',
];
export const SUBMISSION_PURPOSES = ['Venda', 'Locação', 'Temporada'];

const submitted = { readOnly: true } as const;

/**
 * An owner offering a property through the "Cadastre seu Imóvel" page. Created by the website
 * with an ID like "submission.<uuid>": IDs with a dot are private in Sanity, so this personal data
 * is never readable through the public API even though the dataset is public.
 */
export const propertySubmission = defineType({
  name: 'propertySubmission',
  title: 'Cadastro de imóvel',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      title: 'Situação',
      type: 'string',
      options: {
        list: [
          { title: 'Novo', value: 'new' },
          { title: 'Em atendimento', value: 'inProgress' },
          { title: 'Concluído', value: 'done' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'new',
    }),
    defineField({ name: 'notes', title: 'Anotações internas', type: 'text', rows: 3 }),
    defineField({ name: 'name', title: 'Nome', type: 'string', ...submitted }),
    defineField({ name: 'phone', title: 'Telefone', type: 'string', ...submitted }),
    defineField({ name: 'email', title: 'E-mail', type: 'string', ...submitted }),
    defineField({ name: 'residenceCity', title: 'Cidade / estado onde mora', type: 'string', ...submitted }),
    defineField({ name: 'propertyType', title: 'Tipo de imóvel', type: 'string', ...submitted }),
    defineField({ name: 'purpose', title: 'Finalidade', type: 'string', ...submitted }),
    defineField({ name: 'propertyCity', title: 'Cidade / estado do imóvel', type: 'string', ...submitted }),
    defineField({ name: 'description', title: 'Descrição', type: 'text', rows: 6, ...submitted }),
    defineField({ name: 'submittedAt', title: 'Enviado em', type: 'datetime', ...submitted }),
  ],
  orderings: [{ title: 'Mais recentes', name: 'submittedAtDesc', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'name', type: 'propertyType', city: 'propertyCity', status: 'status', submittedAt: 'submittedAt' },
    prepare: ({ name, type, city, status, submittedAt }) => ({
      title: `${status === 'new' ? '● ' : ''}${name ?? 'Sem nome'}`,
      subtitle: [type, city, submittedAt ? new Date(submittedAt).toLocaleDateString('pt-BR') : null].filter(Boolean).join(' — '),
    }),
  },
});
