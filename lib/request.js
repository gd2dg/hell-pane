'use babel';

import Protocol from './proto';
import {PyField} from './field';

export default class Request extends Protocol{

  constructor(name, note, dataList) {
    super(name, note, dataList);
    this.m_Name += '_request';
    this.m_Note += note + '回复';
  }

}
