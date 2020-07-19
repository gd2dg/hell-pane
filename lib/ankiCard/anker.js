'use babel'

import request from 'request';
import querystring from 'querystring';
import * as Common from '../common';
import * as Archive from '../dictionary/archive';

var fs = require('fs')
var path = require('path')

class AnkiEntry{
    constructor(){
        this.init()
    }

    init(){
        this.type = '',
        this.chiTrans = '',
        this.enTrans = '',
        this.note = ''
        this.exampleList = []
        this.otherList = []
        this.paraList = []
    }

    parse(){
        var otherList = []
        var exampleList = []
        var cigenList
        var matchArray, index
        for (var i = 0; i < this.paraList.length; i++) {
            var line = this.paraList[i]
            if(!line) continue
            var exampRegx = /•\s+.*/
            if ((matchArray = line.match(exampRegx)) != null) {
                if(i+1<this.paraList.length){
                    exampleList.push({'a':line, 'b':this.paraList[i+1]})
                }
                else
                    exampleList.push({'a':line, 'b':''})
                i=i+1
                continue
            }
            else{
                otherList.push(line)
            }
        }
        this.exampleList = exampleList
        this.otherList = otherList
    }

    toExampleHtml(){
        var l = []
        for (var example of this.exampleList) {
            var aHtml = `<p class='example'>${example.a}</p>`
            var bHtml = `<p class='example-other'>${example.b}</p>`
            l.push(`${aHtml}${bHtml}`)
        }
        return l.join(' ')
    }

    toHtml(){
        this.parse()
        // 判断是否有翻译需要生成
        // gen_translation_card(o)
        var aList = []
        // 1. 例子
        if(this.exampleList.length > 0){
            aList.push(this.toExampleHtml())
        }
        // 2. 类型
        if(this.type){
            var sTypeHtml = `<span class="w-type">${this.type}</span>`
            aList.push(sTypeHtml)
        }
        // 3. 中文翻译
        if(this.chiTrans){
            var sChiTransHtml = `<span class="chi-trans">${this.chiTrans}</span>`
            aList.push(sChiTransHtml)
        }
        // 4. 中文解释
        if(this.note){
            var sNoteHtml = `<div class="chi-trans-detail">${this.note}</div>`
            aList.push(sNoteHtml)
        }
        // 5. 英文解释
        if(this.enTrans){
            if(!this.paraList || this.paraList.length == 0 ){
                var sEnTransHtml = `<p class='example-dir'>${this.enTrans}</p>`
            }
            else{
                sEnTransHtml = `<p class="en-trans">${this.enTrans}</p>`
            }
            aList.push(sEnTransHtml)
        }
        // 6. 其他内容
        if(this.otherList.length > 0){
            var hOther = `<p class='other'>${this.otherList.join('<br>')}</p>`
            aList.push(hOther)
        }
        if(aList.length > 0){
            return `<div> ${aList.join(' ')} </div> `
        }
        else{
            return ''
        }
    }


}

export default class Anki {

    constructor(){
        this.init()
    }

    init(){
        this.word = '',
        this.oringin = '',
        this.phonetic = '',
        this.additionaPa = '',
        this.answer = '',
        this.cigen = '',
        this.entryList = [],
        this.tagName = Common.getFileName(),
        this.isTerm = false
    }

    parse(headLine, content){
        this.parseHead(headLine)
        this.parseAnswer(content)
        if(this.oringin && Archive)
            Archive.insert(this.oringin)
        return this.toResult()
    }

    toResult(){
        var l = [
            this.word,//1
            this.oringin,//2
            this.toPhoneticHtml(),//3
            this.toAddtionalPaHtml(),//4
            this.toAnswerHtml(),//5
            this.toCiGenHtml(),//6
            '',//7
            this.tagName//8
        ]
        var result = l.join('\t')
        return result
    }

    toPhoneticHtml(){
        if (!this.isTerm) {
            return `<span id="phonetic"> ${this.phonetic} [sound:${this.oringin}.mp3] </span> `
        }
        else
            return `<span id="phonetic"> ${this.phonetic}</span> `
    }

    toAddtionalPaHtml(){
        if(this.additionaPa)
            return `<div id="additional-pattern"> ${this.additionaPa} </div>`
        return ''
    }

