'use babel';

import Downer from './down'

import * as Common from './common';
import * as Youdao from './youdao';

var fs = require('fs')

export function find(){
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;
    let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor();
    Youdao.genWordList((wordList) =>{
        if (!wordList || wordList.length == 0) {
            atom.notifications.addError('no words to query!!!')
            return
        }
        // truncate output file
        var fPath = Common.getYouDaoOutPutFilePath()
        fs.writeFileSync(fPath, '')
        atom.notifications.addSuccess(`hell-pane query start...`)
        var starTime = Date.parse(new Date())
        // start query
        var promiseArray = [];
        for (var i = 0; i < wordList.length; i++) {
            var word = wordList[i]
            var oDowner = new Downer(word)
            promiseArray.push(oDowner.fetch(word));
        }
        // query end
        Promise.all(promiseArray).then(function(data) {
            var endTime = Date.parse(new Date())
            var diff = (endTime - starTime) / 1000
            fs.writeFileSync(fPath, data.join('\n'))
            atom.notifications.addSuccess(`hell-pane query ${data.length} words in ${diff} seconds!!`)
            atom.workspace.open(fPath, {split:'right'})
        })
    })
}

// happy
