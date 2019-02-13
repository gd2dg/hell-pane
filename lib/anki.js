'use babel';

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
    var answer = genAnswer(content)
    var result =  `${title}\t${answer}\n`
    writeResult(result, i)
}

function writeResult(result, i) {
    var ankiPath = 'G:\\anki-import\\'
    var editor = atom.workspace.getActiveTextEditor()
    var fileName = editor.getTitle()
    var fPath = `${ankiPath}${fileName}`
    console.log(i);
    if (i == 0) {
        fs.writeFileSync(fPath, result)
    }else{
        fs.appendFileSync(fPath, result)
    }
    atom.workspace.open(fPath, {split:'right'})
}

function genAnswer(content) {
    var lines = content.split('\n')
    var regHead = /^#+\s+(\S+)/
    var matchArray, weight
    var k, v, vList=[]
    var fieldList =[]
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        // new start
        if ((matchArray = line.match(regHead)) != null) {
            if (vList.length > 0) {
                fieldList.push( { 'k':k, 'w':weight, 'v':vList.join('') } )
            }
            k = matchArray[1]
            weight = (k in weights) ? weights[k] : 0
            vList = []
        }
        else{
            // content
            vList.push(`<div>${line}</div>`)
        }
    }
    // 如果没有任何子标题
    if (fieldList.length <= 0) {
        k = '定义'
        fieldList.push( { 'k':k, 'w':weights[k], 'v':vList.join('') } )
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
        rList.push('<div></div>')
    }
    return rList.join('\t')
}
