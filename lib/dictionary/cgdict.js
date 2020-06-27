'use babel'

import querystring from 'querystring'
import * as Common from '../common'
import Downer from './downer'

var path = require('path')

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
