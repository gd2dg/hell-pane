# 整体描述
这是一个 atom 编辑器的插件, 主要用于辅助日常的代码，文字编辑工作
自定义block语法, 根据block的描述生成格式化的内容.

## 在编程中的应用
定义一个 fun block， 格式如下
```block
fun,Fun,这是一个函数
seg1,type1,字段1
seg2,type1,字段2
seg3,type1,字段3
```
通过解析， 自动生成 协议描述文件, 主函数, 协议响应函数, 测试代码等

## 在单词学习中的应用
对于一个anki爱好者, 和单词学习者, 一个很实际的需求是 批量制作anki卡片. 有两个很繁琐的问题
* 卡片内容的来源和编辑
* 批量生成可导入的anki数据

可以通过request去网站上抓取单词解释生成 自定义的数据，自定义调整后批量生成可导入数据.

定义一个 word block, 格式如下
```md
# example [ɪg'zæmpl]
1. 
N-COUNT -- An <b>example</b> <b>of</b> something is a particular situation, object, or person that shows that what is being claimed is true. 例子
•  The doctors gave numerous examples of patients being expelled from the hospital.
医生给出了大量病人被逐出医院的实例。
2. 
N-COUNT -- An <b>example</b> <b>of</b> a particular class of objects or styles is something that has many of the typical features of such a class or style, and that you consider clearly represents it. 范例
•  Symphonies 103 and 104 stand as perfect examples of early symphonic construction.
第103和104号交响曲是早期交响乐谱曲的完美范本。
3. 
N-COUNT [表赞许] -- If you refer to a person or their behaviour as an <b>example</b> <b>to</b> other people, you mean that he or she behaves in a good or correct way that other people should copy. 榜样
•  He is a model professional and an example to the younger boys.
他是个模范的专业人员，是年轻人的榜样。
4.
example 例子
ex-, 向外。-em, 拿出，带出，词源sample, exempt.
```
