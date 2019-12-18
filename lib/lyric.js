'use babel'

import * as Common from './common'

var fs = require('fs')


export function gen_lyric_cards(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        let selectedText = editor.getSelectedText()
        var blockList = selectedText.split(/\n{2,}/)
        var resultList = blockList.map(function(sBlock){
            return gen_a_lyric_card(sBlock)
        })
        var result = resultList.join('\n')
        atom.notifications.addSuccess('gen lyric successfully')
        var fPath = Common.getYouDaoOutPutFilePath()
        fs.writeFileSync(fPath, result)
        atom.workspace.open(fPath, {split:'down'})
    }
}

// line1
// line2
// line3
// #
// asssss

function gen_a_lyric_card(sBlock){
    var mList = sBlock.split('#\n')
    if(mList.length == 1){
        var sFirst=mList[0]
        var sExtra = ''
    }
    else if (mList.length == 2) {
        sFirst = mList[0]
        sExtra = mList[1]
    }
    else {
        return ''
    }
    var firstList = sFirst.trim().split('\n').map(function(elem, idx, array){
        var matchArray
        if ((matchArray = elem.match(/^# (.*)/) ) != null) {
            return matchArray[1]
        }
        this.idx = idx == 0 ? 1 : this.idx + 1
        return `{{c${this.idx}::${elem}}}`
    }.bind(this))

    var r = `${firstList.join('<br>')}\t${sExtra.replace('\n', '<br>')}\ttempTags`
    return r

}
