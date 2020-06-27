'use babel';

export default class Field{
  constructor(name, type, note) {
    this.m_Name = name;
    this.m_Note = note;
    this.m_Type = type;
  }

  ToStr(){
    let sStr = 'my name is '+this.m_Name+'\n';
    sStr +=  'my type is '+this.m_Type+'\n';
    sStr +=  'my note is '+this.m_Note+'\n';
    return sStr
  }

  toErlEqual(){
    return `${this.name} = ${this.name.toUpperCase()}`;
  }

  init_data(dataList){}

}

export class SqlField extends Field{

  constructor(name, type, note) {
    super(name, type, note);
  }

  // toStr(){}

}

export class PyField extends Field{

  constructor(name, type, note) {
    super(name, type, note);
  }

  // toStr(){
  //   return `('${this.name}', '${this.type}')#${this.note}`;
  // }

}
