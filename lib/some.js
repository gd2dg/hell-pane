'use babel'

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
