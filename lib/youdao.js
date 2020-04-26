'use babel'

import request from 'request';
import querystring from 'querystring';
import xml2js from 'xml2js';
import * as Common from './common';

const jsdom = require('jsdom');
const iconv = require('iconv-lite');
const { JSDOM } = jsdom;

var fs = require('fs')
var path = require('path')

import Downer from './downer'
import Quword from './quword'

const parseString = xml2js.parseString;

export default class Youdao extends Downer {

    constructor(word, i) {
        super()
        this.word = word
        this.dictUrl = `https://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
        this.phoneticUrl = `https://dict.youdao.com/dictvoice?audio=${querystring.escape(word)}&type=2`
        this.quword = new Quword(word, i)
    }

    getInitResultObject(){
        return {
            'title':this.word,
            'phonetic':'',
            'answer':'not found in dict',
            'link':'',
            'basicTrans':'',
            'cigen':'4.\n'
        }
    }

    getBrief(word){
        return this.download(this.dictUrl, this.do_get_brief.bind(this))
    }

    do_get_brief(resolve, docRoot){
        var oResult = this.getBasicResultObject(docRoot)
        var basicTrans = oResult['basicTrans'].split('\n').join('  ')
        var sFinal = `${oResult['title']} ${oResult['phonetic']} ${basicTrans}`
        // var sFinal = `${sTitle} ${sPhonetic}`
        resolve(sFinal)
    }

    fetch(word, i) {
        this.idx = i
        return this.download(this.dictUrl, this.do_download_dict.bind(this))
    }

    do_download_dict(resolve, docRoot){
        // query cigen
        var oResult = this.getResult(docRoot)
        // var oPromise = this.download(this.haiUrl, this.do_download_hai_cigen.bind(this))
        var oPromise = this.quword.downloadCigen()
        var winnerPromise = new Promise(function (res) { setTimeout(function () { res({timeout:true})}, 20000) })
        Promise.race([oPromise, winnerPromise]).then(function(r){
            if(r.timeout){
                oResult['cigen'] = `4.\n${this.word}`
            }
            else{
                oResult['cigen'] = r['cigen']
                if(r['phonetic'] && r['phonetic'] != ''){ oResult['phonetic'] = r['phonetic'] }
            }
            this.logWord(oResult, r.timeout)
            var sFinal = this.to_final_string(oResult)
            resolve(sFinal)
        }.bind(this))
    }

    to_final_string(o){
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
                        result = `# ${o.title} <${obj['sub-title']}> ${o.phonetic}\n${answer['add-pa']}${-- obj['sub-title']}${sAnswer}\n${o.cigen}\n\n`
                    }
                    else{
                        result = `# ${o.title} <note> ${o.phonetic}\n${answer['add-pa']}${sAnswer}\n${o.cigen}\n\n`
                    }
                    rList.push(result)
                }
            }
        }
        else{
            if (o['phonetic']) {
                rList.push(`# ${o.title} ${o['phonetic']}\n${answer}\n${o.biExample}\n${o.cigen}\n\n`)
            }
            else{
                rList.push(`# ${o.title}\n${answer}\n${o.biExample}\n${o.cigen}\n\n`)
            }
        }
        return rList.join('\n')
    }


    getResult(docRoot){
        // down basic object
        var oResult = this.getBasicResultObject(docRoot)
        // down phonetic // if (oResult)
        this.downPhonetic()
        return oResult
    }

    downPhonetic(){
        var fPath = path.join(Common.getAnkiMediaPath(), `${this.word}.mp3`)
        // if(!fs.existsSync(fPath)){
        request.get(this.phoneticUrl).pipe(fs.createWriteStream(fPath))
            .on('error', function(err){})
            .on('close', () => {})
        // }
    }


    getBasicResultObject(docRoot){
        var oResult = this.getInitResultObject()
        try {
            // phonetic, 0:en 1:us
            oResult['basicTrans'] = this.get_baic_trans(docRoot)
            oResult['phonetic'] = this.get_phonetic(docRoot, 1)
            oResult['biExample'] = this.parseBiExample(docRoot)
            // title from Collins
            var sTitle = this.get_title(docRoot)
            if (sTitle) {
                oResult['answer'] = this.get_answer(docRoot)
            }
            else{
                // if it is found in collins, use the basic trans
                oResult['title'] = this.word
                oResult['answer'] = oResult['basicTrans']
            }
        } catch (e) {
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

    get_title(docRoot){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle')[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName('h4')[0]
            var title = this.getByClass('title', head)[0]
            return title.textContent
        } catch (e) {
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
        var root = docRoot.getElementById('bilingual')
        var liList = root.getElementsByTagName('li')
        var  sList = []
        for (var i = 0; i < liList.length; i++) {
            var li = liList[i]
            var str = this.parseBiExample1(li)
            sList.push(str)
        }
        return sList.join('\n')
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

}
