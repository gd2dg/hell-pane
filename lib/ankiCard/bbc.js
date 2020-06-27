'use babel'

exports.parseBBCListening = function () {
    const editor = atom.workspace.getActiveTextEditor();
    if(editor){
        const selection = editor.getText()
        if (selection) {
            var Res = parse(selection)
            editor.setText(Res)
            atom.notifications.addSuccess('parse bbc complete');
        }
        else{
            atom.notifications.addError('bad selection for parsing bbc listening matirial!!!!');
        }
    }
}

function parse(text){
    var lines = text.split('\n')
    var sentences = ['-'.repeat(100), '# 牛逼的句子']
    var words = ['# 陌生的单词及短语']
    var spellWords = ['# 拼写错误']
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var regex0 = /^-+/
        if((matchArray = line.match(regex0)) != null){
            break
        }
        var regex = /^#\s(.*)/
        var matchArray
        if((matchArray = line.match(regex)) != null){
            sentences.push(line)
        }
        var regex2 = /^## (.*)/
        if((matchArray = line.match(regex2)) != null){
            words.push(matchArray[1])
        }
        var regex3 = /^### (.*)/
        if((matchArray = line.match(regex3)) != null){
            spellWords.push(matchArray[1])
        }
    }
    var rList = sentences.concat(words, spellWords)
    return lines.slice(0, i).join('\n') + '\n' + rList.join('\n\n')
}
