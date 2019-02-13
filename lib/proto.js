'use babel';

import Snipets from './snipets';
import {PyField} from './field';

export default class Protocol extends Snipets{

  constructor(name, note, fieldList) {
    super(name, note);
    super.init_field_list(fieldList, PyField);
  }

  toStr(){
    return `this is a protocol and my name is ${this.m_Name}`
  }

}
