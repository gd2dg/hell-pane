'use babel'

import querystring from 'querystring';
import * as Common from '../common';
import Downer from './downer'

export default class Quword extends Downer {

    constructor() {
        super()
        this.batchPerNum = 5
        this.batchTimeOut = 8000
        this.logType = 'cigen'
    }
    getCiGenUrl(word){
        return `https://www.quword.com/w/${querystring.escape(word)}`
    }

    getTimeoutResult(word){
        if(this.subLogType == 'brief'){
            return `${word} timeout`
        }
        else{
            var o = this.getInitResultObject(word)
            return [word, o]
        }
        // return [word, '4.\ntimeout']
    }

    setBatchProvider(type){
        this.subLogType = 'cigen'
        this.batchProvider = function (word){
            return this.downloadCigen(word)
        }
    }

    downloadCigen(word){
        return this.download(this.getCiGenUrl(word), this.do_download_cigen.bind(this, word))
    }

    do_download_cigen(word, resolve, docRoot){
        var r = this.getInitResultObject(word)
        var cpron = this.get_cigen_pron(docRoot, 1)
        r['phonetic'] = cpron
        var sAnswer = this.get_brief_desc(docRoot)
        r['answer'] = sAnswer
        var ciGen = this.parseCiGen(word, docRoot)
        r['cigen'] = ciGen
        resolve([[word, r], false])
    }

    parseCiGen(word, docRoot){
        var s = '4.\n'
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
            s = `${s}${mSpan.textContent}\n${sCigen}`
        } catch (e) {
            // console.log(word);
            // console.log(e);
        }
        return s
    }

    get_brief_desc(docRoot){
        try {
            var root = docRoot.getElementById('yd-word-meaning')
            var liList = root.getElementsByTagName('li')
            var rList = []
            for (var li of liList) {
                rList.push(li.textContent)
            }
            return rList.join('\n')
        } catch (e) {
            return 'not found in dict'
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


}
