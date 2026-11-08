import { defineArrayMember, defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configurações do site',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nome', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'brandName', title: 'Nome curto (logo)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Cargo', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'creci', title: 'CRECI', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'phone', title: 'Telefone', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      description: 'Somente números, com DDI. Ex.: 5527999999999',
      type: 'string',
      validation: (r) => r.required().regex(/^\d{12,13}$/),
    }),
    defineField({ name: 'email', title: 'E-mail', type: 'string', validation: (r) => r.required().email() }),
    defineField({ name: 'street', title: 'Endereço', type: 'string' }),
    defineField({ name: 'district', title: 'Bairro e cidade', type: 'string' }),
    defineField({ name: 'postalCode', title: 'CEP', type: 'string', validation: (r) => r.regex(/^\d{5}-?\d{3}$/) }),
    defineField({ name: 'addressLocality', title: 'Cidade', type: 'string' }),
    defineField({ name: 'addressRegion', title: 'Estado (UF)', type: 'string', validation: (r) => r.length(2) }),
    defineField({
      name: 'openingHours',
      title: 'Horário de atendimento',
      description: 'Usado pelos buscadores (Google) para mostrar quando o escritório está aberto.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'openingHoursEntry',
          fields: [
            defineField({
              name: 'days',
              title: 'Dias',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              options: {
                list: [
                  { title: 'Segunda', value: 'Monday' },
                  { title: 'Terça', value: 'Tuesday' },
                  { title: 'Quarta', value: 'Wednesday' },
                  { title: 'Quinta', value: 'Thursday' },
                  { title: 'Sexta', value: 'Friday' },
                  { title: 'Sábado', value: 'Saturday' },
                  { title: 'Domingo', value: 'Sunday' },
                ],
              },
            }),
            defineField({ name: 'opens', title: 'Abre', type: 'string', validation: (r) => r.regex(/^\d{2}:\d{2}$/) }),
            defineField({ name: 'closes', title: 'Fecha', type: 'string', validation: (r) => r.regex(/^\d{2}:\d{2}$/) }),
          ],
          preview: { select: { opens: 'opens', closes: 'closes', days: 'days' }, prepare: ({ opens, closes, days }) => ({ title: `${(days ?? []).length} dia(s), ${opens}–${closes}` }) },
        }),
      ],
    }),
    defineField({
      name: 'sameAs',
      title: 'Redes sociais e perfis',
      description: 'Links do Instagram, Facebook, Google Meu Negócio etc. Ajudam os buscadores a ligar os perfis ao site.',
      type: 'array',
      of: [defineArrayMember({ type: 'url' })],
    }),
    defineField({
      name: 'featuredProperties',
      title: 'Destaques da página inicial',
      description: 'Arraste para mudar a ordem.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'property' }] })],
      validation: (r) => r.unique(),
    }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
  ],
  preview: { prepare: () => ({ title: 'Configurações do site' }) },
});
