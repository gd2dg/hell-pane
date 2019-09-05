'use babel';

import * as Common from './common';

var fs = require('fs')

var weights = {
    '定义':1,
    '要点':2,
    '举例':3,
    '比较':4,
    'len':4
}

export function parseAnki(firstLine, content, matchArray, i){
    var title = matchArray[1]
    var idx = title.indexOf('[')
    var sWord = title
    var sPhonetic = ''
    if (idx > 0) {
        sWord = title.substr(0, idx).trim()
        sPhonetic = title.substr(idx)
    }
    var tagName = Common.getFileName()
    var answer = genAnswer(content)
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
    atom.workspace.open(fPath, {split:'right'})
}

function genAnswer(content) {
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
        rList.push(o['v'])
    }
    var left = weights.len - fieldList.length
    for (i = 0; i < left; i++) {
        rList.push('')
    }
    return rList.join('\t')
}

function parseContent(vList){
    var fistLine = vList[0]
    var matchArray
    var aList
    if((matchArray = fistLine.match(/(.*) -- (.*)/)) != null){
        // 首行确定 类型 英文解释 中文解释
        var sType = matchArray[1]
        var sTrans = matchArray[2]
        var sEnTrans = sTrans
        var sChiTrans = ''
        var regex = /([^\u4e00-\u9fa5]*)([\u4e00-\u9fa5].*)/
        matchArray = sTrans.match(regex)
        if(matchArray!=null){
            sEnTrans = matchArray[1]
            sChiTrans = matchArray[2]
        }
        var sTypeHtml = `<span class="w-type">${sType}</span>`
        var sEnTransHtml = `<span class="en-trans">${sEnTrans}</span>`
        var sChiTransHtml = `<span class="chi-trans">${sChiTrans}</span>`
        var sFirst =  `${sTypeHtml} -- ${sEnTransHtml} ${sChiTransHtml} `
        // 其余行作为例子
        for (var i = 1; i < vList.length; i++) {
            aList.push(`<div>${vList[i]}</div>`)
        }
        var sExampleHtml = `<p class='example'> ${aList.join('')} </p>`
        // 增加按钮
        var buttonHtml = '<button type="button" class="my-button" >\nTranslate\n</button>'
        return `${sFirst}\n${buttonHtml}\n${sExampleHtml}`
    }
    else{
        vList.forEach(function(item){
            aList.push(`<div>${item}</div>`)
        })
        return aList.join('')
    }
}
