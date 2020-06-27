'use babel'

import Dict from './dictionary/dict'
import Words from './dictionary/words'
import Trans from './dictionary/trans'
import * as Archive from './dictionary/archive'

import Statistics from './statistics'

import * as Common from './common'

import xml2js from 'xml2js'
const parseString = xml2js.parseString

var fs = require('fs')

var oDict = new Dict()

export function find(){
    execWordList(batch_find, single_find)
}
function single_find(word){
    batch_find([word], false, true)
}
function batch_find(wordList, WriteFile = true, Clipboard=false){
    // wordList = wordList.filter(function(word) {
    //     if(Archive.existed(word, false)){
    //         console.log(word + ' is archived!');
    //         return false
    //     }
    //     return true
    // })
    // console.log(alreadyList);
    if (!wordList || wordList.length == 0) {
        atom.notifications.addError('no words to query!!!')
        return
    }
    oDict.batchFind(wordList, function(res){
        oDict.batchFindCiGen(wordList, function(res, res2){
            var myMap = new Map(res)
            var result = []
            for (let [w, oCigen] of res2) {
                var o = myMap.get(w)
                if(o){
                    result.push(oDict.to_final_string(o, oCigen))
                }
            }
            // %%
            var txt = result.join('\n')
            if(Clipboard)
                atom.clipboard.write(txt)
            if(WriteFile){
                // truncate output file
                var fPath = Common.getYouDaoOutEditFilePath()
                // %%
                fs.writeFileSync(fPath, txt)
                atom.workspace.open(fPath, {split:'right'})
                // if(fs.existsSync(fPath)){
                //     atom.notifications.addWarning(`${fPath} already exist`)
                //     atom.workspace.open(fPath, {split:'right'})
                //     return
                // }
            }
            // 更新archive
            // wordList.forEach((word, i) => {
            //     Archive.insert(word)
            // });
            // Archive.saveTries()
        }.bind(null, res))
    })
}

export function get_brief(){
    execWordList(batch_get_brief)
}
function batch_get_brief(wordList, callback){
    if (!wordList || wordList.length == 0) {
        atom.notifications.addError('no words to query!!!')
        return
    }
    oDict.getBrief(wordList, function(res){
        if(callback){
            callback(res)
        }
        else{
            var result = []
            for (var [word, o] of res) {
                var sText = oDict.to_brief_string(o)
                result.push(sText)
            }
            atom.clipboard.write(result.join('\n'))
        }
    })
}

export function get_single_phonetic(){
    var word = Common.getWordsFromEditor()
    if(word){
        oDict.get_single_phonetic([word], function([[word, o]]){
            var r = oDict.to_single_phonetic(o)
            var data = `${word} ${r['phonetic']}`
            atom.clipboard.write(`${word} ${r['phonetic']}  ${r['answer']}`)
            let editor = atom.workspace.getActiveTextEditor()
            if(editor){
                editor.selectWordsContainingCursors()
                editor.insertText(data)
            }
        })
    }
}

export function get_single_cigen(){
    var word = Common.getWordsFromEditor()
    if(word){
        oDict.batchFindCiGen([word], function([[word, oCigen]]){
            // var data = r['cigen']
            var t = oCigen.cigen.substr(3).replace('\n', ' ')
            atom.clipboard.write(t)
        })
    }
    return
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

export function get_concept(){
    atom.notifications.addSuccess('hell-pane start getting concept ...')
    var starTime = Date.parse(new Date())
    oDict.parse_newconcept_urls().then(function(data){
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

function getWords(){
    var t = Common.getWordsFromEditor()
    return t != null? t:getWordsFromFile()
}

function getWordsFromFile(){
    // %%
    var youdaoFile = Common.getYouDaoInputFilePath()
    if ( fs.existsSync(youdaoFile)) {
        var xml = fs.readFileSync(youdaoFile, 'utf-8')
        parseString(xml, function (err, result) {
            var itemList = result['wordbook'].item
            var aList = []
            for (var i = 0; i < itemList.length; i++) {
                var item = itemList[i]
                aList.push(item.word[0])
            }
            return aList
        })
    }
    // %%
    var wordsFile = Common.getWordListInputPath()
    if (fs.existsSync(wordsFile)) {
        var sText = fs.readFileSync(wordsFile, 'utf-8')
        var aList = sText.split('\n')
        var bList = []
        for (var i = 0; i < aList.length; i++) {
            var sLine = aList[i]
            var sWord = sLine.split(/\s+/)[0]
            bList.push(sWord)
        }
        return bList
    }
    atom.notifications.addError(`${youdaoFile} or ${wordsFile} not exits`)
    return null
}

function execWordList(exec, singleExec){
    var words = getWords()
    if(!words){
        return
    }
    if(words instanceof Array){
        exec(words)
    }
    else{
        if(singleExec){
            singleExec(words)
        }
        else{
            exec([words])
        }
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
        var oDict = new Dict(word, j+1)
        promiseArray.push(oDict.get_compare_brief(word))
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
