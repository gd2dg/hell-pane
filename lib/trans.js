'use babel';

import request from 'request';
import querystring from 'querystring';
import * as Common from './common';

import Downer from './downer'

export default class Trans extends Downer{

    constructor() {
        super()
        this.init()
    }

    getUrl(words) {
        return this.dictUrl = `http://dict.youdao.com/w/${querystring.escape(words)}/#keyfrom=dict2.top`
    }

    getTranslation(){
        let editor = atom.workspace.getActiveTextEditor();
        if (editor) {
            let selectedText = editor.getSelectedText()
            if (!selectedText) {
                var cursor = editor.getLastCursor()
                selectedText = editor.getTextInBufferRange(cursor.getCurrentLineBufferRange())
            }
            this.getTrans(this.cleanInquiringWords(selectedText))
            return
        }
        atom.notifications.addError('no data selected, please select text at first!')
    }

    cleanInquiringWords(sLine){
        var matchArray
        if ((matchArray = sLine.match(/(.*) -- (.*)/)) != null) {
            var sTrans = matchArray[2]
            var regex = /([^\u4e00-\u9fa5]*)([\(\u4e00-\u9fa5].*)/
            matchArray = sTrans.match(regex)
            if(matchArray!=null){
                sLine = matchArray[1]
            }
        }
        var withoutHtml = sLine.replace(/<\/?b>/g, '')
        return withoutHtml
    }

    getTrans(sLine){
        var url = this.getUrl(sLine)
        var exec = this.doDownTransInLine.bind(this)
        this.downWords(url, exec).then(function(data){
            this.doGetTrans(data)
        }.bind(this))
    }

    doGetTrans(data){
        let editor = atom.workspace.getActiveTextEditor();
        var sResult = `\n## ${data}`
        if (editor) {
            editor.moveToEndOfLine()
            editor.insertText(sResult)
        }
        atom.clipboard.write(sResult)
    }

    downWords(url, exec){
        return this.download(url, exec);
    }

    doDownTransInLine(resolve, docRoot){
        var div = docRoot.getElementById('fanyiToggle')
        if(div){
            var pList = div.getElementsByTagName('p')
            var sResult
            if (pList && pList.length >= 2) {
                sResult = pList[1].textContent
            } else {
                sResult = 'not found!!'
            }
            resolve(sResult)
        }
        else{
            this.doDownTransInWord(resolve, docRoot)
        }
    }

    doDownTransInWord(resolve, docRoot){
        var div0 = docRoot.getElementById('phrsListTab')
        var div = this.getByClass('trans-container', div0)[0]
        var pList =  this.getByClass('wordGroup', div)
        var rList = []
        pList.forEach(function(item){
            rList.push(this.trim(item.textContent))
        }.bind(this))
        var sResult = rList.join('\n')
        resolve(sResult)
    }

// example:If you have an agile mind, you think quickly and intelligently.
// hello

}
