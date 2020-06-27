'use babel'

import * as Common from './common'
import opMgr from './opMgr'

import Anki from './ankiCard/anker'
import BasicAnki from './ankiCard/basicAnki'
import * as Htail from './ankiCard/htail'
import * as Bbc from './ankiCard/bbc'

var d = {
    'anki': Anki,
    'basic_anki': BasicAnki
}

var fs = require('fs')

export function parse(type = 'key'){
    const editor = atom.workspace.getActiveTextEditor();
    if(editor){
        const selection = editor.getSelectedText()
        if (selection) {
            new opMgr(selection).parse(type, function(result){
                // writeResult(result.join('\n\n'))
                var fPath = Common.getYouDaoOutPutFilePath()
                fs.writeFileSync(fPath, result.join('\n'))
                atom.workspace.open(fPath, {split:'down'})
            })
        }
        else{
            atom.notifications.addError('bad selection for parsing anki card matirial!!!!');
        }
    }
}

export function parseAnki(Name, firstLine, content, matchArray, idx){
    try {
        var obj = d[Name]
        var oAnki = new obj()
        var title = matchArray[1]
        var res = oAnki.parse(title, content)
    } catch (e) {
        console.log(e);
        res = `${title} parse anki error!!!`
    }
    return res
}

export function save_head(){
    Htail.save_head()
}

export function set_head(){
    Htail.set_head()
}

export function fill_note(){
    Htail.fill_note()
}

export function parseBBCListening(){
    Bbc.parseBBCListening()
}
