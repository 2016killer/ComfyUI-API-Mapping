# ComfyUI-API-Mapping
使用方法:
1.编写检索规则：
  offset:索引的偏移，比如检索的索引是["7","inputs","seed","Ksampler"],offset=-1,那结果就是["7","inputs","Ksampler"],offset=0,就和原始的一样
  value:要检索的目标，可以是输入的名字或者输入值
  id_rule:过滤规则，比如node._meta.title=="KSampler"就是只在KSampler类型节点检测。

按下保存API按钮，按下F12打开控制台可以看到调试信息，确认无误后保存。
![image](https://github.com/2016killer/ComfyUI-API-Mapping/assets/154417659/4b5060ac-2011-47b1-9206-c1712a9f9041)
![image](https://github.com/2016killer/ComfyUI-API-Mapping/assets/154417659/4e2bc4af-6a98-4c71-8eec-857a13e2640a)

