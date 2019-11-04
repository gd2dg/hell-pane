'use babel'

import Dict from './dict'
import Words from './words'
import Trans from './trans'

import * as Common from './common'

import xml2js from 'xml2js'
const parseString = xml2js.parseString

var fs = require('fs')
var path = require('path')

export function find(){
    execWordList(batch_find, single_find)
}

function single_find(word){
    atom.notifications.addSuccess(`hell-pane start consulting word ${word}...`)
    var starTime = Date.parse(new Date())
    var oDowner = new Dict(word)
    oDowner.fetch(word, 1).then(function(data){
        var endTime = Date.parse(new Date())
        var diff = (endTime - starTime) / 1000
        atom.clipboard.write(data)
        atom.notifications.addSuccess(`hell-pane finish consulting ${word} in ${diff} seconds!!`)
    })
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
    atom.notifications.addSuccess('hell-pane start batch consulting...')
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
        var promiseArray = []
        for (var j = start; j < end && j < wordList.length; j++) {
            var word = wordList[j]
            var oDowner = new Dict(word, j+1)
            var oPromise = Promise.race([
                oDowner.fetch(word, j+1),
                new Promise(resolve =>{
                    setTimeout( function(mord){
                        resolve(`# ${mord}\n`)
                    }.bind(null, word), 20000)})
            ])
            promiseArray.push(oPromise)
        }
        // query end
        Promise.all(promiseArray).then(function(data) {
            console.log(`------${innerStep} done!`)
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

export function get_brief(){
    execWordList(batch_get_brief)
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
        var oDowner = new Dict(word, i+1)
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
    var oDowner = new Dict()
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
}

export function get_translation(){
    var oDict = new Trans()
    oDict.getTranslation()
}

export function get_single_cigen(){
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor();
        if (selectedText) {
            atom.notifications.addSuccess('hell-pane start getting cigen ...')
            var starTime = Date.parse(new Date())
            var oDowner = new Dict(selectedText)
            oDowner.get_single_cigen(selectedText).then(function(r){
                var endTime = Date.parse(new Date())
                var diff = (endTime - starTime) / 1000
                var data = r['cigen']
                atom.clipboard.write(data.substr(3))
                atom.notifications.addSuccess(`hell-pane finish getting cigen in ${diff} seconds!!`)
            })
            return
        }
    }
}

function execWordList(exec, singleExec){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor()
        if (selectedText) {
            var matchArray
            if((matchArray = selectedText.match(/# (.*)/))!=null){
                selectedText = matchArray[1]
            }
            if (selectedText.indexOf(',')!=-1) {
                var r = selectedText.trim().split(',')
                r=r.filter(m=>m)
                r=r.map(m=>m.trim())
                exec(r)
            }
            else if (selectedText.indexOf('\n')!=-1) {
                r = selectedText.split('\n')
                r=r.filter(m=>m)
                r=r.map(m=>m.trim())
                exec(r)
            }
            else{
                if(singleExec){
                    singleExec(selectedText)
                }
                else{
                    exec([selectedText])
                }
            }
            return
        }
    }
    var youdaoFile = Common.getYouDaoInputFilePath()
    var wordsFile = Common.getWordListInputPath()
    if ( fs.existsSync(youdaoFile)) {
        var xml = fs.readFileSync(youdaoFile, 'utf-8')
        parseString(xml, function (err, result) {
            var itemList = result['wordbook'].item
            var aList = []
            for (var i = 0; i < itemList.length; i++) {
                var item = itemList[i]
                aList.push(item.word[0])
            }
            exec(aList)
        })
    }
    else if (fs.existsSync(wordsFile)) {
        var sText = fs.readFileSync(wordsFile, 'utf-8')
        var aList = sText.split('\n')
        var bList = []
        for (var i = 0; i < aList.length; i++) {
            var sLine = aList[i]
            var sWord = sLine.split(/\s+/)[0]
            bList.push(sWord)
        }
        exec(bList)
    }
    else{
        atom.notifications.addError(`${youdaoFile} or ${wordsFile} not exits`)
    }
}

export function gen_compare(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        var starTime = Date.parse(new Date())
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getText()
        var blockList = selectedText.split(/\n{2,}/)
        var headReg = /^# (.*)/
        var matchArray
        blockList = blockList.map(function(m, indx){
            if ((matchArray = m.match(headReg)) != null)
                return matchArray
            else
                return ''
        })
        blockList=blockList.filter(m=>m)
        atom.notifications.addSuccess('hell pane starts batch brief findging...')
        var i, rList = []
        var f = function(i){
            var line = blockList[i][1]
            var wordList = line.trim().split(',')
            wordList=wordList.filter(m=>m)
            wordList=wordList.map(m=>m.trim())
            var promiseArray = []
            for (var j = 0; j < wordList.length; j++) {
                var word = wordList[j]
                var oDowner = new Dict(word, j+1)
                promiseArray.push(oDowner.get_brief(word))
            }
            // query end
            Promise.all(promiseArray).then(function(data) {
                data = data.map(function(m, indx){
                    if (indx + 1 < 4) {
                        return `${indx + 1}.\n${m}`
                    } else {
                        return `${m}`
                    }
                })
                var sText = data.join('\n')
                var sResult = `${blockList[i][0]}\n${sText}\n`
                rList.push(sResult)
                if (i == blockList.length - 1) {
                    var endTime = Date.parse(new Date())
                    var diff = (endTime - starTime) / 1000
                    var final = rList.join('\n')
                    // atom.clipboard.write(rList.join('\n'))
                    editor.setText(final)
                    atom.notifications.addSuccess(`hell-pane has finished batch brief findging, all ${blockList.length} line in ${diff} seconds!!`)
                }
                else{
                    f(i+1)
                }
            })
        }
        f(0)
    }
}
