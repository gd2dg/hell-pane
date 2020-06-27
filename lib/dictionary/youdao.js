'use babel'

import request from 'request';
import querystring from 'querystring';
import * as Common from '../common';

var fs = require('fs')
var path = require('path')

import Downer from './downer'

export default class Youdao extends Downer {

    constructor() {
        super()
        this.logType = 'youdao'
        this.batchTimeOut = 3000
    }
    getDictUrl(word){
        return `https://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
    }
    getPhoneticUrl(word){
        return `https://dict.youdao.com/dictvoice?audio=${querystring.escape(word)}&type=2`
    }

    setBatchProvider(type){
        this.subLogType = type
        this.batchProvider = function (word){
            return this.fetch(word, 1)
        }
    }

    setSingleProvider(){
        this.singleProvider = function (word){
            return this.fetch(word, 1)
        }
    }

    fetch(word, i) {
        return this.download(this.getDictUrl(word), this.do_download_dict.bind(this, word))
    }

    do_download_dict(word, resolve, docRoot){
        var oResult = this.getBasicResultObject(word, docRoot)
        // down phonetic // if (oResult)
        this.downPhonetic(word)
        resolve([[word, oResult], false])
    }

    downPhonetic(word){
        var fPath = path.join(Common.getAnkiMediaPath(), `${word}.mp3`)
        // if(!fs.existsSync(fPath)){
        request.get(this.getPhoneticUrl(word)).pipe(fs.createWriteStream(fPath))
            .on('error', function(err){})
            .on('close', () => {})
        // }
    }

    getTimeoutResult(word){
        if(this.subLogType == 'brief'){
            return `${word} timeout`
        }
        else{
            var o = this.getInitResultObject(word)
            return [word, o]
        }
    }

    getBasicResultObject(word, docRoot){
        var oResult = this.getInitResultObject(word)
        try {
            // phonetic, 0:en 1:us
            oResult['basicTrans'] = this.get_baic_trans(docRoot)
            oResult['phonetic'] = this.get_phonetic(docRoot, 1)
            oResult['biExample'] = this.parseBiExample(docRoot)
            // title from Collins
            var sTitle = this.get_title(word, docRoot)
            if (sTitle) {
                oResult['answer'] = this.get_answer(docRoot)
            }
            else{
                // if it is found in collins, use the basic trans
                oResult['title'] = word
                oResult['answer'] = oResult['basicTrans']
            }
        } catch (e) {
            console.log(word + ' is wrong!!!!');
            console.log(e);
            oResult.error = true
        }
        return oResult
    }

    get_baic_trans(docRoot){
        try {
            var root = docRoot.getElementById('phrsListTab')
            var liList = root.getElementsByTagName('li')
            var sList = []
            for (var i = 0; i < liList.length; i++) {
                var str = liList[i].textContent
                sList.push(str)
            }
            return sList.join('\n')
        } catch (e) {
            return 'not found in dict'
        }
    }


