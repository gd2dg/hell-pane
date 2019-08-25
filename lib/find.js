'use babel';

import my_dict from './down'

export function find(){
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;
    let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor();
    my_dict.fetch(selectedText);
}

// moral
