import { defineArrayMember, defineField, defineType } from 'sanity';

const count = (name: string, title: string) =>
  defineField({ name, title, type: 'number', group: 'specs', validation: (r) => r.integer().min(0) });

const imageWithAlt = (name: string, title: string) =>
  defineArrayMember({
    type: 'image',
    name,
    title,
    options: { hotspot: true },
    fields: [defineField({ name: 'alt', title: 'Descrição da foto', type: 'string', validation: (r) => r.required() })],
  });

export const property = defineType({
  name: 'property',
  title: 'Imóvel',
  type: 'document',
  groups: [
    { name: 'main', title: 'Principal', default: true },
    { name: 'specs', title: 'Ficha técnica' },
    { name: 'media', title: 'Fotos' },
    { name: 'content', title: 'Descrição' },
  ],
  fields: [
    defineField({ name: 'code', title: 'Código', type: 'string', group: 'main', validation: (r) => r.required() }),
    defineField({
      name: 'title',
      title: 'Título da página',
      description: 'Ex.: Apartamento para Venda, Vila Velha / ES',
      type: 'string',
      group: 'main',
    }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'main', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({
      name: 'legacyId',
      title: 'ID no site antigo',
      description: 'Mantém o endereço antigo (/imovel/<id>/<slug>) funcionando. Em imóveis novos, deixe em branco e o código é usado.',
      type: 'string',
      group: 'main',
    }),
    defineField({
      name: 'externalUrl',
      title: 'Anúncio no site antigo',
      description: 'Enquanto preenchido, o imóvel abre neste endereço em vez de ter página própria aqui. Apague quando o anúncio estiver completo.',
      type: 'url',
      group: 'main',
    }),
    defineField({
      name: 'type',
      title: 'Tipo',
      type: 'string',
      group: 'main',
      options: {
        list: [
          'Apartamento', 'Casa', 'Casa Comercial', 'Casa em Condomínio', 'Chácara', 'Cobertura', 'Comercial', 'Fazenda',
          'Galpão', 'Loja Comercial', 'Residencial e Comercial', 'Sala Comercial', 'Sítio', 'Sobrado', 'Terreno', 'Terreno Comercial',
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'purpose',
      title: 'Finalidade',
      type: 'string',
      group: 'main',
      options: { list: ['Venda'] },
      initialValue: 'Venda',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'price',
      title: 'Valor (R$)',
      description: 'Deixe em branco para exibir "Preço sob consulta".',
      type: 'number',
      group: 'main',
      validation: (r) => r.min(0),
    }),
    defineField({ name: 'neighborhood', title: 'Bairro', type: 'reference', group: 'main', to: [{ type: 'neighborhood' }], validation: (r) => r.required() }),
    defineField({ name: 'address', title: 'Endereço', type: 'string', group: 'main' }),
    defineField({ name: 'condominium', title: 'Condomínio', type: 'string', group: 'main' }),
    defineField({ name: 'inCondominium', title: 'Em condomínio', type: 'boolean', group: 'main' }),

    defineField({ name: 'area', title: 'Área útil (m²)', type: 'number', group: 'specs', validation: (r) => r.min(0) }),
    defineField({ name: 'builtArea', title: 'Área construída (m²)', type: 'number', group: 'specs', validation: (r) => r.min(0) }),
    count('bedrooms', 'Dormitórios'),
    count('suites', 'Suítes'),
    count('bathrooms', 'Banheiros'),
    count('parking', 'Vagas'),
    count('livingRooms', 'Salas'),

    defineField({
      name: 'coverImage',
      title: 'Foto de capa',
      description: 'Usada nos cartões e nos destaques.',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Descrição da foto', type: 'string', validation: (r) => r.required() })],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'gallery', title: 'Galeria', type: 'array', group: 'media', of: [imageWithAlt('galleryImage', 'Foto')] }),

    defineField({ name: 'excerpt', title: 'Chamada', description: 'Texto curto dos destaques.', type: 'text', rows: 3, group: 'content', validation: (r) => r.max(220) }),
    defineField({ name: 'summary', title: 'Resumo da ficha', description: 'Linha abaixo do título da página.', type: 'text', rows: 2, group: 'content' }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'object',
      group: 'content',
      fields: [
        defineField({ name: 'headline', title: 'Chamada', type: 'string' }),
        defineField({ name: 'intro', title: 'Introdução', type: 'text', rows: 2 }),
        defineField({ name: 'highlights', title: 'Destaques do imóvel', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        defineField({ name: 'condominiumTitle', title: 'Título do condomínio', type: 'string' }),
        defineField({ name: 'condominiumItems', title: 'Itens do condomínio', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        defineField({ name: 'whyTitle', title: 'Título do argumento', type: 'string' }),
        defineField({ name: 'whyText', title: 'Argumento', type: 'text', rows: 3 }),
        defineField({ name: 'closing', title: 'Parágrafos finais', type: 'array', of: [defineArrayMember({ type: 'text', rows: 2 })] }),
        defineField({ name: 'disclaimers', title: 'Avisos', type: 'array', of: [defineArrayMember({ type: 'text', rows: 2 })] }),
      ],
    }),
    defineField({
      name: 'featureGroups',
      title: 'Características',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'featureGroup',
          fields: [
            defineField({ name: 'title', title: 'Grupo', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'items', title: 'Itens', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
    }),
    defineField({
      name: 'similar',
      title: 'Imóveis semelhantes',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'property' }] })],
      validation: (r) => r.unique().max(6),
    }),
  ],
  orderings: [{ title: 'Mais recentes', name: 'codeDesc', by: [{ field: 'code', direction: 'desc' }] }],
  preview: {
    select: { type: 'type', neighborhood: 'neighborhood.name', code: 'code', media: 'coverImage' },
    prepare: ({ type, neighborhood, code, media }) => ({ title: `${type ?? 'Imóvel'} em ${neighborhood ?? '—'}`, subtitle: `Cód. ${code}`, media }),
  },
});
