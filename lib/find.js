'use babel';

import Downer from './down'
import News from './news'

import * as Common from './common';
import * as Youdao from './youdao';

var fs = require('fs')

export function find(){
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
        let selectedText = editor.getSelectedText()
        if (selectedText) {
            single_find(selectedText)
            return
        }
    }
    Youdao.genWordList(batch_find)
}

function batch_find(wordList){
    if (!wordList || wordList.length == 0) {
        atom.notifications.addError('no words to query!!!')
        return
    }
    // truncate output file
    var fPath = Common.getYouDaoOutEditFilePath()
    fs.writeFileSync(fPath, '')
    atom.notifications.addSuccess(`hell-pane start batch consulting...`)
    var starTime = Date.parse(new Date())
    // 1. fecth-dict
    // start query
    wordList = ['remind']
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
        var sText = data.join('\n')
        fs.writeFileSync(fPath, sText)
        atom.clipboard.write(sText)
        atom.notifications.addSuccess(`hell-pane finish consulting, all ${data.length} words in ${diff} seconds!!`)
        atom.workspace.open(fPath, {split:'right'})
    })
}

function single_find(word){
    atom.notifications.addSuccess(`hell-pane start consulting word ${word}...`)
    var starTime = Date.parse(new Date())
    var oDowner = new Downer(word)
    oDowner.fetch(word).then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        atom.clipboard.write(data)
        atom.notifications.addSuccess(`hell-pane finish consulting ${word} in ${diff} seconds!!`)
    })
}

export function getNews(){
    atom.notifications.addSuccess(`hell-pane start getting news ...`)
    var starTime = Date.parse(new Date())
    var oDowner = new News()
    oDowner.fetch().then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        atom.clipboard.write(data)
        atom.notifications.addSuccess(`hell-pane finish getting news in ${diff} seconds!!`)
    })

}
