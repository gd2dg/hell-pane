'use babel';

export default class Mod {
  constructor(name, note, type) {
    this.m_Name = name;
    this.m_Note = note;
    this.m_Type = type;
  }

  init_data(dataList){}

  gen_key_data(){
    return 'this is mod key data str';
  }
}
