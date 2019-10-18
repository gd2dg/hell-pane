'use babel';

import * as Common from './common';

var fs = require('fs')

import Dict from './dict'

var oDict = new Dict()

var weights = {
    '定义':1,
    '要点':2,
    '举例':3,
    '比较':4,
    'len':4
}


export function parseAnki(firstLine, content, matchArray, i){
    if(i == 0){
        var transPath = Common.getYouDaoOutPutTransPath()
        fs.writeFileSync(transPath, '')
    }
    var title = matchArray[1]
    var idx = title.indexOf('[')
    var sWord = title
    var sPhonetic = ''
    if (idx > 0) {
        sWord = title.substr(0, idx).trim()
        var idx2 = sWord.indexOf('<')
        if(idx2 > 0){
            sPhonetic = `<span id="phonetic"> ${title.substr(idx)} </span> [sound:${sWord.substr(0, idx2).trim()}.mp3]`
        }
        else{
            sPhonetic = `<span id="phonetic"> ${title.substr(idx)} </span> [sound:${sWord}.mp3]`
        }
    }
    var tagName = Common.getFileName()
    var answer = genAnswer(sWord, sPhonetic, tagName, content)
    var result =  `${sWord}\t${sPhonetic}\t${answer}\t${tagName}\n`
    writeResult(result, i)
}

function writeResult(result, i) {
    var fPath = Common.getYouDaoOutPutFilePath()
    if (i == 0) {
        fs.writeFileSync(fPath, result)
    }else{
        fs.appendFileSync(fPath, result)
    }
    atom.workspace.open(fPath, {split:'down'})
    var transPath = Common.getYouDaoOutPutTransPath()
    atom.workspace.open(transPath, {split:'down'})
}

function genAnswer(sWord, sPhonetic, tagName, content) {
    var lines = content.split('\n')
    // 所有序号开头的为子标题
    var regCollinsHead = /^(\d)\./
    var matchArray, weight
    var v, vList=[]
    var fieldList =[]
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        // new start
        if ((matchArray = line.match(regCollinsHead)) != null) {
            // 累积的字段归集
            if (vList.length > 0) {
                fieldList.push( { 'w':weight, 'v':vList } )
            }
            // 新的字段
            weight = parseInt(matchArray[1], 10);
            vList = []
        }
        else{
            // 普通行
            vList.push(`${line}`)
        }
    }

    // 如果没有任何子标题, 全部作为第一个字段
    if (fieldList.length <= 0) {
        fieldList.push( { 'w':1, 'v':vList } )
    }else{
    // 处理最后一个字段
        fieldList.push( { 'w':weight, 'v':vList } )
    }

    // 按字段排序
    fieldList.sort(function (a, b) {
        return a['w'] - b['w']
    })

    // 合并所有字段
    var rList = []
    for (i = 0; i < fieldList.length; i++) {
        var o = fieldList[i]
        var str = parseContent(sWord, sPhonetic, tagName, o['v'])
        rList.push(str)
    }
    var left = weights.len - fieldList.length
    for (i = 0; i < left; i++) {
        rList.push('')
    }
    return rList.join('\t')
}

function initObj(sWord, sPhonetic, tagName){
    return {
        'word':sWord,
        'phonetic':sPhonetic,
        'tag':tagName
    }
}

function parseContent(sWord, sPhonetic, tagName, vList){
    var resultList = []
    var obj = initObj(sWord, sPhonetic, tagName)
    for (var i = 0; i < vList.length; i++) {
        var sLine = vList[i]
        var matchArray
        // 首行确定 格式: 词汇类型 -- 英文解释 中文解释
        var matchFisrt = sLine && (matchArray = sLine.match(/(.*) -- (.*)/)) != null
        if(matchFisrt){
            // 遇到新的一行
            // 处理之前的块
            var sBlock = gen_word_block_html(obj)
            if(sBlock) resultList.push('<br>'+sBlock)
            // 清空累积的行
            obj = initObj(sWord, sPhonetic, tagName)
            var sType = matchArray[1]
            var sTrans = matchArray[2]
            var sEnTrans = sTrans
            var sChiTrans = ''
            var regex = /([^\u4e00-\u9fa5\(]*)([\u4e00-\u9fa5\(].*)/
            matchArray = sTrans.match(regex)
            if(matchArray!=null){
                sEnTrans = matchArray[1]
                sChiTrans = matchArray[2]
            }
            obj.type = sType
            obj.enTrans = sEnTrans
            obj.chiTrans = sChiTrans
        }
        else if(sLine && (matchArray = sLine.match(/^## (.*)/)) != null){
            obj.note = matchArray[1]
        }
        else{
            if (obj.paraList) {
                obj.paraList.push(sLine)
            }
            else{
                obj.paraList = []
                obj.paraList.push(sLine)
            }
        }
    }
    // 处理最后一个
    var sBlock = gen_word_block_html(obj)
    if(sBlock) resultList.push('<br>'+sBlock)
    return resultList.join(' ')
}

function gen_word_block_html(o){
    gen_anti_trans(o)
    var aList = []
    if(o.paraList && o.paraList.length > 0 ){
        if(o.type){
            var sExampleHtml = `<p class='example'>${o.paraList[0]}</p><p class='example-other'>${o.paraList.slice(1).join('<br>')}</p>`
        }else{
            sExampleHtml = `<p class='other'>${o.paraList.join('<br>')}</p>`
        }
        aList.push(sExampleHtml)
    }
    if(o.type){
        var sTypeHtml = `<span class="w-type">${o.type}</span>`
        aList.push(sTypeHtml)
    }
    if(o.chiTrans){
        var sChiTransHtml = `<span class="chi-trans">${o.chiTrans}</span>`
        aList.push(sChiTransHtml)
    }
    if(o.note){
        var sNoteHtml = `<div class="chi-trans-detail">${o.note}</div>`
        aList.push(sNoteHtml)
    }
    if(o.enTrans){
        var sEnTransHtml = `<p class="en-trans">${o.enTrans}</p>`
        aList.push(sEnTransHtml)
    }
    if(aList.length > 0){
        return `<div> ${aList.join(' ')} </div> `
    }
    else{
        return ``
    }
}

function gen_anti_trans(o){
    if(o && o.note && o.enTrans){
        var sText = `${o.note}\t${o.enTrans}\t${o.word} ${o.phonetic} ${o.chiTrans}\t\t\t${o.tag}\n`
        var transPath = Common.getYouDaoOutPutTransPath()
        if (fs.existsSync(transPath)) {
            fs.appendFileSync(transPath, sText)
        }else{
            fs.writeFileSync(transPath, sText)
        }
    }
}

// example
