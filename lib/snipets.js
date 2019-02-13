'use babel';

import * as Common from './common';
import Field from './field';
import Mod from './mod';

export default class Snipets extends Mod{
  constructor(name, note) {
    super(name,note);
    this.m_filedList = [];
  }

  init_field_list(fieldList, Class){
    for (var i = 0; i<fieldList.length; i++){
      let sStr = fieldList[i];
      if(sStr){
        alert(sStr);
        var field = Common.create_mod_by_str(Class, sStr);
        this.m_filedList.push(field);
      }
    }
  }

  gen_key_data(){
    let sList = [];
    for (var i = 0; i < this.m_filedList.length; i++) {
      // get str of all field
      let sStr = '\t'+this.m_filedList[i].ToStr();
      sList.push(sStr);
    }
    return sList.join('\n')
  }

  toErlRecord(){ }

  toStr(){}
}
