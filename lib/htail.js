'use babel'

import * as Common from './common'

var fs = require('fs')


export function save_head(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        var range = editor.getCurrentParagraphBufferRange()
        var txt = editor.getTextInRange(range)
        var head = get_head(txt)
        var tail = get_tail(txt)
        if (head) {
            global.head = head
            global.tail = tail
            atom.notifications.addSuccess(`${head}`)
            atom.notifications.addSuccess(`${tail}`)
        }
        else{
            atom.notifications.addWarning('unmatch word block!!!!')
        }
    }
}

export function set_head(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        var range = editor.getCurrentParagraphBufferRange()
        var txt = editor.getTextInRange(range)
        if (global.head) {
            var newtxt = `${global.head}\n${txt}\n${global.tail}`
            editor.setTextInBufferRange(range, newtxt)
        }
        else{
            atom.notifications.addWarning('there is no head, please gen a new one!!')
        }
    }
}

export function fill_note(){
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
        var range = editor.getCurrentParagraphBufferRange()
        var txt = editor.getTextInRange(range)
        var head = txt.split('\n')[0]
        var tail = txt.split('\n').slice(1)
        var headReg = /^# (\w+)\s*(<.*>)?(-)?\s+(\[.*\]|\/.*\/)?/
        var mArray
        if((mArray = head.match(headReg)) == null){
            atom.notifications.addWarning('unmatch word block!!!!')
            return
        }
        var sOringin = mArray[1]
        if(mArray[4]){
            var sPhonetic = mArray[4]
        }
        else{
            sPhonetic = ''
        }
        var sFill = editor.getSelectedText()
        if (sFill) {
            var newHead = `# ${sOringin} <${sFill}>- ${sPhonetic}`
        }
        else{
            newHead = head
        }
        var newtxt = `${newHead}\n${tail.join('\n')}`
        editor.setTextInBufferRange(range, newtxt)
    }
}


function get_head(txt){
    var lines = txt.split('\n')
    if (lines.length < 2) {
        return ''
    }
    var head = lines[0]
    var transform = lines[1]
    var headReg = /^# (\w+)\s*(<.*>)?(-)?\s+(\[.*\]|\/.*\/|.*)?/
    var mArray
    if((mArray = head.match(headReg)) == null){
        return ''
    }
    var transReg = /^\+\+ (.*)/
    if((mArray = transform.match(transReg)) != null){
        return `${head}\n${transform}`
    }
    return head
}

function get_tail(txt){
    var tails = txt.split('\n4.\n')
    if (tails.length > 1) {
        return `4.\n${tails[1]}`
    }
    return ''
}
