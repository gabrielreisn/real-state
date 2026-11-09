import { defineArrayMember, defineField, defineType } from 'sanity';

export const PAGE_FORMS = [{ title: 'Cadastro de imóvel (proprietários)', value: 'propertySubmission' }];

export const page = defineType({
  name: 'page',
  title: 'Página',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Endereço',
      description: 'A página abre em /<endereço>. Ex.: "sobre" abre em /sobre.',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) =>
        r.required().custom((slug) => (slug?.current === 'imovel' ? '"imovel" é usado pelas páginas de imóveis.' : true)),
    }),
    defineField({ name: 'description', title: 'Descrição para buscadores', type: 'text', rows: 2, validation: (r) => r.max(200) }),
    defineField({ name: 'showInMenu', title: 'Mostrar no menu "Informações"', type: 'boolean', initialValue: true }),
    defineField({ name: 'menuOrder', title: 'Ordem no menu', type: 'number', hidden: ({ document }) => !document?.showInMenu }),
    defineField({
      name: 'body',
      title: 'Conteúdo',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Parágrafo', value: 'normal' },
            { title: 'Subtítulo', value: 'h2' },
          ],
          marks: {
            decorators: [
              { title: 'Negrito', value: 'strong' },
              { title: 'Itálico', value: 'em' },
            ],
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'financingCalculator',
          title: 'Simulador de parcela',
          fields: [defineField({ name: 'note', title: 'Anotação interna', type: 'string' })],
          preview: { prepare: () => ({ title: 'Simulador de parcela' }) },
        }),
        defineArrayMember({
          type: 'object',
          name: 'linkCards',
          title: 'Lista de links',
          fields: [
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'linkCard',
                  fields: [
                    defineField({ name: 'label', title: 'Nome', type: 'string', validation: (r) => r.required() }),
                    defineField({ name: 'description', title: 'Descrição', type: 'string' }),
                    defineField({ name: 'url', title: 'Endereço (URL)', type: 'url', validation: (r) => r.required() }),
                    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
                    defineField({ name: 'rate', title: 'Taxa inicial', description: 'Aparece depois de "A partir de". Ex.: 10,26% a.a. + TR', type: 'string' }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'url' } },
                }),
              ],
            }),
          ],
          preview: { select: { links: 'links' }, prepare: ({ links }) => ({ title: `Lista de links (${links?.length ?? 0})` }) },
        }),
        defineArrayMember({
          type: 'object',
          name: 'mapEmbed',
          title: 'Mapa',
          fields: [
            defineField({ name: 'title', title: 'Título', type: 'string', initialValue: 'Localização' }),
            defineField({ name: 'address', title: 'Endereço', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'address' }, prepare: ({ title }) => ({ title: `Mapa: ${title ?? ''}` }) },
        }),
      ],
    }),
    defineField({
      name: 'form',
      title: 'Formulário',
      description: 'Mostra um formulário depois do conteúdo.',
      type: 'string',
      options: { list: PAGE_FORMS },
    }),
    defineField({ name: 'formTitle', title: 'Título do formulário', type: 'string', hidden: ({ document }) => !document?.form }),
  ],
  orderings: [{ title: 'Ordem no menu', name: 'menuOrder', by: [{ field: 'menuOrder', direction: 'asc' }] }],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: `/${slug ?? ''}` }) },
});
