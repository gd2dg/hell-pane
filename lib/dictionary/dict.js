'use babel'

import Youdao from './youdao'
import Quword from './quword'

var fs = require('fs')
var path = require('path')

export default class dict {

    constructor() {
        this.init()
    }

    init() {
        this.youdao = new Youdao()
        this.quword = new Quword()
    }

    // functions invoked outside
    // get_brief, fetch, get_single_cigen

    batchFind(words, callback){
        return this.youdao.batchFind('basic', words, callback)
    }

    getBrief(words, callback){
        return this.youdao.batchFind('brief', words, callback)
    }

    get_single_phonetic(word, callback){
        return this.youdao.batchFind('phonetic', word, callback)
    }

    batchFindCiGen(words, callback){
        return this.quword.batchFind('cigen', words, callback)
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

    to_brief_string(o){
        return this.youdao.to_brief_string(o)
    }

    to_single_phonetic(o){
        return this.youdao.to_single_phonetic(o)
    }

    to_final_string(o, oCigen){
        var cigen = oCigen['cigen']
        return this.youdao.to_final_string(o, cigen)
    }

}
