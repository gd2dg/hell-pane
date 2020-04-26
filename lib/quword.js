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

const parseString = xml2js.parseString;

export default class Quword extends Downer {

    constructor(word, i) {
        super()
        this.word = word
        this.cigenUrl = `https://www.quword.com/w/${querystring.escape(word)}`
    }

    getBrief(word){
        return this.download(this.cigenUrl, this.do_get_brief.bind(this))
    }

    do_get_brief(resolve, docRoot){
        var sTitle = this.word
        var sPhonetic = this.get_cigen_pron(docRoot, 1)
        var sAnswer = this.get_brief_desc(docRoot)
        var sFinal = `${sTitle} ${sPhonetic}\n${sAnswer}`
        // var sFinal = `${sTitle} ${sPhonetic}`
        resolve(sFinal)
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

    downloadCigen(){
        var oPromise = this.download(this.cigenUrl, this.do_download_cigen.bind(this))
        return oPromise
    }

    do_download_cigen(resolve, docRoot){
        var s = ''
        var r = {}
        var cpron = this.get_cigen_pron(docRoot, 1)
        var sAnswer = this.get_brief_desc(docRoot)
        r['answer'] = sAnswer
        r['phonetic'] = cpron
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


}
