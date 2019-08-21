'use babel';

import * as Common from './common';

import opMgr from './opMgr';
var fs = require('fs')
var parseString = require('xml2js').parseString;


export function gen_dict(fileName){
    var filename = Common.getFileName()
    var root = Common.getYouDaoOutPutPath()
    var inputFile = `${root}/${filename}.xml`;
    // var outputFile = `${root}/${filename}.md`;
    var xml = fs.readFileSync(inputFile, 'utf-8')

    parseString(xml, function (err, result) {
        var s = parseJs(result);
        // fs.writeFileSync(outputFile, s);
        new opMgr(s).parse('key')
        // atom.clipboard.write(s);
        atom.notifications.addSuccess('gen successfully!!, filename:' + filename);
    });
}

function parseJs(result){
    var itemList = result['wordbook'].item;
    var aList = [];
    for (var i = 0; i < itemList.length; i++) {
        var item = itemList[i];
        // aList.push(`# ${item.word} ${item.phonetic}\n`);
        // aList.push(`# ${item.word} /proune/ \n1.\n\n2.\n\n3.\n\n4.\n\n`);
        aList.push(`# ${item.word} ${item.phonetic} \n1.\n\n`);
    }
    var sResult = aList.join('\n\n');
    return sResult;
}

// 读取有道单词本导出的单词, 生成导入anki的形式首行

// input
// youdao.xml
// root <wordbook> </wordbook>
// entry <item> </item>
//  <word> </word>
//  <phonetic> </phonetic>

// output
// youdao.md
// #word1 phonetic1
// #word2 phonetic2
