'use babel'

import * as Common from './common'

var fs = require('fs')

var weights = {
    '定义':1,
    '要点':2,
    '举例':3,
    '比较':4,
    // 'Oringin':5,
    'len':4
}

export function parseAnki(firstLine, content, matchArray, idx){
    if(idx == 0){
        var transPath = Common.getYouDaoOutPutTransPath()
        fs.writeFileSync(transPath, '')
    }
    var title = matchArray[1]
    var list = title.split(' ')
    var headReg = /^(\w+)\s*(<.*>)?\s+(\[.*\]|\/.*\/|.*)?/
    var mArray
    var sWord = title
    var sPhonetic = ''
    var sOringin = sWord
    if((mArray = title.match(headReg)) != null){
        sWord = mArray[2] && mArray[2] != '<note>' ?`${mArray[1]} ${mArray[2].substring(1, mArray[2].length-1)}`:mArray[1]
        sOringin = mArray[1]
        if(mArray[3]){
            sPhonetic = `<span id="phonetic"> ${mArray[3]} [sound:${mArray[1]}.mp3] </span> `
        }
    }
    var tagName = Common.getFileName()
    var eList = preDealAnswer(content)
    var additionaPa = eList[0]
    var sAddtionalPa = ''
    if (additionaPa) {
        sAddtionalPa = `<div id="additional-pattern"> ${additionaPa} </div>`
    }
    var entryList = eList[1]
    var answerList = []
    var quotient = parseInt(entryList.length / weights.len)
    if(quotient == 0) quotient = 1
    var tmpList = []
    var answer
    if(entryList.length == 1){
        var entry = entryList[0]
        var aList = genAnswer(sWord, sPhonetic, tagName, entry['v'])
        for (var i = aList.length; i < weights.len; i++) {
            aList.push('')
        }
        var ans = aList.join('\t')
        if(entry['subtitle']){
            var subTitleHtml = `<div class='subtitle'>${entry['subtitle']}</div>`
            answer = `${subTitleHtml} ${ans}`
        }
        else{
            answer = ans
        }
    }
    else{
        for (i = 0; i < weights.len; i++) {
            var start = i * quotient
            if (start < entryList.length) {
                tmpList = []
                var end
                end = i == weights.len - 1 ? entryList.length : start + quotient
                for (var j = start; j < end; j++) {
                    entry = entryList[j]
                    if(entry['subtitle']){
                        subTitleHtml = `<div class='subtitle'>${entry['subtitle']}</div>`
                        tmpList.push(subTitleHtml)
                    }
                    aList = genAnswer(sWord, sPhonetic, tagName, entry['v'])
                    ans = aList.join(' ')
                    tmpList.push(ans)
                }
                answerList.push(tmpList.join(' '))
            }
            else{
                answerList.push('')
            }
        }
        answer = answerList.join('\t')
    }
    var result =  `${sWord}\t${sOringin}\t${sPhonetic}\t${sAddtionalPa} ${answer}\t${tagName}\n`
    writeResult(result, idx)
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

function preDealAnswer(content) {
    var lines = content.split('\n')
    // 所有--开头的为子标题
    var subTitleHead = /^-- (.*)/
    var matchArray, subtitle
    var additionaPa
    var vList=[]
    var entryList =[]
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        // new start
        if ((matchArray = line.match(subTitleHead)) != null) {
            // 累积的字段归集
            if (subtitle || vList.length > 0) {
                entryList.push( { 'subtitle':subtitle, 'v':vList } )
            }
            // 新的字段
            subtitle = matchArray[1]
            vList=[]
        }
        else if(line && (matchArray = line.match(/^\+\+ (.*)/)) != null){
            additionaPa = matchArray[1]
        }
        else{
            // 普通行
            vList.push(`${line}`)
        }
    }
    // 处理最后一个字段
    entryList.push( { 'subtitle':subtitle, 'v':vList } )
    // // 如果没有任何子标题
    // if (entryList.length <= 0) {
    //     entryList.push( { 'v':vList } )
    // }else{
    // }
    return [additionaPa, entryList]
}

function genAnswer(sWord, sPhonetic, tagName, lines) {
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
            weight = parseInt(matchArray[1], 10)
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
        var str = parseContent(sWord, sPhonetic, tagName, o)
        rList.push(str)
    }
    return rList
}

function initObj(sWord, sPhonetic, tagName){
    return {
        'word':sWord,
        'phonetic':sPhonetic,
        'tag':tagName
    }
}

function parseContent(sWord, sPhonetic, tagName, o){
    var vList = o['v']
    var indx = o['w']
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
            var sBlock = gen_word_block_html(obj, indx)
            if(sBlock) resultList.push('<br>'+sBlock)
            // 清空累积的行
            obj = initObj(sWord, sPhonetic, tagName)
            var sType = matchArray[1]
            var sTrans = matchArray[2]
            var sEnTrans = sTrans
            var sChiTrans = ''
            var regex = /([^\u4e00-\u9fa5\\(]*)([\u4e00-\u9fa5\\(].*)/
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
    sBlock = gen_word_block_html(obj, indx)
    if(sBlock) resultList.push('<br>'+sBlock)
    return resultList.join(' ')
}

function gen_word_block_html(o, indx){
    // 判断是否有翻译需要生成
    gen_translation_card(o)
    var aList = []
    // 1. 例子
    if(o.paraList && o.paraList.length > 0 ){
        if(o.type){
            var sExampleHtml = `<p class='example'>${o.paraList[0]}</p><p class='example-other'>${o.paraList.slice(1).join('<br>')}</p>`
        }else{
            if(!o.type && !o.chiTrans && !o.note && !o.enTrans && indx!=4){
                sExampleHtml = `<p class='plain-example'>${o.paraList.join('<br>')}</p>`
            }
            else{
                sExampleHtml = `<p class='other'>${o.paraList.join('<br>')}</p>`
            }
        }
        aList.push(sExampleHtml)
    }
    // 2. 类型
    if(o.type){
        var sTypeHtml = `<span class="w-type">${o.type}</span>`
        aList.push(sTypeHtml)
    }
    // 3. 中文翻译
    if(o.chiTrans){
        var sChiTransHtml = `<span class="chi-trans">${o.chiTrans}</span>`
        aList.push(sChiTransHtml)
    }
    // 4. 中文解释
    if(o.note){
        var sNoteHtml = `<div class="chi-trans-detail">${o.note}</div>`
        aList.push(sNoteHtml)
    }
    // 5. 英文解释
    if(o.enTrans){
        if(!o.paraList || o.paraList.length == 0 ){
            var sEnTransHtml = `<p class='example'>${o.enTrans}</p>`
        }
        else{
            sEnTransHtml = `<p class="en-trans">${o.enTrans}</p>`
        }
        aList.push(sEnTransHtml)
    }
    if(aList.length > 0){
        return `<div> ${aList.join(' ')} </div> `
    }
    else{
        return ''
    }
}

function gen_translation_card(o){
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
