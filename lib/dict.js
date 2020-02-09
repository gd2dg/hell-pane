'use babel'

import request from 'request'
import querystring from 'querystring'
import * as Common from './common'

import Downer from './downer'

const jsdom = require('jsdom')
const iconv = require('iconv-lite')
const { JSDOM } = jsdom

var fs = require('fs')
var path = require('path')

export default class dict extends Downer {

    constructor(word, i) {
        super()
        this.init(word, i)
    }

    init(word, i) {
        this.idx = i
        this.word = word
        this.dictUrl = `https://dict.youdao.com/w/eng/${querystring.escape(word)}/#keyfrom=dict2.index.suggest`
        this.cigenUrl = `https://www.youdict.com/w/${querystring.escape(word)}`
        this.phoneticUrl = `https://dict.youdao.com/dictvoice?audio=${querystring.escape(word)}&type=2`
    }

    // functions invoked outside
    // get_brief, fetch, get_single_cigen

    get_compare_brief(word){
        return this.download(this.cigenUrl, this.do_get_compare_brief.bind(this))
    }
    do_get_compare_brief(resolve, docRoot){
        this.downPhonetic()
        var sPhonetic = this.get_cigen_pron(docRoot, 1)
        var sTitle = this.word
        // var sPhonetic = this.get_phonetic(docRoot, 1)
        var sAnswer = this.get_compare_brief_desc(docRoot)
        var oFinal = {
            'title':sTitle,
            'phonetic':sPhonetic,
            'data':sAnswer
        }
        resolve(oFinal)
    }
    get_compare_brief_desc(docRoot){
        try {
            var root = docRoot.getElementById('yd-word-meaning')
            var liList = root.getElementsByTagName('li')
            var rList = []
            for (var i = 0; i < liList.length; i++) {
                var m = liList[i]
                rList.push(m.textContent)
            }
            return rList.join('\n')
        } catch (e) {
            return 'not found in dict'
        }
    }

    get_brief(word){
        return this.download(this.cigenUrl, this.do_get_brief.bind(this))
    }
    do_get_brief(resolve, docRoot){
        var sPhonetic = this.get_cigen_pron(docRoot, 1)
        var sTitle = this.word
        // var sPhonetic = this.get_phonetic(docRoot, 1)
        var sAnswer = this.get_brief_desc(docRoot)
        var sFinal = `${sTitle} ${sPhonetic} ${sAnswer}`
        // var sFinal = `${sTitle} ${sPhonetic}`
        resolve(sFinal)
    }
    get_brief_desc(docRoot){
        try {
            var root = docRoot.getElementById('yd-word-meaning')
            return root.getElementsByTagName('li')[0].textContent
        } catch (e) {
            return 'not found in dict'
        }
    }

    get_single_cigen(word){
        return this.download(this.cigenUrl, this.do_download_cigen.bind(this))
    }

    do_download_cigen(resolve, docRoot){
        var s = ''
        var r = {}
        var cpron = this.get_cigen_pron(docRoot, 1)
        var sAnswer = this.get_brief_desc(docRoot)
        r['answer'] = sAnswer
        r['pron'] = cpron
        try {
            var wpron = docRoot.getElementById('yd-ciyuan')
            var mSpan = wpron.getElementsByTagName('span')[0]
            var cList = wpron.getElementsByTagName('p')
            var cgList = []
            for (var i = 0; i < cList.length; i++) {
                var mP = cList[i]
                cgList.push(mP.textContent.replace(/\*/g, ''))
            }
            var sCigen = cgList.join('\n')
            s = `4.\n${mSpan.textContent}\n${sCigen}`
            r['cigen'] = s
        } catch (e) {
            r['cigen'] = '4.'
        } finally {
            resolve(r)
        }
    }

    get_cigen_pron(docRoot, type){
        try {
            var root = docRoot.getElementById('yd-word-pron')
            var str = root.textContent.replace(/\s/, '')
            var reg = /英\s*(.*)\s+美\s*(.*)/
            // var reg = 1
            var matchArray
            if((matchArray = str.match(reg)) != null){
                var uk = matchArray[1]
                var us = matchArray[2]
                us = !us ? uk:us
                return type == 1? us : uk
            }
            else{
                return ''
            }
        } catch (e) {
            return ''
        }
    }

    fetch(word, i) {
        this.idx = i
        return this.download(this.dictUrl, this.do_download_dict.bind(this))
    }

    do_download_dict(resolve, docRoot){
        var oResult = this.getBasicResultObject(docRoot)
        // down phonetic
        if (oResult) this.downPhonetic()
        // query cigen
        var oPromise = this.download(this.cigenUrl, this.do_download_cigen.bind(this))
        var winnerPromise = new Promise(function (res) { setTimeout(function () { res({timeout:true})}, 20000) })
        Promise.race([oPromise, winnerPromise]).then(function(r){
            if(r.timeout){
                global.tmout = !global.tmout ? 1: global.tmout + 1
                oResult['cigen'] = `4.\n${this.word}`
                var notifyStr = `${this.idx}: ${oResult['title']} timeout!!, already num ${global.already}, time_out_num:${global.tmout}`
            }
            else{
                global.already = !global.already ? 1: global.already + 1
                oResult['cigen'] = r['cigen']
                // console.log(r);
                if(r['pron'] && r['pron'] != ''){ oResult['phonetic'] = r['pron'] }
                notifyStr = `${this.idx}: ${oResult['title']} is done!!, already num ${global.already}, time_out_num:${global.tmout}`
            }
            console.log(notifyStr)
            var sFinal = this.to_final_string(oResult)
            resolve(sFinal)
        }.bind(this))
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
            oResult['phonetic'] = this.get_phonetic(docRoot, 1)
            var biExample = this.parseBiExample(docRoot)
            oResult['biExample'] = biExample
            // title
            var sTitle = this.get_title(docRoot)
            if (sTitle) {
                // answer
                oResult['answer'] = this.get_answer(docRoot)
            }
            else{
                // answer
                oResult['title'] = this.word
                oResult['answer'] = this.get_baic_trans(docRoot)
            }
        } catch (e) {
            oResult.error = true
        }
        return oResult
    }

    getInitResultObject(){
        return {
            'title':this.word,
            'phonetic':'',
            'answer':'not found in dict',
            'link':''
        }
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
                for(var j=0,len=data.length;j<len;j+=3){
                    var sAnswer = data.slice(j,j+3).join('\n')
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

    get_phonetic(docRoot, Type){
        try {
            var root = docRoot.getElementsByClassName('collinsToggle')[0]
            var wtContainer = this.getByClass('wt-container', root)[0]
            var head = wtContainer.getElementsByTagName('h4')[0]
            var phonetic = this.getByClass('additional spell phonetic', head)[0]
            return phonetic.textContent
        } catch (e) {
            try{
                var phoneticNode = docRoot.getElementsByClassName('baav')[0]
                var pron = this.getByClass('pronounce', phoneticNode)[Type]
                phonetic = this.getByClass('phonetic', pron)[0]
                return phonetic.textContent
            }
            catch(e){
                return ''
            }
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
