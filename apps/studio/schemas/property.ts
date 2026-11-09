import { defineArrayMember, defineField, defineType } from 'sanity';
import { AutoImageDescriptionInput } from '../components/AutoImageDescriptionInput';
import { CurrencyInput } from '../components/CurrencyInput';
import { slugify } from './slug';

const count = (name: string, title: string) =>
  defineField({ name, title, type: 'number', group: 'specs', validation: (r) => r.integer().min(0) });

const imageWithAlt = (title: string) =>
  defineArrayMember({
    type: 'image',
    title,
    options: { hotspot: true },
    fields: [
      defineField({ name: 'alt', title: 'Descrição da foto', type: 'string', components: { input: AutoImageDescriptionInput }, validation: (r) => r.required() }),
      defineField({ name: 'watermark', title: 'Aplicar marca d’água', type: 'boolean', initialValue: false }),
    ],
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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'main',
      description: 'Gerado a partir do título. Use apenas letras, números e hífens.',
      options: { source: 'title', slugify },
      validation: (r) => r.required(),
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
      title: 'Valor',
      description: 'Digite o valor em reais. Deixe em branco para exibir "Preço sob consulta".',
      type: 'number',
      group: 'main',
      components: { input: CurrencyInput },
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'neighborhood',
      title: 'Bairro',
      description: 'Deixe em branco só quando o imóvel não tiver um bairro definido, e preencha a cidade abaixo.',
      type: 'reference',
      group: 'main',
      to: [{ type: 'neighborhood' }],
      validation: (r) => r.custom((value, context) => (value || (context.document as { city?: string } | undefined)?.city ? true : 'Informe o bairro ou a cidade.')),
    }),
    defineField({
      name: 'city',
      title: 'Cidade (sem bairro)',
      description: 'Usada apenas quando o imóvel não tem bairro.',
      type: 'string',
      group: 'main',
      hidden: ({ document }) => Boolean(document?.neighborhood),
    }),
    defineField({ name: 'address', title: 'Endereço', type: 'string', group: 'main' }),
    defineField({
      name: 'cep',
      title: 'CEP',
      description: 'Posiciona o mapa na página do imóvel. Sem CEP, o mapa usa o endereço ou o bairro.',
      type: 'string',
      group: 'main',
      validation: (r) => r.regex(/^\d{5}-?\d{3}$/),
    }),
    defineField({ name: 'condominium', title: 'Condomínio', type: 'string', group: 'main' }),
    defineField({ name: 'inCondominium', title: 'Em condomínio', type: 'boolean', group: 'main' }),
    defineField({ name: 'condoFee', title: 'Condomínio (R$/mês)', type: 'number', group: 'main', validation: (r) => r.min(0) }),
    defineField({ name: 'iptu', title: 'IPTU (R$)', type: 'number', group: 'main', validation: (r) => r.min(0) }),

    defineField({ name: 'area', title: 'Área útil (m²)', type: 'number', group: 'specs', validation: (r) => r.min(0) }),
    defineField({ name: 'builtArea', title: 'Área construída (m²)', type: 'number', group: 'specs', validation: (r) => r.min(0) }),
    defineField({ name: 'landArea', title: 'Área do terreno (m²)', type: 'number', group: 'specs', validation: (r) => r.min(0) }),
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
      fields: [
        defineField({ name: 'alt', title: 'Descrição da foto', type: 'string', components: { input: AutoImageDescriptionInput }, validation: (r) => r.required() }),
        defineField({ name: 'watermark', title: 'Aplicar marca d’água', type: 'boolean', initialValue: false }),
      ],
      validation: (r) => r.required(),
    }),
    // Do not give this member a custom name: existing imported photos have `_type: "image"`.
    defineField({ name: 'gallery', title: 'Galeria', type: 'array', group: 'media', of: [imageWithAlt('Foto')] }),

    defineField({ name: 'excerpt', title: 'Chamada', description: 'Texto curto dos destaques.', type: 'text', rows: 3, group: 'content', validation: (r) => r.max(220) }),
    defineField({ name: 'summary', title: 'Resumo da ficha', description: 'Linha abaixo do título da página.', type: 'text', rows: 2, group: 'content' }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'object',
      group: 'content',
      fields: [
        defineField({
          name: 'body',
          title: 'Texto',
          description: 'Descrição livre, um parágrafo por linha. Os campos abaixo são opcionais e estruturam a página quando preenchidos.',
          type: 'text',
          rows: 12,
        }),
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
    select: { type: 'type', neighborhood: 'neighborhood.name', city: 'city', code: 'code', media: 'coverImage' },
    prepare: ({ type, neighborhood, city, code, media }) => ({ title: `${type ?? 'Imóvel'} em ${neighborhood ?? city ?? '—'}`, subtitle: `Cód. ${code}`, media }),
  },
});
