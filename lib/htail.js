'use babel'

import * as Common from './common'

var fs = require('fs')


export function save_head(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        var range = editor.getCurrentParagraphBufferRange()
        console.log(range);
        var txt = editor.getTextInRange(range)
        // editor.setTextInBufferRange(range, '11111')
        get_head(txt)
        // console.log(txt)
    }
}

function get_head(txt){
    var tails = txt.replace(/(.*)4.\n(.*)/, '$2')
    console.log('pp '+tails);
    // var lines = txt.split('\n')
    // var first, tail
    // return {
    //     'first' : first,
    //     'tail' : tail
    // }
}
