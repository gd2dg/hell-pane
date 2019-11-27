'use babel'

export default class Statistics {

    constructor(sNote) {
        this.init(sNote)
    }

    init(sNote) {
        this.s_note = sNote
    }

    begin(){
        this.starTime = Date.parse(new Date())
        atom.notifications.addSuccess(`hell pane starts ${this.s_note}...`)
    }

    finish(sAddNotify){
        sAddNotify = sAddNotify?sAddNotify:''
        this.endTime = Date.parse(new Date())
        var diff = (this.endTime - this.starTime) / 1000
        atom.notifications.addSuccess(`hell-pane has finished ${this.s_note} in ${diff} seconds ${sAddNotify}!!`)
    }

}
