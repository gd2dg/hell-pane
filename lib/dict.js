'use babel'

import request from 'request'
import querystring from 'querystring'
import * as Common from './common'

import Downer from './downer'
import Youdao from './youdao'
import Quword from './quword'

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
        this.cigenUrl = `https://www.quword.com/w/${querystring.escape(word)}`
        this.youdao = new Youdao()
        this.quword = new Quword()
    }

    // functions invoked outside
    // get_brief, fetch, get_single_cigen

    get_brief(word){
        return this.youdao.getBrief(word)
    }

    get_single_phonetic(word){
        // return this.quword.downloadCigen()
        return this.youdao.get_single_phonetic(word)
    }

    get_single_cigen(word){
        return this.quword.downloadCigen(word)
    }

    batchFind(words, callback){
        return this.youdao.batch_find(words, callback)
    }

    batchFindCiGen(words, callback){
        return this.quword.batch_find(words, callback)
    }

    fetch(word, i) {
        return this.youdao.fetch(word, i)
    }

    fetchCigen(word, i) {
        return this.quword.downloadCigen(word)
    }

    get_compare_brief(word){
        return this.download(this.cigenUrl, this.do_get_compare_brief.bind(this))
    }

    do_get_compare_brief(resolve, docRoot){
        this.downPhonetic()
        var sPhonetic = this.get_cigen_pron(docRoot, 1)
        var sTitle = this.word
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

}
