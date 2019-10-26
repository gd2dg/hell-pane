'use babel';

import Downer from './down'
import Words from './words'
import Dict from './dict'

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
    // if(fs.existsSync(fPath)){
    //     atom.notifications.addWarning(`${fPath} already exist`)
    //     atom.workspace.open(fPath, {split:'right'})
    //     return
    // }
    fs.writeFileSync(fPath, '')
    atom.notifications.addSuccess(`hell-pane start batch consulting...`)
    var starTime = Date.parse(new Date())
    global.already = 0
    global.tmout = 0
    // 1. fecth-dict
    // start query
    // wordList = ['remind']
    var per = 20
    var step = Math.ceil(wordList.length/per)
    var resultList = []
    var stepFun =
    function (innerStep) {
        console.log(innerStep, step);
        var start = innerStep * per
        var end = start + per
        var promiseArray = [];
        for (var j = start; j < end && j < wordList.length; j++) {
            var word = wordList[j]
            var oDowner = new Downer(word, j+1)
            var oPromise = Promise.race([
                oDowner.fetch(word),
                new Promise(resolve =>{
                    setTimeout( function(mord){
                        resolve(`# ${mord}\n`)
                    }.bind(null, word), 20000)})
            ])
            promiseArray.push(oPromise);
        }
        // query end
        Promise.all(promiseArray).then(function(data) {
            console.log(`------${innerStep} done!`);
            var sText = data.join('\n')
            resultList.push(sText)
            if(innerStep == step - 1){
                var endTime = Date.parse(new Date())
                var diff = (endTime - starTime) / 1000
                // atom.clipboard.write(sText)
                var sResult = resultList.join('\n')
                fs.writeFileSync(fPath, sResult)
                atom.notifications.addSuccess(`hell-pane finish consulting, all ${global.tmout + global.already} words , ${global.tmout} timeout in ${diff} seconds!!, `)
                atom.workspace.open(fPath, {split:'right'})
            }
            else{
                stepFun(innerStep + 1)
            }
        })
    }
    stepFun(0)
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
            var matchArray
            if((matchArray = selectedText.match(/# (.*)/))!=null){
                selectedText = matchArray[1]
            }
            if (selectedText.indexOf(',')!=-1) {
                var r = selectedText.trim().split(',')
                r=r.filter(m=>m)
                batch_get_brief(r)
            }
            else if (selectedText.indexOf('\n')!=-1) {
                r = selectedText.split('\n')
                r=r.filter(m=>m)
                batch_get_brief(r)
            }
            else{
                single_get_brief(selectedText)
            }
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
    atom.notifications.addSuccess('hell-pane start batch consulting briefly...')
    var promiseArray = []
    for (var i = 0; i < wordList.length; i++) {
        var word = wordList[i]
        var oDowner = new Downer(word, i+1)
        promiseArray.push(oDowner.get_brief(word))
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
    atom.notifications.addSuccess('hell-pane start getting concept ...')
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

    var oWordsDowner = new Words()
    oWordsDowner.getWords()

    // var oDict = new Dict()
    // oDict.getTranslation()

}

function deal_words(data){
    var perNum = 50
    var sText
    var sub
    var fileName
    var idx
    var fPath = Common.getToelfPath()
    if(!fs.existsSync(fPath)) fs.mkdirSync(fPath)
    for (var i = 0; i < data.length / perNum; i++) {
        idx = i + 1;
        fileName = `list_${idx}`
        sub = data.slice(i*perNum, (i+1)*perNum)
        sText = sub.join('\n')
        var filePath = path.join(fPath, `${fileName}.md`)
        fs.writeFileSync(filePath, sText)
    }
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
            oDowner.get_single_cigen(selectedText).then(function(r){
                var endTime = Date.parse(new Date())
                var diff = (endTime - starTime) / 1000
                data = r['cigen']
                atom.clipboard.write(data.substr(3))
                atom.notifications.addSuccess(`hell-pane finish getting cigen in ${diff} seconds!!`)
            })
            return
        }
    }
}