    toCiGenHtml(){
        if(this.cigen)
            return `<div class="other"> ${this.cigen.replace(/\n/g, '<br>')} </div>`
        return ''
    }


    toAnswerHtml(){
        var l = []
        for (var entry of this.entryList) {
            l.push(entry.toHtml())
        }
        return l.join(' <br> ')
        // return `<div id="additional-pattern"> ${this.additionaPa} </div>`
    }

    parseNote(sNote){
        if(sNote)
            return sNote.replace(/[<>]/g, '')
        return null
    }

    parseHead(title){
        var list = title.split(' ')
        //                  1       2     3           4
        var headReg = /^([-\w\s]*)(<.*>)?(-)?\s*(\[.*\]|\/.*\/)?/
        var mArray
        if((mArray = title.match(headReg)) != null){
            var sOringin = mArray[1].trim()
            var sNote = this.parseNote(mArray[2])
            var sIgnore = mArray[3]
            var sPhonetic = mArray[4]
            //
            if(sIgnore && sNote){
                // 存在note，并且有忽略标志， 则取note为 title
                this.word = sNote
            }
            else if (sNote && sNote != 'note') {
                // 存在note，没有忽略标志， 则取合并为 title
                this.word = `${sOringin} ${sNote}`
            }
            else{
                // 取word为title
                this.word = sOringin
            }
            //
            var isTerm = sOringin.split(' ').length > 1
            this.isTerm = isTerm
            if(!isTerm)
                this.oringin = sOringin
            //
            this.phonetic = sPhonetic
        }
        else {
            this.word = title
        }
    }

    parseAnswer(content){
        // %%
        if(content.length < 1) return ''
        // cigen
        var t =  content.split('4.')
        if(t.length > 1)
            this.cigen = t[1].trim()
        var lines = t[0].split('\n')
        // 单词变形
        if(this.parseAddtionalPa(lines[0])){
            lines = lines.slice(1)
        }
        // 词条
        this.parseContent(lines)
    }

    parseAddtionalPa(line) {
        var addPaReg = /^\+\+ (.*)/
        var matchArray
        if((matchArray = line.match(addPaReg)) != null){
            this.additionaPa = matchArray[1]
            return true
        }
        return false
    }

    parseContent(lines){
        var obj = new AnkiEntry()
        for (var i = 0; i < lines.length; i++) {
            var sLine = lines[i]
            if(!sLine) continue
            var matchArray
            // 首行确定 格式: 词汇类型 -- 英文解释 中文解释
            var matchFisrt = sLine && (matchArray = sLine.match(/(.*) -- (.*)/)) != null
            if(matchFisrt){
                // 遇到新的一行
                // 处理之前的块
                if(i>0) this.entryList.push(obj)
                // 清空累积的行
                obj = new AnkiEntry()
                var sType = matchArray[1]
                // 词类型
                obj.type = sType
                var sTrans = matchArray[2]
                var sEnTrans = sTrans
                var sChiTrans = ''
                var regex = /([^\u4e00-\u9fa5\\(]*)([\u4e00-\u9fa5\\(].*)/
                matchArray = sTrans.match(regex)
                if(matchArray!=null){
                    sEnTrans = matchArray[1]
                    sChiTrans = matchArray[2]
                }
                // 英文解释
                obj.enTrans = sEnTrans
                // 中文解释
                obj.chiTrans = sChiTrans
            }
            else if(sLine && (matchArray = sLine.match(/^## (.*)/)) != null){
                obj.note = matchArray[1]
            }
            else{
                obj.paraList.push(sLine)
            }
        }
        // 处理最后一个
        // sBlock = gen_word_block_html(obj, indx)
        // if(sBlock) resultList.push('<br>'+sBlock)
        this.entryList.push(obj)
    }

    // gen_translation_card(o){
    //     if(o && o.note && o.enTrans){
    //         var sText = `${o.note}\t${o.enTrans}\t${o.word} ${o.phonetic} ${o.chiTrans}\t\t\t${o.tag}\n`
    //         var transPath = Common.getYouDaoOutPutTransPath()
    //         if (fs.existsSync(transPath)) {
    //             fs.appendFileSync(transPath, sText)
    //         }else{
    //             fs.writeFileSync(transPath, sText)
    //         }
    //     }
    // }

}
