'use babel'

var fs = require('fs')

export function clear_something(){
    const editor = atom.workspace.getActiveTextEditor();
    var re = /•\n/m;
    var rp = ''
    var i = 0
    var j = i
    while(true){
        editor.scan(re, function(Match){
            i++;
            Match.replace('• ')
            Match.stop()
        })
        if (j==i) {
            break
        }
        j=i
    }
    if (i == 0 ) {
        atom.notifications.addWarning('no • happens')
    } else {
        atom.notifications.addSuccess(`merge ${i} lines`)
    }
}

export function changeYouDaoFile(firstLine, content, matchArray, i){
    var configPath = getConfigPath()
    var fs = require('fs')
    if (fs.existsSync(configPath)) {
        var sText = fs.readFileSync(configPath, 'utf-8')
        var result = sText.replace(/\d{10}/, firstLine)
        fs.writeFileSync(configPath, result)
        atom.notifications.addSuccess(`change youdao FileName to  ${firstLine}`)
    }
    atom.notifications.addSuccess(`change youdao FileName to  ${firstLine}`)
}

function getConfigPath(){
    return 'C:\\Users\\gz1305\\.atom\\config.cson'
}

export function openConfig(){
    var configPath = getConfigPath()
    var oPromise = atom.workspace.open(configPath, {'split':'right'})
    oPromise.then(() => {
        var editor = atom.workspace.getActiveTextEditor()
        if(editor){
            var re = /^\s+youdaoName: "\d{10}/
            editor.scan(re, function(match){
                var point = match.range.end
                editor.setCursorScreenPosition(point)
            })
        }
    })
}
