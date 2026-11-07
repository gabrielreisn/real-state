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
