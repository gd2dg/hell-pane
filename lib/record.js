'use babel';

import Snipets from './snipets';
import {PyField} from './field';

export default class Record extends Snipets{

  // constructor(name, note, fieldList) {
  //   super(name, note);
  // }

  init_data(fieldList){
    super.init_field_list(fieldList, PyField);
  }

  // command 1
  //record模块
  gen_key_data(){
    alert(this.m_filedList);
    let sResult = `(record, '${this.m_Name}')\n`
    return sResult +super.gen_key_data();
  }

}
