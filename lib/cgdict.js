'use babel'

import request from 'request'
import querystring from 'querystring'
import xml2js from 'xml2js'
import * as Common from './common'

const jsdom = require('jsdom')
const { JSDOM } = jsdom

var fs = require('fs')
var path = require('path')

import Downer from './downer'

const parseString = xml2js.parseString

export default class CgDict extends Downer{

    constructor() {
        super()
        this.init()
    }

    init() {
        this.rootUrl = 'https://www.cgdict.com/index.php?app=cigen&ac=word'
    }

    gen_url(word){
        return `${this.rootUrl}&w=${querystring.escape(word)}`
    }

    downWords(word){
        var url = this.gen_url(word)
        console.log(url);
        return this.download(url, this.doDownWords.bind(this))
    }

    doDownWords(resolve, docRoot){
        // console.log(liList);
        this.get_origin(docRoot)
    }

    get_phonetic(docRoot, Type){
        var phonetic = this.getByClass('phonetic', docRoot)[0]
        var liList = phonetic.getElementsByTagName('bdo')
        if (liList.length == 1) {
            return liList[0].textContent
        }
        else{
            return liList[1].textContent
        }
    }

    get_origin(docRoot){
        var phonetic = this.getByClass('wpron', docRoot)[0]
        console.log(phonetic.textContent);
        // var liList = phonetic.getElementsByTagName('li')
        // if (liList.length == 1) {
        //     return liList[0].textContent
        // }
        // else{
        //     return liList[1].textContent
        // }
        // for (var i = 0; i < liList.length; i++) {
        //     console.log(liList[i].textContent);
        // }
    }

}
