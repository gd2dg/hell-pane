'use babel';

import Downer from './down'
import News from './news'

import * as Common from './common';
import * as Youdao from './youdao';

var fs = require('fs')
var path = require('path')

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
    // wordList = ['remind']
    var promiseArray = [];
    for (var i = 0; i < wordList.length; i++) {
        var word = wordList[i]
        var oDowner = new Downer(word, i+1)
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

export function get_brief(){
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor();
        if (selectedText) {
            single_get_brief(selectedText)
            return
        }
    }
    Youdao.genWordList(batch_get_brief)
}

function single_get_brief(word){
    atom.notifications.addSuccess(`hell-pane start briefly consulting word ${word}...`)
    var starTime = Date.parse(new Date())
    var oDowner = new Downer(word)
    oDowner.get_brief(word).then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        atom.clipboard.write(data)
        atom.notifications.addSuccess(`hell-pane finish briefly consulting ${word} in ${diff} seconds!!`)
    })
}

function batch_get_brief(wordList){
    if (!wordList || wordList.length == 0) {
        atom.notifications.addError('no words to query!!!')
        return
    }
    // 1. fecth-dict
    // start query
    // wordList = ['remind']
    var starTime = Date.parse(new Date())
    atom.notifications.addSuccess(`hell-pane start batch consulting briefly...`)
    var promiseArray = [];
    for (var i = 0; i < wordList.length; i++) {
        var word = wordList[i]
        var oDowner = new Downer(word, i+1)
        promiseArray.push(oDowner.get_brief(word));
    }
    // query end
    Promise.all(promiseArray).then(function(data) {
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        var sText = data.join('\n')
        atom.clipboard.write(sText)
        atom.notifications.addSuccess(`hell-pane finish consulting briefly, all ${data.length} words in ${diff} seconds!!`)
    })

}

export function get_concept(){
    atom.notifications.addSuccess(`hell-pane start getting concept ...`)
    var starTime = Date.parse(new Date())
    var oDowner = new Downer()
    oDowner.parse_newconcept_urls().then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        atom.clipboard.write(data)
        atom.notifications.addSuccess(`hell-pane finish getting concept in ${diff} seconds!!`)
    })
}

export function get_toelf_words(){
    atom.notifications.addSuccess(`hell-pane start getting toelfwords ...`)
    var starTime = Date.parse(new Date())
    var oDowner = new Downer()
    oDowner.parse_toelf_urls().then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        // atom.clipboard.write(data)
        deal_words(data)
        atom.notifications.addSuccess(`hell-pane finish getting toelfwords in ${diff} seconds!!`)
    })
}

function deal_words(data){
    var perNum = 100
    var sText
    var sub
    var fileName
    var idx
    var fPath = Common.getToelfPath()
    if(!fs.existsSync(fPath)) fs.mkdirSync(fPath)
    for (var i = 0; i < data.length / perNum; i++) {
        idx = i + 1
        fileName = `list_${idx}`
        sub = data.slice(i*perNum, (i+1)*perNum)
        sText = sub.join('\n')
        filePath = path.join(fPath, `${fileName}.md`)
        fs.writeFileSync(filePath, sText)
    }
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

export function get_single_cigen(){
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor();
        if (selectedText) {
            atom.notifications.addSuccess(`hell-pane start getting cigen ...`)
            var starTime = Date.parse(new Date())
            var oDowner = new Downer()
            console.log(selectedText);
            oDowner.get_single_cigen(selectedText).then(function(data){
                var endTime = Date.parse(new Date())
                var diff = (endTime - starTime) / 1000
                atom.clipboard.write(data.substr(3))
                atom.notifications.addSuccess(`hell-pane finish getting cigen in ${diff} seconds!!`)
            })
            return
        }
    }
}
