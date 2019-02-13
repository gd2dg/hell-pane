'use babel';

import Protocol from './proto';

export default class Reply extends Protocol{
  constructor(name, note, dataList) {
    super(name, note, dataList);
    this.m_Name += '_reply';
    this.m_Note += note + '回复';
  }

  ToPyString(){
    console.log('i\'m a py reply\n');
  }

}
