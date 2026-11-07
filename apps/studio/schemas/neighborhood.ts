import { defineField, defineType } from 'sanity';

export const neighborhood = defineType({
  name: 'neighborhood',
  title: 'Bairro',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nome', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'city', title: 'Cidade', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'state', title: 'Estado', type: 'string', initialValue: 'ES', validation: (r) => r.required().length(2) }),
  ],
  preview: { select: { title: 'name', subtitle: 'city' } },
});
