'use babel'

import Dict from './dict'
import Words from './words'
import Trans from './trans'
import Statistics from './statistics'

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

export function gen_compare2(){
    var callback = function (data){
        return data.map(function (value, index){
            return `${index + 1}\n${value}`
        })
    }
    var Fun = function (wordList){
        batch_get_brief(wordList, callback)
    }
    execWordList(Fun)
}

function batch_get_brief(wordList, callback){
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
        if(callback){
            callback(data)
        }
        else{
            var sText = data.join('\n')
            console.log(sText);
            atom.clipboard.write(sText)
        }
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

export function get_single_phonetic(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getWordUnderCursor()
        if (selectedText) {
            atom.notifications.addSuccess('hell-pane start getting phonetic ...')
            var starTime = Date.parse(new Date())
            var oDowner = new Dict(selectedText)
            oDowner.get_single_cigen(selectedText).then(function(r){
                var endTime = Date.parse(new Date())
                var diff = (endTime - starTime) / 1000
                var data = `${selectedText} ${r['phonetic']}`
                editor.selectWordsContainingCursors()
                editor.insertText(data)
                atom.clipboard.write(`${selectedText} ${r['phonetic']} ${r['basicTrans']}`)
                atom.notifications.addSuccess(`hell-pane finish getting phonetic in ${diff} seconds!!`)
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

function get_compare_blocks() {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        let selectedText = editor.getSelectedText() != '' ? editor.getSelectedText() : editor.getText()
        var blockList = selectedText.split(/\n{2,}/)
        var headReg = /^# (.*)/
        var matchArray
        blockList = blockList.map(function(m, indx){
            if ((matchArray = m.match(headReg)) != null){
                var sTitle = matchArray[0]
                var sLine = matchArray[1]
                var wordList = sLine.trim().split(',')
                wordList=wordList.filter(m=>m)
                wordList=wordList.map(m=>m.trim())
                return {'title': sTitle, 'words' : wordList, 'index':indx + 1}
            }
            else
                return ''
        })
        blockList=blockList.filter(m=>m)
        return blockList
    }
    return null
}

export function gen_compare(){
    var blockList = get_compare_blocks()
    if (!blockList) return
    var sta = new Statistics('gen_compare')
    sta.begin()
    var rList = blockList.map(function(obj){
        console.log(11111);
        return make_iter(obj)
    })
    console.log(2222);
    Promise.all(rList).then(function(data){
        atom.clipboard.write(data.join('\n\n'))
        sta.finish()
    })
    console.log(33333);
}

// 对于async函数的理解
// 这是一个异步操作函数, 函数里面存在异步操作
// 这是 Promise 的一种改写
// 调用这个函数，立即的返回值不是函数声明里指定的返回值， 即return的值(因为过程是异步的)
// 立即返回的是一个 Promise 对象, 当异步操作完成， 该promise对象resolve, 此时return的值, 会传入 resolve()中
// 函数调用者可以根据这个机制对promise执行后续操作


// async function yibu(){
//     var r = await fun()
//     return r
// }
// var t = yibu()
// console.log(t);

// 对于 var r = await fun(), 后面需要fun返回一个真实的 Promise-A对象, 来表明需要等待的操作
// await之后的代码都被延迟
// 当遇到await, 就会马上返回一个Promise-B对象给调用者(同步操作), 上面的打印看到， t是一个Promise对象,

//  当 Promise-A resolve 后  then方法中回调的返回值 传递给 r, 再将promise-B resolve, 将 最后的返回值 r 传出
// 可以猜测， 引擎做了以下的转化
// function yibu(){
//     return new Promise(function(resolve, reject) {
//         fun().then(function(m){
//             r = m
//             resolve(r)
//         })
//     });
// }

async function make_iter(obj){
    var wordList = obj['words']
    var promiseArray = []
    for (var j = 0; j < wordList.length; j++) {
        var word = wordList[j]
        var oDowner = new Dict(word, j+1)
        promiseArray.push(oDowner.get_compare_brief(word))
    }
    // query end
    var r = await Promise.all(promiseArray).then(function(data) {
        data = data.map(function(m, indx){
            return to_compare_block(m, indx)
        })
        return data.join('\n')
    })
    console.log(r);
    return `${obj['title']}\n${r}`
}

function to_compare_block(block, idx){
    var rList = [
        `${block['title']} ${block['phonetic']} [sound:${block['title']}.mp3]`,
        `${block['data']}`
    ]
    if (idx <= 4) rList.splice(0, 0, `${idx+1}.`)
    return rList.join('\n')
}

async function asyncFunction() {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve("i am resolved!"), 1000)
  });
  const result = await promise;
  // wait till the promise resolves (*)
  console.log(result); // "一秒后打印出 i am resolved！"
}