    get_phonetic(docRoot, Type){
        try{
            var phoneticNode = docRoot.getElementsByClassName('baav')[0]
            var pronList = this.getByClass('pronounce', phoneticNode)
            if (pronList.length <= Type) {
                var pron = pronList[0]
            }
            else{
                pron = pronList[Type]
            }
            var phonetic = this.getByClass('phonetic', pron)[0]
            return phonetic.textContent
        }
        catch(e){
            return ''
        }
    }
    get_collins_phonetic(docRoot, Type){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle')[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName('h4')[0]
            var phonetic = this.getByClass('additional spell phonetic', head)[0]
            return phonetic.textContent
        } catch (e) {
            return ''
        }
    }

    get_title(word, docRoot){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle')[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName('h4')[0]
            var title = this.getByClass('title', head)[0]
            return title.textContent
        } catch (e) {
            console.log(word + ' is wrong in get_title!!!!');
            console.log(e);
            return ''
        }
    }

    // spring
    get_answer(docRoot){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle trans-container')[0]
            // var wtContainerList = root.getElementsByClassName('wt-container')
            // console.log(wtContainerList.length);
            var rList = {}
            var additionalPattern = docRoot.getElementsByClassName('additional pattern')[0]
            if (additionalPattern) {
                rList['add-pa'] = `++ ${this.trim(additionalPattern.textContent)}\n`
            }
            else{
                rList['add-pa'] = ''
            }
            var tList = []
            for (var i = 0; i < root.children.length; i++) {
                var tmp = {}
                var wtContainer = root.children[i]
                var title = this.getByClass('title trans-tip', wtContainer)[0]
                var sList = []
                if(title && title.textContent){
                    tmp['sub-title'] = this.trim(`${title.textContent}`)
                    sList.push(`-- ${title.textContent}`)
                }
                var liList = wtContainer.getElementsByTagName('li')
                if (liList.length == 0) {
                    sList.push(this.trim(wtContainer.textContent))
                    tmp['sub-content'] = sList
                } else {
                    sList = this.parse_collins_entry_list(liList)
                    tmp['sub-content'] = sList
                }
                tList.push(tmp)
            }
            rList['objlist'] = tList
            return rList
        } catch (e) {
            console.log(e)
            return null
        }
    }

    parse_collins_entry_list(liList){
        var  sList = []
        for (var i = 0; i < liList.length; i++) {
            var li = liList[i]
            var str = this.parse_collins_entry(li)
            if(str != 0) sList.push(str)
        }
        return sList
    }

    parse_collins_entry(li){
        try {
            var trans = this.getByClass('collinsMajorTrans', li)[0]
            var order = this.getByClass('collinsOrder', trans)[0]
            var oTrans = this.get_nextsibling(order)
            var sTrans = this.parseTrans(oTrans)
            var exampleList = this.getByClass('exampleLists', li)
            if (!exampleList || exampleList.length == 0) {
                return `${sTrans}`
            }
            var sExampleList = []
            for (var i = 0; i < exampleList.length; i++) {
                var oExample = exampleList[i]
                var sExample = this.parseExample(oExample)
                sExampleList.push(`• ${sExample}`)
            }
            var finalExample = sExampleList.join('\n')
            return `${sTrans}\n${finalExample}`
        } catch (e) {
            return 0
        }
    }

    parseTrans(oTrans){
        var typeList = this.getByClass('additional', oTrans)
        var tList = []
        for (var i = 0; i < typeList.length; i++) {
            var type = typeList[i]
            var sType = type.textContent
            oTrans.removeChild(type)
            tList.push(sType)
        }
        var typeString = tList.join(' ')
        var sTrans = this.trim(oTrans.textContent)
        return `${typeString} -- ${sTrans} `
    }

    // example
    parseExample(oExample){
        var examples = this.getByClass('examples', oExample)[0]
        var pList = examples.getElementsByTagName('p')
        var sList = []
        for (var i = 0; i < pList.length; i++) {
            var sText = pList[i].textContent
            if(sText != ''){sList.push(sText)}
        }
        return sList.join('\n')
    }

    // 双语例句
    parseBiExample(docRoot){
        try {
            var root = docRoot.getElementById('bilingual')
            var liList = root.getElementsByTagName('li')
            var  sList = []
            for (var i = 0; i < liList.length; i++) {
                var li = liList[i]
                var str = this.parseBiExample1(li)
                sList.push(str)
            }
            return sList.join('\n')
        } catch (e) {
            return ''
        }
    }

    parseBiExample1(li){
        var pList = li.getElementsByTagName('p')
        var sList = []
        for (var i = 0; i < 2; i++) {
            var sText = pList[i].textContent
            if(sText != ''){sList.push(this.trim(sText))}
        }
        return `• ${sList.join('\n')}`
    }

    to_brief_string(o){
        var basicTrans = o['basicTrans'].split('\n').join('  ')
        var sFinal = `${o['title']} ${o['phonetic']} ${basicTrans}`
        return sFinal
    }
    to_single_phonetic(o){
        var basicTrans = o['basicTrans'].split('\n').join('  ')
        o['answer'] = basicTrans
        return o
    }
    to_final_string(o, cigen){
        if(o.timeout){
            return `# ${o.title}\nquery timeout\n${cigen}\n`
        }
        var answer = o.answer
        var rList = []
        var sList = answer['objlist']
        var result
        if (sList) {
            for (var i = 0; i < sList.length; i++) {
                var obj = sList[i]
                var data= obj['sub-content']
                var dice = 2
                for(var j=0,len=data.length;j<len;j+=dice){
                    var sAnswer = data.slice(j,j+dice).join('\n')
                    if(obj['sub-title']){
                        result = `# ${o.title} <${obj['sub-title']}> ${o.phonetic}\n${answer['add-pa']}${-- obj['sub-title']}${sAnswer}\n${cigen}\n\n`
                    }
                    else{
                        result = `# ${o.title} <note> ${o.phonetic}\n${answer['add-pa']}${sAnswer}\n${cigen}\n\n`
                    }
                    rList.push(result)
                }
            }
        }
        else{
            if (o['phonetic']) {
                rList.push(`# ${o.title} ${o['phonetic']}\n${answer}\n${o.biExample}\n${cigen}\n\n`)
            }
            else{
                rList.push(`# ${o.title}\n${answer}\n${o.biExample}\n${cigen}\n\n`)
            }
        }
        return rList.join('\n')
    }


}
