'use babel';

import * as Anki from './anki';
import * as Some from './some';

var modList = [
    {
        'name': 'anki',
        'reg': /^# (.+)/,
        'key': Anki.parseAnki,
    },
    {
        'name': 'some',
        'reg': /\d{10}/,
        'key': Some.changeYouDaoFile,
    },
]

function test(firstLine, content, matchArray) {
    alert(firstLine)
}

export default class opMgr {
    constructor(text) {
        this.m_Text = text
        this.split_data()
    }

    split_data(){
        var blockList = this.m_Text.split(/\n{2,}/)
        this.m_blockList = blockList;
    }

    parse(Type){
        for (var i = 0; i < this.m_blockList.length; i++) {
            var sBlock = this.m_blockList[i]
            if (sBlock) {
                this.do_parse(sBlock, Type, i)
            }
        }
    }

    do_parse(sBlock, Type, index){
        var firstlineEnd = sBlock.indexOf('\n')
        var firstLine;
        if (firstlineEnd == -1) {
            firstLine = sBlock
        }
        else{
            firstLine = sBlock.slice(0, firstlineEnd)
        }
        var content = sBlock.slice(firstlineEnd+1)
        var matchArray
        var rList = [], r
        for (var i = 0; i < modList.length; i++) {
            var oMod = modList[i];
            if ((matchArray = firstLine.match(oMod.reg))!=null) {
                if (Type in oMod && oMod[Type]) {
                    oMod[Type](firstLine, content, matchArray, index)
                }
                else{
                    alert('none operate')
                }
            }
        }
    }
}
