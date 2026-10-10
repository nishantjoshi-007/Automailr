import { Extension } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Paints every `{{field}}` in the editor as a `.tok` chip (and `.tok-unknown`
 * when the name is not a CSV column) with inline decorations. The document
 * itself stays plain text, so templates, HTML mode, Gemini and sending see
 * exactly what the user typed (D48).
 */
interface TokenState {
  headers: readonly string[];
  set: DecorationSet;
}

/** Dispatch `tr.setMeta(fieldTokensKey, headers)` when the CSV columns change. */
export const fieldTokensKey = new PluginKey<TokenState>("fieldTokens");

interface FieldTokensOptions {
  headers: readonly string[];
}

function build(doc: PMNode, headers: readonly string[]): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const m of node.text.matchAll(/\{\{(\w+)\}\}/g)) {
      const from = pos + (m.index ?? 0);
      const known = headers.includes(m[1]);
      decorations.push(
        Decoration.inline(from, from + m[0].length, {
          class: known ? "tok" : "tok tok-unknown",
          "data-field": m[1],
          ...(known ? {} : { title: `${m[1]} isn't a column in the file` }),
        }),
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}

export const FieldTokens = Extension.create<FieldTokensOptions>({
  name: "fieldTokens",

  addOptions() {
    return { headers: [] };
  },

  addProseMirrorPlugins() {
    const initial = this.options.headers;
    return [
      new Plugin<TokenState>({
        key: fieldTokensKey,
        state: {
          init: (_, { doc }) => ({ headers: initial, set: build(doc, initial) }),
          apply: (tr, old) => {
            const headers = tr.getMeta(fieldTokensKey) as readonly string[] | undefined;
            if (headers) return { headers, set: build(tr.doc, headers) };
            return tr.docChanged ? { headers: old.headers, set: build(tr.doc, old.headers) } : old;
          },
        },
        props: {
          decorations(state) {
            return fieldTokensKey.getState(state)?.set;
          },
        },
      }),
    ];
  },
});
