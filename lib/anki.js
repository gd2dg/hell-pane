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
    var editor = atom.workspace.getActiveTextEditor()
    var file = editor.getTitle()
    // fileName = file.split('.')[0]
    var fileName = Common.getFileName()
    var answer = genAnswer(fileName, content)
    var result =  `${title}\t${answer}\n`
    writeResult(result, fileName, i)
}

function writeResult(result, fileName, i) {
    var youdaoPath = Common.getYouDaoOutPutPath()
    var ankiPath = `${youdaoPath}\\anki-import\\`
    var fPath = `${ankiPath}${fileName}.md`
    if (i == 0) {
        fs.writeFileSync(fPath, result)
    }else{
        fs.appendFileSync(fPath, result)
    }
    atom.workspace.open(fPath, {split:'right'})
}

function genAnswer(fileName, content) {
    var lines = content.split('\n')
    var regHead = /^#+\s+(\S+)/
    var regCollinsHead = /^(\d)\./
    var matchArray, weight
    var k, v, vList=[]
    var fieldList =[]
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        // new start
        if ((matchArray = line.match(regCollinsHead)) != null) {
            if (vList.length > 0) {
                fieldList.push( { 'k':k, 'w':weight, 'v':vList.join('') } )
            }
            weight = parseInt(matchArray[1], 10);
            // weight = (k in weights) ? weights[k] : 0
            vList = []
        }
        else{
            // content
            vList.push(`<div>${line}</div>`)
            // vList.push(`${line}`)
        }
    }
    // 如果没有任何子标题
    if (fieldList.length <= 0) {
        k = '1.'
        fieldList.push( { 'k':k, 'w':1, 'v':vList.join('') } )
    }else{
    // 处理最后一个子块
        fieldList.push( { 'k':k, 'w':weight, 'v':vList.join('') } )
    }

    fieldList.sort(function (a, b) {
        return a['w'] - b['w']
    })

    var rList = []
    for (i = 0; i < fieldList.length; i++) {
        var o = fieldList[i]
        rList.push(o['v'])
    }
    var left = weights.len - fieldList.length
    for (i = 0; i < left; i++) {
        rList.push('')
        // rList.push('<div></div>')
    }
    // 增加一个tag字段
    rList.push(fileName)
    return rList.join('\t')
}
