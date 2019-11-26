/* eslint-disable class-methods-use-this */
import Html from 'slate-html-serializer';

const BLOCK_TAGS = {
  p: 'paragraph',
  blockquote: 'block_quote',
  pre: 'code_block',
  h1: 'heading_one',
  h2: 'heading_two',
  h3: 'heading_three',
  h4: 'heading_four',
  h5: 'heading_five',
  h6: 'heading_six',
  li: 'list_item',
  ul: 'ul_list',
  ol: 'ol_list',
  br: 'linebreak',
  hr: 'horizontal_rule',
  n: 'softbreak',
};

const MARK_TAGS = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  // u: 'underline',
  s: 'strikethrough',
  code: 'code',
};

/**
 * Converts from HTML
 */
export class FromHTML {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
  }

  convert(editor, html) {
    this.editor = editor;
    this.serializer = new Html({
      rules: [{ deserialize: this.deserialize.bind(this) }],
      defaultBlock: 'paragraph'
    });
    return this.serializer.deserialize(html);
  }

  deserialize(el, next) {
    /* Handling common block tags */
    const tag = el.tagName.toLowerCase();
    const block = BLOCK_TAGS[tag];

    if (block) {
      return {
        object: 'block',
        type: block,
        nodes: next(el.childNodes),
      };
    }

    /* Handling mark tags */
    const mark = MARK_TAGS[tag];

    if (mark) {
      return {
        object: 'mark',
        type: mark,
        nodes: next(el.childNodes),
      };
    }

    /* Custom tag handler */
    const method = tag;

    if (typeof this[method] === 'function') {
      return this[method](el, next);
    }

    /* Serializing from plugin if defined */
    const plugin = this.pluginManager.findPlugin('html', tag);

    if (plugin && typeof plugin.fromHTML === 'function') {
      return plugin.fromHTML(this.editor, el, next);
    }
    console.log(`Unrecognized html tag: ${tag}`);
    return undefined;
  }

  /* Custom link handler */
  a(el, next) {
    return {
      object: 'inline',
      type: 'link',
      nodes: next(el.childNodes),
      data: {
        href: el.getAttribute('href'),
      },
    };
  }

  img(el, next) {
    return {
      object: 'inline',
      type: 'image',
      nodes: next(el.childNodes),
      data: {
        href: el.src,
        title: el.alt ? el.alt : ''
      },
    };
  }
}
